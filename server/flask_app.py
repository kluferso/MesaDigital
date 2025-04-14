from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import logging
import json
import time
import uuid

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Inicializar aplicação Flask
app = Flask(__name__, static_folder='../build', static_url_path='')
app.config['SECRET_KEY'] = 'mesa_digital_secret_key'

# Configurar Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*")

# Armazenamento em memória para as salas (em produção, use um banco de dados)
rooms = {}
user_room_map = {}

# ----- Rotas da API -----

@app.route('/')
def serve_frontend():
    """Servir a aplicação React."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    """Servir arquivos estáticos da aplicação React."""
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    else:
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

if __name__ == '__main__':
    # Para desenvolvimento local
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
