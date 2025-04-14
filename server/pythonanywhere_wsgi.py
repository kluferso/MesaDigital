import os
import sys
import logging
import mimetypes
import json
import requests
import socket
from urllib.parse import urljoin, urlparse

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,  # INFO para produção, DEBUG para desenvolvimento
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Configurações
PROJECT_DIR = '/home/kluferso/MesaDigital'
BUILD_DIR = os.path.join(PROJECT_DIR, 'build')
NODE_SERVER = 'http://localhost:3000'
TIMEOUT = 15  # Aumentado para 15 segundos para WebRTC

def check_node_server():
    """Verifica se o servidor Node.js está rodando"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)  # 2 segundos de timeout
        result = sock.connect_ex(('localhost', 3000))
        sock.close()
        return result == 0
    except:
        return False

# Função para servir arquivos estáticos
def serve_static_file(path_info):
    """Serve arquivos estáticos do diretório build"""
    try:
        # Remove a barra inicial para criar um caminho relativo
        relative_path = path_info.lstrip('/')
        
        # Primeiro, tenta encontrar o arquivo exato
        file_path = os.path.join(BUILD_DIR, relative_path)
        logging.debug(f"Tentando servir arquivo: {file_path}")
        
        # Se o arquivo não existe, tenta servir o index.html
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            file_path = os.path.join(BUILD_DIR, 'index.html')
            logging.debug(f"Arquivo não encontrado, tentando index.html: {file_path}")
            
            if not os.path.exists(file_path):
                logging.error(f"index.html não encontrado em: {file_path}")
                return '404 Not Found', [('Content-Type', 'text/plain')], [b'Not Found']
        
        # Determina o tipo MIME
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        # Lê o arquivo
        with open(file_path, 'rb') as f:
            content = f.read()
            logging.info(f"Servindo arquivo: {file_path} ({content_type})")
            return '200 OK', [('Content-Type', content_type)], [content]
            
    except Exception as e:
        logging.error(f"Erro ao servir arquivo {file_path}: {str(e)}", exc_info=True)
        return '500 Internal Server Error', [('Content-Type', 'text/plain')], [b'Internal Server Error']

# Função para encaminhar requisições para o Node.js
def proxy_request(environ, start_response):
    """Encaminha requisições para o servidor Node.js"""
    try:
        # Verifica se o servidor Node.js está rodando
        if not check_node_server():
            logging.error("Servidor Node.js não está rodando na porta 3000")
            status = '502 Bad Gateway'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [b'Node.js server is not running']
        
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
        
        # Adiciona CORS headers para Android
        if environ.get('HTTP_ORIGIN'):
            headers['origin'] = environ.get('HTTP_ORIGIN')
        
        # Lê o corpo da requisição
        body = None
        if content_length and content_length != '0':
            body = environ['wsgi.input'].read(int(content_length))
        
        # Log da requisição
        logging.debug(f"Encaminhando {method} {url}")
        logging.debug(f"Headers: {json.dumps(headers)}")
        if body and logging.getLogger().level == logging.DEBUG:
            try:
                body_text = body.decode('utf-8')
                logging.debug(f"Body: {body_text}")
            except:
                logging.debug("Body: [conteúdo binário]")
        
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
            logging.debug(f"Resposta do Node.js: {response.status_code}")
            logging.debug(f"Headers da resposta: {dict(response.headers)}")
            
            # Prepara a resposta
            status = f"{response.status_code} {response.reason}"
            response_headers = [
                (key, value)
                for key, value in response.headers.items()
            ]
            
            # Adiciona CORS headers se vierem do Android
            if environ.get('HTTP_USER_AGENT') and 'Android' in environ.get('HTTP_USER_AGENT'):
                cors_headers = [
                    ('Access-Control-Allow-Origin', '*'),
                    ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
                    ('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                ]
                response_headers.extend([h for h in cors_headers if h[0] not in dict(response_headers)])
            
            # Inicia a resposta
            start_response(status, response_headers)
            return response.iter_content(chunk_size=4096)
            
        except requests.exceptions.Timeout:
            logging.error(f"Timeout ao conectar com {url}")
            status = '504 Gateway Timeout'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [b'Gateway Timeout']
            
        except requests.exceptions.ConnectionError as e:
            logging.error(f"Erro de conexão com {url}: {str(e)}")
            status = '502 Bad Gateway'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [b'Could not connect to Node.js server']
            
    except Exception as e:
        logging.error(f"Erro ao processar requisição: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b'Internal Server Error']

def application(environ, start_response):
    """Função principal da aplicação WSGI"""
    try:
        path_info = environ.get('PATH_INFO', '')
        method = environ.get('REQUEST_METHOD', '')
        
        # Log da requisição
        logging.info(f"Requisição recebida: {method} {path_info}")
        
        # Tratamento de CORS preflight requests
        if method == 'OPTIONS':
            status = '200 OK'
            headers = [
                ('Content-Type', 'text/plain'),
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Max-Age', '86400')  # 24 horas
            ]
            start_response(status, headers)
            return [b'']
        
        # Se for uma requisição para o Socket.IO, WebRTC ou API, encaminha para o Node.js
        if path_info.startswith('/socket.io/') or path_info.startswith('/api/') or path_info.startswith('/webrtc/'):
            return proxy_request(environ, start_response)
        
        # Para todas as outras requisições, tenta servir arquivos estáticos
        status, headers, content = serve_static_file(path_info)
        start_response(status, headers)
        return content
        
    except Exception as e:
        logging.error(f"Erro na aplicação: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b'Internal Server Error']
