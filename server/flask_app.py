from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import logging
import json
import time
import uuid
import hmac
import hashlib
import subprocess
import sys
from music_service import music_service

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/tmp/mesa_digital_app.log',
    filemode='a'
)

# Log de inicialização
logging.info("Inicializando aplicação Flask do Mesa Digital")

# Detectar ambiente
is_production = 'PYTHONANYWHERE_DOMAIN' in os.environ or 'pythonanywhere' in os.environ.get('HOSTNAME', '')
if is_production:
    logging.info("Rodando em ambiente de produção (PythonAnywhere)")
else:
    logging.info("Rodando em ambiente de desenvolvimento local")

# Caminho para a pasta do projeto
project_dir = os.environ.get('PROJECT_DIR', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
logging.info(f"Diretório do projeto: {project_dir}")

# Verificar pasta build
static_folder = os.path.join(project_dir, 'build')
if not os.path.exists(static_folder):
    logging.warning(f"AVISO: Pasta build não encontrada em: {static_folder}")
    # Em produção, pode ser necessário criar a pasta build manualmente
    if is_production:
        os.makedirs(static_folder, exist_ok=True)
        logging.info(f"Pasta build criada em: {static_folder}")
        
        # Criar index.html básico para debug
        index_path = os.path.join(static_folder, 'index.html')
        if not os.path.exists(index_path):
            with open(index_path, 'w') as f:
                f.write("""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Mesa Digital - Carregando...</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <h1>Mesa Digital</h1>
                    <p>Aplicação em inicialização ou reconstrução...</p>
                    <div class="loader"></div>
                    <p>Atualize a página em alguns minutos.</p>
                </body>
                </html>
                """)
            logging.info("Criado index.html temporário para debug")

# Inicializar aplicação Flask
try:
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'mesa_digital_secret_key')
    
    # Configurar Socket.IO com opções corretas para PythonAnywhere
    socketio = SocketIO(
        app, 
        cors_allowed_origins="*",
        async_mode='threading'  # Usar threading em vez de eventlet/gevent no PythonAnywhere
    )
    
    # Armazenamento em memória para as salas (em produção, use um banco de dados)
    rooms = {}
    user_room_map = {}
    
    logging.info("Flask e Socket.IO inicializados com sucesso")
except Exception as e:
    logging.error(f"Erro ao inicializar Flask/SocketIO: {str(e)}")
    logging.exception(e)
    raise

# ----- Rotas da API -----

@app.route('/')
def serve_frontend():
    """Servir a aplicação React."""
    logging.info("Requisição recebida para rota principal '/'")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/webhook/github', methods=['POST'])
def github_webhook():
    """Endpoint para webhook do GitHub que dispara a atualização automática"""
    logging.info("Webhook recebido na rota /webhook/github")
    
    # Verificar Secret (se configurado)
    secret = os.environ.get('GITHUB_WEBHOOK_SECRET', '')
    if secret:
        signature = request.headers.get('X-Hub-Signature-256', '')
        if not signature:
            logging.warning("Webhook sem assinatura recebido")
            return jsonify({"status": "error", "message": "Assinatura não fornecida"}), 403
        
        # Computar assinatura
        payload = request.get_data()
        computed_signature = 'sha256=' + hmac.new(
            secret.encode(), 
            payload, 
            hashlib.sha256
        ).hexdigest()
        
        # Verificar assinatura
        if not hmac.compare_digest(signature, computed_signature):
            logging.warning("Assinatura de webhook inválida")
            return jsonify({"status": "error", "message": "Assinatura inválida"}), 403
    
    # Verificar evento
    event = request.headers.get('X-GitHub-Event', '')
    if event != 'push':
        return jsonify({"status": "ignored", "message": f"Evento {event} ignorado"}), 200
    
    # Obter dados do payload
    payload = request.json
    ref = payload.get('ref', '')
    
    # Verificar se é um push para a branch principal
    if ref != 'refs/heads/main':
        return jsonify({"status": "ignored", "message": f"Push para {ref} ignorado"}), 200
    
    # Iniciar processo de atualização em segundo plano
    try:
        # Executar o script em processo separado para não bloquear
        update_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'update_from_github.py')
        logging.info(f"Iniciando script de atualização: {update_script}")
        
        # Usar Python do ambiente atual
        python_exec = sys.executable
        subprocess.Popen([python_exec, update_script])
        
        return jsonify({
            "status": "success", 
            "message": "Atualização iniciada em segundo plano"
        }), 200
    except Exception as e:
        logging.error(f"Erro ao iniciar atualização: {str(e)}")
        logging.exception(e)
        return jsonify({
            "status": "error", 
            "message": f"Erro ao iniciar atualização: {str(e)}"
        }), 500

