import os
import sys
import subprocess

def application(environ, start_response):
    # Redirecionar todas as requisições para o servidor Node.js
    status = '200 OK'
    
    # Iniciar o servidor Node.js se ainda não estiver rodando
    if not hasattr(application, 'node_process'):
        application.node_process = subprocess.Popen(
            ['node', 'index.js'],
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
    
    # Configurar headers CORS
    headers = [
        ('Content-type', 'text/plain'),
        ('Access-Control-Allow-Origin', '*'),
        ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type')
    ]
    
    start_response(status, headers)
    
    # Retornar mensagem indicando que o servidor Node.js está rodando
    return [b"Node.js server is running"]
