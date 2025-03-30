import os
import logging
import subprocess

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def run_git_pull():
    """Executa git pull para atualizar o código."""
    try:
        # No PythonAnywhere, o diretório é /home/kluferso/MesaDigital
        project_dir = '/home/kluferso/MesaDigital'
        
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
        logging.info(f"Recebida requisição {method} para {path}")
        
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
        
        # Para outras requisições, retornar uma mensagem padrão
        status = '200 OK'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b"MesaDigital Webhook Service - v1.5"]
        
    except Exception as e:
        # Log do erro
        logging.error(f"Erro na aplicação: {str(e)}", exc_info=True)
        
        # Resposta de erro
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b"Internal Server Error"]
