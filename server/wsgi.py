import os
import sys
import subprocess
import requests

def application(environ, start_response):
    # Configurar o endereço do servidor Node.js
    node_server = 'http://localhost:8000'
    
    # Iniciar o servidor Node.js se ainda não estiver rodando
    if not hasattr(application, 'node_process'):
        application.node_process = subprocess.Popen(
            ['node', 'index.js'],
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
    
    # Obter o caminho da requisição
    path_info = environ.get('PATH_INFO', '')
    
    # Se for uma requisição para o webhook, encaminhar para o servidor Node.js
    if path_info == '/git-webhook':
        try:
            # Ler o corpo da requisição
            content_length = int(environ.get('CONTENT_LENGTH', 0))
            body = environ['wsgi.input'].read(content_length)
            
            # Encaminhar a requisição para o servidor Node.js
            response = requests.post(
                f'{node_server}/git-webhook',
                data=body,
                headers={
                    'Content-Type': environ.get('CONTENT_TYPE', 'application/json'),
                    'X-GitHub-Event': environ.get('HTTP_X_GITHUB_EVENT', ''),
                    'X-Hub-Signature': environ.get('HTTP_X_HUB_SIGNATURE', ''),
                    'X-GitHub-Delivery': environ.get('HTTP_X_GITHUB_DELIVERY', '')
                }
            )
            
            # Retornar a resposta do servidor Node.js
            status = f'{response.status_code} {response.reason}'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [response.content]
            
        except Exception as e:
            # Em caso de erro, retornar 500
            status = '500 Internal Server Error'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [str(e).encode()]
    
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
