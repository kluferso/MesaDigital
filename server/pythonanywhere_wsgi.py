import os
import sys
import logging
import mimetypes
import json
import requests
from urllib.parse import urljoin, urlparse

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Configurações
PROJECT_DIR = '/home/kluferso/MesaDigital'
BUILD_DIR = os.path.join(PROJECT_DIR, 'build')
NODE_SERVER = 'http://localhost:3000'
TIMEOUT = 10  # segundos

# Função para servir arquivos estáticos
def serve_static_file(path_info):
    # Remove a barra inicial para criar um caminho relativo
    relative_path = path_info.lstrip('/')
    
    # Primeiro, tenta encontrar o arquivo exato
    file_path = os.path.join(BUILD_DIR, relative_path)
    
    # Se o arquivo não existe, tenta servir o index.html
    if not os.path.exists(file_path) or os.path.isdir(file_path):
        file_path = os.path.join(BUILD_DIR, 'index.html')
        if not os.path.exists(file_path):
            logging.error(f"Arquivo não encontrado: {file_path}")
            return '404 Not Found', [('Content-Type', 'text/plain')], [b'Not Found']
    
    # Determina o tipo MIME
    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = 'application/octet-stream'
    
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            logging.info(f"Servindo arquivo: {file_path} ({content_type})")
            return '200 OK', [('Content-Type', content_type)], [content]
    except Exception as e:
        logging.error(f"Erro ao ler arquivo {file_path}: {str(e)}")
        return '500 Internal Server Error', [('Content-Type', 'text/plain')], [b'Internal Server Error']

# Função para encaminhar requisições para o Node.js
def proxy_request(environ, start_response):
    try:
        # Obtém informações da requisição
        path_info = environ.get('PATH_INFO', '')
        query_string = environ.get('QUERY_STRING', '')
        method = environ.get('REQUEST_METHOD', 'GET')
        content_length = environ.get('CONTENT_LENGTH', '')
        content_type = environ.get('CONTENT_TYPE', '')
        
        # Constrói a URL do Node.js
        url = urljoin(NODE_SERVER, path_info)
        if query_string:
            url += '?' + query_string
        
        # Prepara os headers
        headers = {
            key[5:].replace('_', '-').lower(): value
            for key, value in environ.items()
            if key.startswith('HTTP_')
        }
        
        if content_type:
            headers['content-type'] = content_type
        
        # Lê o corpo da requisição
        body = None
        if content_length and content_length != '0':
            body = environ['wsgi.input'].read(int(content_length))
        
        # Log da requisição
        logging.info(f"Encaminhando {method} {url}")
        if headers:
            logging.info(f"Headers: {json.dumps(headers)}")
        if body:
            logging.info(f"Body: {body.decode('utf-8', errors='replace')}")
        
        # Faz a requisição para o Node.js
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                data=body,
                timeout=TIMEOUT,
                stream=True
            )
            
            # Log da resposta
            logging.info(f"Resposta do Node.js: {response.status_code}")
            
            # Prepara a resposta
            status = f"{response.status_code} {response.reason}"
            response_headers = [
                (key, value)
                for key, value in response.headers.items()
            ]
            
            # Inicia a resposta
            start_response(status, response_headers)
            return response.iter_content(chunk_size=4096)
            
        except requests.exceptions.Timeout:
            logging.error(f"Timeout ao conectar com {url}")
            status = '504 Gateway Timeout'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [b'Gateway Timeout']
            
        except requests.exceptions.ConnectionError:
            logging.error(f"Erro de conexao com {url}")
            status = '502 Bad Gateway'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [b'Bad Gateway']
            
    except Exception as e:
        logging.error(f"Erro ao processar requisicao: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b'Internal Server Error']

def application(environ, start_response):
    try:
        path_info = environ.get('PATH_INFO', '')
        
        # Log da requisição
        logging.info(f"Requisição recebida: {environ['REQUEST_METHOD']} {path_info}")
        
        # Se for uma requisição para o Socket.IO ou API, encaminha para o Node.js
        if path_info.startswith('/socket.io/') or path_info.startswith('/api/'):
            return proxy_request(environ, start_response)
        
        # Para todas as outras requisições, tenta servir arquivos estáticos
        return serve_static_file(path_info)
        
    except Exception as e:
        logging.error(f"Erro na aplicação: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b'Internal Server Error']
