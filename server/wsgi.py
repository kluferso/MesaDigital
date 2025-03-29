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

def run_update_script():
    """Executa o script de atualização com os comandos diretamente."""
    try:
        home_dir = os.path.expanduser('~')
        project_dir = os.path.join(home_dir, 'MesaDigital')
        
        # Comandos de atualização
        commands = [
            f'cd {project_dir}',
            'git pull',
            'npm install',
            'npm run build',
            'cd server',
            'npm install'
        ]
        
        # Executa os comandos
        command_string = ' && '.join(commands)
        logging.info(f"Executando comandos: {command_string}")
        
        result = subprocess.run(
            command_string,
            shell=True,
            check=True,
            capture_output=True,
            text=True,
            cwd=project_dir
        )
        
        logging.info(f"Saída do comando: {result.stdout}")
        if result.stderr:
            logging.warning(f"Erros: {result.stderr}")
            
        return True, "Update completed successfully"
    except subprocess.CalledProcessError as e:
        logging.error(f"Erro ao executar comandos: {str(e)}")
        logging.error(f"Saída de erro: {e.stderr}")
        return False, f"Error executing update: {str(e)}"
    except Exception as e:
        logging.error(f"Erro inesperado: {str(e)}")
        return False, f"Unexpected error: {str(e)}"

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
                
                # Executar a atualização
                success, message = run_update_script()
                
                if success:
                    status = '200 OK'
                    response = b"Update completed successfully"
                else:
                    status = '500 Internal Server Error'
                    response = message.encode()
                
                headers = [('Content-Type', 'text/plain')]
                start_response(status, headers)
                return [response]
                
            except Exception as e:
                logging.error(f"Erro ao processar webhook: {str(e)}", exc_info=True)
                status = '500 Internal Server Error'
                headers = [('Content-Type', 'text/plain')]
                start_response(status, headers)
                error_message = f"Error processing webhook: {str(e)}"
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
        return [f"Internal server error: {str(e)}".encode()]
