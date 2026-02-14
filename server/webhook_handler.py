#!/usr/bin/env python
import os
import sys
import subprocess
import logging
import json
from datetime import datetime
from flask import Flask, request, jsonify

# Configurar logging
logging.basicConfig(
    filename='/tmp/github_webhook.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Criar aplicação Flask dedicada apenas para o webhook
app = Flask(__name__)

def run_command(command):
    """Executa um comando shell e retorna o resultado"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, f"Erro: {e.stderr}"

def perform_update():
    """Executa a atualização do código via Git pull"""
    # Registrar início da atualização
    logging.info(f"Iniciando atualização em {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Diretório do projeto no PythonAnywhere
    project_dir = "/home/kluferso/MesaDigital"
    
    # Mudar para o diretório do projeto
    try:
        os.chdir(project_dir)
        logging.info(f"Trabalhando no diretório: {project_dir}")
    except Exception as e:
        logging.error(f"Erro ao mudar para o diretório: {str(e)}")
        return {"status": "error", "message": f"Erro ao mudar para o diretório: {str(e)}"}
    
    # Atualizar do GitHub
    logging.info("Atualizando código do GitHub...")
    success, output = run_command("git pull origin main")
    
    if not success:
        logging.error(f"Erro no git pull: {output}")
        return {"status": "error", "message": f"Erro no git pull: {output}"}
    
    # Instalar dependências
    logging.info("Instalando dependências...")
    run_command("pip install --user -r requirements.txt")
    
    # Recarregar a aplicação principal
    logging.info("Recarregando aplicação...")
    run_command("touch /var/www/kluferso_pythonanywhere_com_wsgi.py")
    
    logging.info("Atualização concluída com sucesso!")
    return {"status": "success", "message": "Atualização concluída com sucesso!"}

@app.route('/', methods=['GET'])
def health_check():
    """Endpoint para verificar se o webhook está funcionando"""
    return jsonify({
        "status": "ok",
        "message": "Webhook handler está funcionando",
        "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/git-webhook', methods=['POST'])
def webhook_handler():
    """Manipulador de webhook do GitHub"""
    logging.info("Webhook recebido do GitHub")
    
    # Registrar dados do request para debug
    headers = dict(request.headers)
    event_type = headers.get('X-Github-Event', 'unknown')
    logging.info(f"Evento: {event_type}")
    
    try:
        # Tentar obter o payload como JSON
        payload = request.get_json(silent=True)
        if payload is None:
            payload_data = request.data.decode('utf-8')
            logging.info(f"Payload não é JSON, dados brutos: {payload_data[:100]}...")
            return jsonify({"status": "error", "message": "Payload inválido"}), 400
        
        # Verificar se é um push para a branch main
        ref = payload.get('ref', '')
        if event_type == 'push' and 'refs/heads/main' in ref:
            # Executar atualização em processo separado para não bloquear a resposta
            result = perform_update()
            return jsonify(result)
        else:
            logging.info(f"Ignorando evento {event_type} para ref {ref}")
            return jsonify({"status": "ignored", "message": f"Evento ignorado: {event_type} para {ref}"}), 200
            
    except Exception as e:
        logging.error(f"Erro ao processar webhook: {str(e)}")
        return jsonify({"status": "error", "message": f"Erro ao processar webhook: {str(e)}"}), 500

# Configuração para PythonAnywhere WSGI
application = app

if __name__ == "__main__":
    # Executar servidor de desenvolvimento local
    app.run(debug=True, host='0.0.0.0', port=5001)
