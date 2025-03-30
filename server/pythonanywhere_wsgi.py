import os
import logging
import subprocess
import shutil
import stat
import requests
import mimetypes
import json

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/home/kluferso/MesaDigital/server/webapp.log'
)

def serve_static_file(environ, start_response, path):
    """Serve arquivos estáticos do build do React."""
    try:
        # Remove a barra inicial para tornar o path relativo
        if path.startswith('/'):
            path = path[1:]
            
        # Se for a raiz ou uma rota do React, serve o index.html
        if path == '' or not path.startswith('static/'):
            # Primeiro tenta o caminho exato
            file_path = os.path.join('/home/kluferso/MesaDigital/build', path)
            if not os.path.exists(file_path) or os.path.isdir(file_path):
                # Se não existir ou for diretório, usa index.html
                path = 'index.html'
                
        # Caminho completo do arquivo
        file_path = os.path.join('/home/kluferso/MesaDigital/build', path)
        logging.info(f"Tentando servir arquivo: {file_path}")
        
        # Verifica se o arquivo existe
        if not os.path.exists(file_path):
            logging.error(f"Arquivo não encontrado: {file_path}")
            
            # Se o arquivo não existe, tenta servir o index.html
            if path != 'index.html':
                logging.info("Tentando servir index.html...")
                index_path = os.path.join('/home/kluferso/MesaDigital/build', 'index.html')
                if os.path.exists(index_path):
                    file_path = index_path
                    logging.info("Usando index.html")
                else:
                    logging.error("index.html também não encontrado")
                    status = '404 Not Found'
                    headers = [('Content-Type', 'text/plain')]
                    start_response(status, headers)
                    return [b"File not found"]
            else:
                status = '404 Not Found'
                headers = [('Content-Type', 'text/plain')]
                start_response(status, headers)
                return [b"File not found"]
            
        # Determina o tipo MIME
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
            
        # Lê o arquivo
        with open(file_path, 'rb') as f:
            content = f.read()
            
        # Envia a resposta
        status = '200 OK'
        headers = [('Content-Type', content_type)]
        start_response(status, headers)
        logging.info(f"Arquivo servido com sucesso: {file_path}")
        return [content]
        
    except Exception as e:
        logging.error(f"Erro ao servir arquivo estático: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b"Error serving static file"]

def proxy_request(environ, start_response):
    """Encaminha a requisição para o servidor Node.js."""
    try:
        # Obtém o path da requisição
        path = environ.get('PATH_INFO', '')
        method = environ.get('REQUEST_METHOD', '')
        query_string = environ.get('QUERY_STRING', '')
        
        # Log detalhado da requisição
        logging.info(f"Detalhes da requisição:")
        logging.info(f"Path: {path}")
        logging.info(f"Method: {method}")
        logging.info(f"Query String: {query_string}")
        
        # Se for uma requisição de arquivo estático ou a raiz, serve o arquivo
        if path == '/' or (not path.startswith('/api/') and not path.startswith('/socket.io/')):
            return serve_static_file(environ, start_response, path)
        
        # URL base do servidor Node.js
        node_url = 'http://localhost:3000'
        
        # Constrói a URL completa
        url = f"{node_url}{path}"
        if query_string:
            url = f"{url}?{query_string}"
        
        logging.info(f"Encaminhando requisição para: {url}")
        
        # Obtém o corpo da requisição para POST/PUT
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        body = environ['wsgi.input'].read(content_length) if content_length > 0 else None
        
        # Log do corpo da requisição se houver
        if body:
            try:
                body_str = body.decode('utf-8')
                logging.info(f"Corpo da requisição: {body_str}")
            except:
                logging.info("Corpo da requisição é binário")
        
        # Obtém os headers
        headers = {
            key[5:]: value 
            for key, value in environ.items() 
            if key.startswith('HTTP_')
        }
        
        # Log dos headers
        logging.info(f"Headers da requisição: {json.dumps(headers, indent=2)}")
        
        # Remove headers problemáticos
        headers.pop('HOST', None)
        
        # Adiciona headers específicos para WebSocket
        if path.startswith('/socket.io/'):
            headers['Connection'] = environ.get('HTTP_CONNECTION', '')
            headers['Upgrade'] = environ.get('HTTP_UPGRADE', '')
            
        # Faz a requisição para o Node.js
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            data=body,
            stream=True,
            timeout=10  # Timeout de 10 segundos
        )
        
        # Log da resposta
        logging.info(f"Status da resposta: {response.status_code}")
        logging.info(f"Headers da resposta: {json.dumps(dict(response.headers), indent=2)}")
        
        # Prepara a resposta
        start_response(
            f'{response.status_code} {response.reason}',
            list(response.headers.items())
        )
        
        # Retorna o conteúdo
        return [chunk for chunk in response.iter_content()]
        
    except requests.exceptions.Timeout:
        logging.error("Timeout ao conectar com o servidor Node.js")
        status = '504 Gateway Timeout'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b"Timeout connecting to Node.js server"]
        
    except requests.exceptions.ConnectionError:
        logging.error("Erro de conexão com o servidor Node.js")
        status = '502 Bad Gateway'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b"Could not connect to Node.js server"]
        
    except Exception as e:
        logging.error(f"Erro ao encaminhar requisição: {str(e)}", exc_info=True)
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b"Error forwarding request to Node.js server"]

