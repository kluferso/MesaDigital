"""
Arquivo WSGI mínimo para resolver o erro 502 Backend no PythonAnywhere.
Este arquivo fornece uma aplicação Flask básica que não depende de nenhum outro módulo ou pacote.
"""
import os
import logging
import sys
from datetime import datetime

# Configurar logging básico
log_file = '/tmp/mesa_digital_minimal.log'
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='a'
)

logging.info(f"========= INICIALIZAÇÃO DO MINIMAL WSGI EM {datetime.now()} =========")

try:
    # Verificar ambiente Python
    logging.info(f"Python version: {sys.version}")
    logging.info(f"Python path: {sys.executable}")
    logging.info(f"Sys.path: {sys.path}")
    
    # Importar Flask de maneira segura
    try:
        from flask import Flask, jsonify, render_template_string
        logging.info("Flask importado com sucesso")
    except ImportError as e:
        logging.error(f"Erro ao importar Flask: {str(e)}")
        # Criar uma aplicação WSGI simples sem Flask
        def application(environ, start_response):
            status = '200 OK'
            response_headers = [('Content-type', 'text/html')]
            start_response(status, response_headers)
            
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mesa Digital - Modo de Emergência</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                    .message {{ background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                    .error {{ color: #721c24; background-color: #f8d7da; padding: 20px; border-radius: 5px; }}
                </style>
            </head>
            <body>
                <h1>Mesa Digital - Modo de Emergência</h1>
                <div class="message">
                    <p>O sistema está em modo de emergência devido a um problema de inicialização.</p>
                    <p>Erro: Não foi possível importar Flask</p>
                </div>
                <div class="message">
                    <p>Registros de diagnóstico estão disponíveis em:</p>
                    <code>{log_file}</code>
                </div>
                <p>Por favor, tente novamente mais tarde ou contate o suporte.</p>
            </body>
            </html>
            """
            
            return [html.encode('utf-8')]
        
        # Sair da função atual, pois já definimos a aplicação
        logging.info("Aplicação WSGI básica sem Flask inicializada")
        return

    # Criar aplicação Flask minimalista
    app = Flask(__name__)
    
    @app.route('/')
    def index():
        """Rota principal com página minimalista de status"""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mesa Digital - Diagnóstico</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: #155724; background-color: #d4edda; padding: 20px; border-radius: 5px; }
                .info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .action { margin-top: 30px; }
                button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>Mesa Digital - Diagnóstico</h1>
            <div class="success">
                <p>✅ Aplicação Flask básica está funcionando corretamente!</p>
                <p>Este é um servidor minimalista para diagnóstico.</p>
            </div>
            <div class="info">
                <h2>Informações do Sistema</h2>
                <p>Data/Hora: {{ now }}</p>
                <p>Versão Python: {{ python_version }}</p>
                <p>Servidor: {{ server }}</p>
            </div>
            <div class="action">
                <a href="/api/status"><button>Verificar API Status</button></a>
            </div>
        </body>
        </html>
        """
        
        return render_template_string(
            html, 
            now=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            python_version=sys.version,
            server="PythonAnywhere"
        )
    
    @app.route('/api/status')
    def api_status():
        """API de status para verificação da saúde do sistema"""
        return jsonify({
            "status": "ok",
            "message": "Mesa Digital API minimalista está funcionando",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "python_version": sys.version,
            "server": "PythonAnywhere - Minimal Mode"
        })
    
    # Definir aplicação WSGI
    application = app
    logging.info("Aplicação Flask minimalista inicializada com sucesso")

except Exception as e:
    logging.error(f"Erro crítico na inicialização: {str(e)}")
    logging.exception(e)
    
    # Criar aplicação de fallback para erro crítico
    def application(environ, start_response):
        status = '200 OK'
        response_headers = [('Content-type', 'text/html')]
        start_response(status, response_headers)
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mesa Digital - Erro Crítico</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                .error {{ color: #721c24; background-color: #f8d7da; padding: 20px; border-radius: 5px; }}
                .info {{ background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <h1>Mesa Digital - Erro Crítico</h1>
            <div class="error">
                <p>Ocorreu um erro crítico durante a inicialização da aplicação.</p>
                <p><strong>Erro:</strong> {str(e)}</p>
            </div>
            <div class="info">
                <p>Registros detalhados estão disponíveis em:</p>
                <code>{log_file}</code>
            </div>
            <p>Por favor, tente novamente mais tarde ou contate o suporte.</p>
        </body>
        </html>
        """
        
        return [html.encode('utf-8')]
