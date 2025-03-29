import os
import sys
import subprocess
import requests
import logging
from datetime import datetime

# Configurar logging para o error.log do PythonAnywhere
logging.basicConfig(
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
        logging.info("Iniciando processamento da requisição")
        
        # Obter o caminho da requisição
        path_info = environ.get('PATH_INFO', '')
        logging.info(f"Caminho da requisição: {path_info}")
        
        # Se for uma requisição para o webhook
        if path_info == '/git-webhook':
            logging.info("Processando webhook do GitHub")
            try:
                # Ler o corpo da requisição
                content_length = int(environ.get('CONTENT_LENGTH', 0))
                body = environ['wsgi.input'].read(content_length)
                
                # Log do corpo da requisição
                logging.info(f"Corpo da requisição: {body.decode('utf-8')}")
                
                # Executar o script de atualização diretamente
                update_script = '/home/kluferso/MesaDigital/server/update_app.sh'
                if os.path.exists(update_script):
                    logging.info("Executando script de atualização")
                    try:
                        subprocess.run(['bash', update_script], check=True)
                        status = '200 OK'
                        response = b"Update completed successfully"
                    except subprocess.CalledProcessError as e:
                        logging.error(f"Erro ao executar script: {str(e)}")
                        status = '500 Internal Server Error'
                        response = f"Error executing script: {str(e)}".encode()
                else:
                    logging.error(f"Script não encontrado: {update_script}")
                    status = '500 Internal Server Error'
                    response = b"Update script not found"
                
                headers = [('Content-Type', 'text/plain')]
                start_response(status, headers)
                return [response]
                
            except Exception as e:
                logging.error(f"Erro ao processar webhook: {str(e)}", exc_info=True)
                status = '500 Internal Server Error'
                headers = [('Content-Type', 'text/plain')]
                start_response(status, headers)
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
        return [b"Application is running normally"]
        
    except Exception as e:
        logging.error(f"Erro geral na aplicação: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [f"Erro interno do servidor: {str(e)}".encode()]
