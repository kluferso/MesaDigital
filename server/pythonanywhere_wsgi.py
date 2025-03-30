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
        return [b"MesaDigital Webhook Service - OK"]
        
    except Exception as e:
        # Log do erro
        logging.error(f"Erro na aplicação: {str(e)}", exc_info=True)
        
        # Resposta de erro
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain')]
        start_response(status, headers)
        return [b"Internal Server Error"]
