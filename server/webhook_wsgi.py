import logging
import sys
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/tmp/webhook_wsgi.log',
    filemode='a'
)

# Adicionar o diretório atual ao path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

# Log de inicialização
logging.info("Inicializando WSGI do Webhook Handler")

try:
    # Importar a aplicação Flask do webhook_handler
    from webhook_handler import application
    logging.info("Webhook Handler carregado com sucesso!")
except Exception as e:
    logging.error(f"Erro ao carregar Webhook Handler: {str(e)}")
    # Criar uma aplicação de fallback para debug
    from flask import Flask, jsonify
    
    fallback_app = Flask(__name__)
    
    @fallback_app.route('/', methods=['GET'])
    def fallback_index():
        return jsonify({
            "status": "error",
            "message": f"Erro ao carregar webhook handler: {str(e)}"
        }), 500
    
    @fallback_app.route('/git-webhook', methods=['POST'])
    def fallback_webhook():
        return jsonify({
            "status": "error",
            "message": f"Erro ao carregar webhook handler: {str(e)}"
        }), 500
    
    application = fallback_app
