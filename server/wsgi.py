import logging
import sys
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

# Adicionar o diretório atual ao path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

# Definir variáveis de ambiente necessárias
os.environ['PROJECT_DIR'] = os.path.dirname(path)  # Pasta principal do projeto
# os.environ['GITHUB_WEBHOOK_SECRET'] = 'seu_segredo_aqui'  # Defina manualmente no PythonAnywhere

# Importar a aplicação Flask
from flask_app import app as application

# Log de inicialização
logging.info("Aplicação WSGI do Mesa Digital inicializada")
logging.info(f"Diretório do projeto: {os.environ.get('PROJECT_DIR')}")

# Esta é a variável que o PythonAnywhere procura
application = application