def run_git_pull():
    """Executa git pull para atualizar o código."""
    try:
        # No PythonAnywhere, o diretório é /home/kluferso/MesaDigital
        project_dir = '/home/kluferso/MesaDigital'
        wsgi_source = os.path.join(project_dir, 'server', 'pythonanywhere_wsgi.py')
        wsgi_target = '/var/www/kluferso_pythonanywhere_com_wsgi.py'
        
        # Executa git pull com o caminho completo do git
        logging.info("Executando git pull...")
        logging.info(f"Diretório do projeto: {project_dir}")
        
        # Primeiro, tenta encontrar o git
        git_path = subprocess.run(
            ['which', 'git'],
            capture_output=True,
            text=True
        ).stdout.strip()
        
        logging.info(f"Git encontrado em: {git_path}")
        
        # Configura o git se necessário
        subprocess.run(
            ['git', 'config', '--global', 'user.email', 'kluferso@gmail.com'],
            cwd=project_dir,
            check=True
        )
        subprocess.run(
            ['git', 'config', '--global', 'user.name', 'kluferso'],
            cwd=project_dir,
            check=True
        )
        
        # Força o git a atualizar
        subprocess.run(
            ['git', 'fetch', '--all'],
            cwd=project_dir,
            check=True
        )
        
        subprocess.run(
            ['git', 'reset', '--hard', 'origin/main'],
            cwd=project_dir,
            check=True
        )
        
        result = subprocess.run(
            ['git', 'pull', 'origin', 'main'],
            cwd=project_dir,
            check=True,
            capture_output=True,
            text=True
        )
        
        logging.info(f"Saída do git pull: {result.stdout}")
        if result.stderr:
            logging.warning(f"Erros do git pull: {result.stderr}")
            
        # Verifica o status atual
        status = subprocess.run(
            ['git', 'status'],
            cwd=project_dir,
            capture_output=True,
            text=True
        )
        logging.info(f"Status do git: {status.stdout}")
        
        # Copia o arquivo WSGI atualizado
        logging.info(f"Copiando {wsgi_source} para {wsgi_target}")
        shutil.copy2(wsgi_source, wsgi_target)
        
        # Define as permissões corretas (644)
        os.chmod(wsgi_target, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)
        logging.info("Arquivo WSGI atualizado com sucesso!")
        
        # Recarrega o módulo atual
        subprocess.run(
            ['touch', wsgi_target],
            check=True
        )
        logging.info("Arquivo WSGI recarregado!")
        
        # Força o reload do servidor WSGI
        subprocess.run(
            ['touch', '/var/www/kluferso_pythonanywhere_com_wsgi.py'],
            check=True
        )
        logging.info("Servidor WSGI recarregado!")
            
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
        # Log da requisição
        path = environ.get('PATH_INFO', '')
        method = environ.get('REQUEST_METHOD', '')
        query_string = environ.get('QUERY_STRING', '')
        
        logging.info(f"Recebida requisição {method} para {path}")
        if query_string:
            logging.info(f"Query string: {query_string}")
        
        # Se for uma requisição para o webhook
        if path == '/git-webhook':
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
        
        # Para outras requisições, encaminhar para o Node.js ou servir arquivos estáticos
        return proxy_request(environ, start_response)
        
    except Exception as e:
        # Log do erro
        logging.error(f"Erro na aplicação: {str(e)}", exc_info=True)
        
        # Resposta de erro
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b"Internal Server Error"]
