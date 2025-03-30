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

def run_git_pull():
    """Executa git pull para atualizar o código."""
    try:
        home_dir = os.path.expanduser('~')
        project_dir = os.path.join(home_dir, 'MesaDigital')
        
        # Executa git pull
        logging.info("Executando git pull...")
        result = subprocess.run(
            ['git', 'pull'],
            cwd=project_dir,
            check=True,
            capture_output=True,
            text=True
        )
        
        logging.info(f"Saída do git pull: {result.stdout}")
        if result.stderr:
            logging.warning(f"Erros do git pull: {result.stderr}")
            
        return True, "Repository updated successfully"
    except subprocess.CalledProcessError as e:
        logging.error(f"Erro ao executar git pull: {str(e)}")
        logging.error(f"Saída de erro: {e.stderr}")
        return False, f"Error updating repository: {str(e)}"
    except Exception as e:
        logging.error(f"Erro inesperado: {str(e)}")
        return False, f"Unexpected error: {str(e)}"

def application(environ, start_response):
    """Função principal da aplicação WSGI."""
    try:
        # Obter o caminho da requisição
        path_info = environ.get('PATH_INFO', '')
        logging.info(f"Recebida requisição para: {path_info}")
        
        # Se for uma requisição para o webhook
        if path_info == '/git-webhook':
            logging.info("Processando webhook do GitHub")
            try:
                # Ler o corpo da requisição
                content_length = int(environ.get('CONTENT_LENGTH', 0))
                body = environ['wsgi.input'].read(content_length)
                
                # Log do corpo da requisição
                logging.info(f"Corpo da requisição: {body.decode('utf-8')}")
                
                # Executar git pull
                success, message = run_git_pull()
                
                if success:
                    status = '200 OK'
                    response = b"Repository updated successfully"
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
        return [b"MesaDigital API is running"]
        
    except Exception as e:
        logging.error(f"Erro geral na aplicação: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [f"Internal server error: {str(e)}".encode()]
