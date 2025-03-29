import os
import sys
import subprocess
import requests
import logging
from datetime import datetime

# Configurar logging
log_file = os.path.join(os.path.dirname(__file__), 'webhook.log')
logging.basicConfig(
    filename=log_file,
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_request(environ):
    logging.info(f"Recebida requisição: {environ.get('PATH_INFO')}")
    logging.info(f"Método: {environ.get('REQUEST_METHOD')}")
    logging.info(f"Headers:")
    for key, value in environ.items():
        if key.startswith('HTTP_'):
            logging.info(f"  {key}: {value}")

def application(environ, start_response):
    try:
        log_request(environ)
        
        # Configurar o endereço do servidor Node.js
        node_server = 'http://localhost:8000'
        
        # Iniciar o servidor Node.js se ainda não estiver rodando
        if not hasattr(application, 'node_process'):
            logging.info("Iniciando servidor Node.js...")
            application.node_process = subprocess.Popen(
                ['node', 'index.js'],
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
        
        # Obter o caminho da requisição
        path_info = environ.get('PATH_INFO', '')
        logging.info(f"Processando requisição para: {path_info}")
        
        # Se for uma requisição para o webhook
        if path_info == '/git-webhook':
            logging.info("Processando webhook do GitHub")
            try:
                # Ler o corpo da requisição
                content_length = int(environ.get('CONTENT_LENGTH', 0))
                body = environ['wsgi.input'].read(content_length)
                
                # Log do corpo da requisição
                logging.info(f"Corpo da requisição: {body.decode('utf-8')}")
                
                # Encaminhar a requisição para o servidor Node.js
                headers = {
                    'Content-Type': environ.get('CONTENT_TYPE', 'application/json'),
                    'X-GitHub-Event': environ.get('HTTP_X_GITHUB_EVENT', ''),
                    'X-Hub-Signature': environ.get('HTTP_X_HUB_SIGNATURE', ''),
                    'X-GitHub-Delivery': environ.get('HTTP_X_GITHUB_DELIVERY', '')
                }
                
                logging.info(f"Encaminhando para Node.js com headers: {headers}")
                
                response = requests.post(
                    f'{node_server}/git-webhook',
                    data=body,
                    headers=headers
                )
                
                logging.info(f"Resposta do Node.js: {response.status_code} - {response.text}")
                
                status = f'{response.status_code} {response.reason}'
                response_headers = [('Content-Type', 'text/plain')]
                start_response(status, response_headers)
                return [response.content]
                
            except Exception as e:
                logging.error(f"Erro ao processar webhook: {str(e)}", exc_info=True)
                status = '500 Internal Server Error'
                response_headers = [('Content-Type', 'text/plain')]
                start_response(status, response_headers)
                error_message = f"Erro ao processar webhook: {str(e)}"
                return [error_message.encode()]
        
        # Para outras requisições, retornar uma mensagem padrão
        status = '200 OK'
        headers = [
            ('Content-type', 'text/plain'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type')
        ]
        
        start_response(status, headers)
        return [b"Node.js server is running"]
        
    except Exception as e:
        logging.error(f"Erro geral na aplicação: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [f"Erro interno do servidor: {str(e)}".encode()]
