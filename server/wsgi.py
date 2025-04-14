import logging
import sys
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/tmp/mesa_digital_wsgi.log',  # Salvar logs em arquivo acessível
    filemode='a'
)

# Log de inicialização
logging.info("Iniciando aplicação WSGI do Mesa Digital")

try:
    # Adicionar o diretório atual ao path
    path = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(path)
    if path not in sys.path:
        sys.path.append(path)
        logging.info(f"Adicionado {path} ao sys.path")
    
    if project_dir not in sys.path:
        sys.path.append(project_dir)
        logging.info(f"Adicionado {project_dir} ao sys.path")
    
    # Definir variáveis de ambiente necessárias
    os.environ['PROJECT_DIR'] = project_dir  # Pasta principal do projeto
    logging.info(f"Diretório do projeto: {os.environ.get('PROJECT_DIR')}")
    
    # Verificar se a pasta existe
    if not os.path.exists(project_dir):
        logging.error(f"ERRO: Diretório do projeto não existe: {project_dir}")
    else:
        logging.info(f"Diretório do projeto existe: {project_dir}")
        
    # Listar conteúdo do diretório para debug
    logging.info(f"Conteúdo do diretório servidor: {os.listdir(path)}")
    
    # Verificar arquivo flask_app.py
    flask_app_path = os.path.join(path, 'flask_app.py')
    if not os.path.exists(flask_app_path):
        logging.error(f"ERRO: flask_app.py não encontrado em: {flask_app_path}")
    else:
        logging.info(f"flask_app.py encontrado: {flask_app_path}")
    
    # Importar a aplicação Flask
    from flask_app import app as application
    logging.info("Aplicação Flask importada com sucesso")
    
    # Esta é a variável que o PythonAnywhere procura
    # application = application  # Comentado pois é redundante

except Exception as e:
    logging.error(f"ERRO ao inicializar aplicação WSGI: {str(e)}")
    logging.exception(e)  # Isso registrará o traceback completo
    
    # Criar uma aplicação de fallback para debug
    from flask import Flask, jsonify
    
    fallback_app = Flask(__name__)
    
    @fallback_app.route('/', methods=['GET'])
    def fallback_index():
        return f"""
        <html>
        <head><title>Mesa Digital - Erro de Inicialização</title></head>
        <body>
            <h1>Erro de Inicialização do Mesa Digital</h1>
            <p>Ocorreu um erro ao inicializar a aplicação:</p>
            <pre>{str(e)}</pre>
            <p>Verifique os logs em /tmp/mesa_digital_wsgi.log para mais detalhes.</p>
        </body>
        </html>
        """
    
    # Usar o aplicativo de fallback
    application = fallback_app
    logging.info("Aplicação de fallback inicializada")
