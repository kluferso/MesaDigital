import logging

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def application(environ, start_response):
    """Função principal da aplicação WSGI."""
    try:
        # Log da requisição
        path = environ.get('PATH_INFO', '')
        method = environ.get('REQUEST_METHOD', '')
        logging.info(f"Recebida requisição {method} para {path}")
        
        # Resposta padrão
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