@app.route('/git-webhook', methods=['POST'])
def github_webhook_compat():
    """Endpoint alternativo para compatibilidade com webhook existente"""
    logging.info("Webhook recebido na rota de compatibilidade /git-webhook")
    return github_webhook()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se a aplicação está funcionando"""
    return jsonify({
        "status": "ok",
        "message": "Mesa Digital API está operacional",
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
        "environment": "production" if is_production else "development"
    })

@app.route('/<path:path>')
def static_proxy(path):
    """Servir arquivos estáticos da aplicação React."""
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    else:
        # Para aplicativos de página única, retornar index.html para todas as rotas não encontradas
        return send_from_directory(app.static_folder, 'index.html')

# ----- Socket.IO Event Handlers -----

@socketio.on('connect')
def handle_connect():
    """Manipular conexão do cliente."""
    client_id = request.sid
    logging.info(f"Novo cliente conectado: {client_id}")
    emit('connection_established', {'id': client_id})

@socketio.on('disconnect')
def handle_disconnect():
    """Manipular desconexão do cliente."""
    client_id = request.sid
    logging.info(f"Cliente desconectado: {client_id}")
    
    # Remover usuário das salas
    if client_id in user_room_map:
        room_id = user_room_map[client_id]
        if room_id in rooms and client_id in rooms[room_id]['users']:
            user_info = rooms[room_id]['users'][client_id]
            del rooms[room_id]['users'][client_id]
            
            # Notificar outros na sala
            emit('user_left', {
                'userId': client_id, 
                'userName': user_info.get('name', 'Unknown')
            }, room=room_id)
            
            # Remover sala se estiver vazia
            if not rooms[room_id]['users']:
                del rooms[room_id]
                logging.info(f"Sala removida: {room_id}")
        
        del user_room_map[client_id]

@socketio.on('create_room')
def handle_create_room(data):
    """Criar uma nova sala."""
    client_id = request.sid
    name = data.get('name', 'Anonymous')
    instrument = data.get('instrument', 'Unknown')
    
    # Criar ID único para a sala
    room_id = str(uuid.uuid4())[:8]
    
    # Criar sala
    rooms[room_id] = {
        'id': room_id,
        'created_at': time.time(),
        'users': {
            client_id: {
                'id': client_id,
                'name': name,
                'instrument': instrument,
                'isAdmin': True
            }
        }
    }
    
    # Associar usuário à sala
    user_room_map[client_id] = room_id
    
    # Entrar na sala Socket.IO
    join_room(room_id)
    
    logging.info(f"Sala criada: {room_id} por {name}")
    
    # Retornar informações da sala
    return {
        'success': True,
        'room': {
            'id': room_id,
            'users': [rooms[room_id]['users'][client_id]]
        }
    }

@socketio.on('join_room')
def handle_join_room(data):
    """Entrar em uma sala existente."""
    client_id = request.sid
    room_id = data.get('roomId')
    name = data.get('name', 'Anonymous')
    instrument = data.get('instrument', 'Unknown')
    
    # Verificar se a sala existe
    if not room_id or room_id not in rooms:
        return {'error': 'Sala não encontrada'}
    
    # Adicionar usuário à sala
    rooms[room_id]['users'][client_id] = {
        'id': client_id,
        'name': name,
        'instrument': instrument,
        'isAdmin': False
    }
    
    # Associar usuário à sala
    user_room_map[client_id] = room_id
    
    # Entrar na sala Socket.IO
    join_room(room_id)
    
    # Notificar outros na sala
    emit('user_joined', {
        'user': rooms[room_id]['users'][client_id]
    }, room=room_id)
    
    logging.info(f"Usuário {name} entrou na sala: {room_id}")
    
    # Retornar informações da sala
    return {
        'success': True,
        'room': {
            'id': room_id,
            'users': list(rooms[room_id]['users'].values())
        }
    }

@socketio.on('leave_room')
def handle_leave_room(data):
    """Sair de uma sala."""
    client_id = request.sid
    room_id = data.get('roomId')
    
    if not room_id or room_id not in rooms:
        return {'error': 'Sala não encontrada'}
    
    if client_id not in rooms[room_id]['users']:
        return {'error': 'Usuário não está na sala'}
    
    # Obter informações do usuário antes de removê-lo
    user_info = rooms[room_id]['users'][client_id]
    
    # Remover usuário da sala
    del rooms[room_id]['users'][client_id]
    
    # Remover associação
    if client_id in user_room_map:
        del user_room_map[client_id]
    
    # Sair da sala Socket.IO
    leave_room(room_id)
    
    # Notificar outros na sala
    emit('user_left', {
        'userId': client_id,
        'userName': user_info.get('name', 'Unknown')
    }, room=room_id)
    
    # Remover sala se estiver vazia
    if not rooms[room_id]['users']:
        del rooms[room_id]
        logging.info(f"Sala removida: {room_id}")
    
    return {'success': True}

@socketio.on('send_message')
def handle_send_message(data):
    """Enviar mensagem para todos na sala."""
    client_id = request.sid
    
    if client_id not in user_room_map:
        return {'error': 'Usuário não está em nenhuma sala'}
    
    room_id = user_room_map[client_id]
    
    if room_id not in rooms or client_id not in rooms[room_id]['users']:
        return {'error': 'Sala não encontrada ou usuário não está na sala'}
    
    # Criar mensagem
    message = {
        'id': str(uuid.uuid4()),
        'userId': client_id,
        'userName': rooms[room_id]['users'][client_id].get('name', 'Unknown'),
        'text': data.get('text', ''),
        'type': data.get('type', 'text'),
        'timestamp': time.time()
    }
    
    # Enviar para todos na sala
    emit('chat_message', message, room=room_id)
    
    return {'success': True}

@socketio.on('webrtc_signal')
def handle_webrtc_signal(data):
    """Repassar sinais WebRTC entre clientes."""
    to = data.get('to')
    from_user = request.sid
    signal = data.get('signal')
    signal_type = data.get('type')
    room_id = data.get('roomId')
    
    # Verificar dados
    if not to or not signal or not signal_type or not room_id:
        return {'error': 'Dados incompletos'}
    
    # Verificar se ambos estão na mesma sala
    if (to not in user_room_map or from_user not in user_room_map or
            user_room_map[to] != room_id or user_room_map[from_user] != room_id):
        return {'error': 'Usuários não estão na mesma sala'}
    
    # Repassar sinal
    emit('webrtc_signal', {
        'from': from_user,
        'signal': signal,
        'type': signal_type
    }, room=to)
    
    return {'success': True}

@socketio.on('ping_request')
def handle_ping_request(data):
    """Repassar pings para medir latência."""
    to = data.get('to')
    from_user = request.sid
    timestamp = data.get('timestamp')
    room_id = data.get('roomId')
    
    # Verificar dados
    if not to or not timestamp or not room_id:
        return {'error': 'Dados incompletos'}
    
    # Verificar se ambos estão na mesma sala
    if (to not in user_room_map or from_user not in user_room_map or
            user_room_map[to] != room_id or user_room_map[from_user] != room_id):
        return {'error': 'Usuários não estão na mesma sala'}
    
    # Repassar ping
    emit('ping_request', {
        'from': from_user,
        'timestamp': timestamp,
        'roomId': room_id
    }, room=to)
    
    return {'success': True}

@socketio.on('ping_response')
def handle_ping_response(data):
    """Repassar respostas de ping."""
    to = data.get('to')
    from_user = request.sid
    timestamp = data.get('timestamp')
    room_id = data.get('roomId')
    
    # Verificar dados
    if not to or not timestamp or not room_id:
        return {'error': 'Dados incompletos'}
    
    # Repassar resposta
    emit('ping_response', {
        'from': from_user,
        'timestamp': timestamp,
        'roomId': room_id
    }, room=to)
    
    return {'success': True}

@socketio.on('request_reconnect')
def handle_reconnect_request(data):
    """Repassar pedidos de reconexão."""
    user_id = data.get('userId')
    room_id = data.get('roomId')
    from_user = request.sid
    
    # Verificar dados
    if not user_id or not room_id:
        return {'error': 'Dados incompletos'}
    
    # Repassar pedido
    emit('request_reconnect', {
        'userId': from_user,
        'roomId': room_id
    }, room=user_id)
    
    return {'success': True}

@app.route('/api/music/search', methods=['GET'])
def search_music():
    """Pesquisar música no YouTube."""
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'Query not provided'}), 400
    
    result = music_service.search_song(query)
    if result:
        return jsonify(result)
    return jsonify({'error': 'Song not found'}), 404

@app.route('/api/music/stream/<video_id>', methods=['GET'])
def stream_music(video_id):
    """Obter URL de stream."""
    url = music_service.get_stream_url(video_id)
    if url:
        return jsonify({'url': url})
    return jsonify({'error': 'Could not get stream URL'}), 500

# ----- Music Socket Events -----

@socketio.on('music_add_song')
def handle_music_add(data):
    """Adicionar música à playlist da sala."""
    room_id = data.get('roomId')
    song_data = data.get('song')
    
    if not room_id or not song_data:
        return {'error': 'Invalid data'}
    
    entry = music_service.add_to_playlist(room_id, song_data)
    
    # Broadcast playlist atualizada
    emit('music_playlist_updated', {
        'playlist': music_service.get_playlist(room_id),
        'added_song': entry
    }, room=room_id)
    
    return {'success': True}

@socketio.on('music_remove_song')
def handle_music_remove(data):
    """Remover música da playlist."""
    room_id = data.get('roomId')
    song_uuid = data.get('uuid')
    
    if not room_id or not song_uuid:
        return {'error': 'Invalid data'}
    
    music_service.remove_from_playlist(room_id, song_uuid)
    
    emit('music_playlist_updated', {
        'playlist': music_service.get_playlist(room_id)
    }, room=room_id)
    
    return {'success': True}

@socketio.on('music_play')
def handle_music_play(data):
    """Iniciar reprodução de uma música para todos."""
    room_id = data.get('roomId')
    song_uuid = data.get('uuid')
    
    if not room_id or not song_uuid:
        return {'error': 'Invalid data'}
    
    # Aqui poderíamos marcar como 'playing' no serviço
    
    emit('music_now_playing', {
        'uuid': song_uuid,
        'timestamp': time.time()
    }, room=room_id)
    
    return {'success': True}

@socketio.on('get_playlist')
def handle_get_playlist(data):
    """Obter playlist atual."""
    room_id = data.get('roomId')
    if room_id:
        return {'playlist': music_service.get_playlist(room_id)}
    return {'error': 'Room ID required'}

@socketio.on('time_sync')
def handle_time_sync(data):
    """Sincronização de tempo para o metrônomo."""
    # Retorna o timestamp atual do servidor para calcular offset
    return time.time() * 1000  # Retorna em ms

@socketio.on('metronome_start')
def handle_metronome_start(data):
    """Iniciar metrônomo para todos na sala."""
    room_id = data.get('roomId')
    tempo = data.get('tempo', 120)
    start_time = data.get('startTime') # Timestamp futuro acordado
    
    if not room_id:
        return {'error': 'Room ID required'}
        
    emit('metronome_started', {
        'tempo': tempo,
        'startTime': start_time,
        'startedBy': request.sid
    }, room=room_id)
    
    return {'success': True}

@socketio.on('metronome_stop')
def handle_metronome_stop(data):
    """Parar metrônomo."""
    room_id = data.get('roomId')
    if not room_id:
        return {'error': 'Room ID required'}
        
    emit('metronome_stopped', {}, room=room_id)
    return {'success': True}

@socketio.on('metronome_tempo_change')
def handle_metronome_tempo(data):
    """Alterar BPM."""
    room_id = data.get('roomId')
    tempo = data.get('tempo')
    
    if not room_id:
        return {'error': 'Room ID required'}
        
    emit('metronome_tempo_changed', {'tempo': tempo}, room=room_id)
    return {'success': True}

@socketio.on('update_user_position')
def handle_user_position(data):
    """Atualizar posição espacial (pan) do usuário no palco."""
    room_id = data.get('roomId')
    position = data.get('position') # {x, y}
    
    if not room_id:
        return {'error': 'Room ID required'}
        
    # Broadcast para todos exceto o remetente (opcional, mas bom para confirmar)
    emit('user_position_updated', {
        'userId': request.sid,
        'position': position
    }, room=room_id)
    
    return {'success': True}

if __name__ == '__main__':
    # Para desenvolvimento local
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
