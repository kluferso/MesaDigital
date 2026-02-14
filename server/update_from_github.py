#!/usr/bin/env python
import os
import subprocess
import logging
import json
import time
from datetime import datetime
from flask import Flask, request, jsonify

# Configurar logging
logging.basicConfig(
    filename='/tmp/github_update.log',  # Ajustado para pasta com permissão de escrita no PythonAnywhere
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Criar uma mini-aplicação Flask para o webhook
app = Flask(__name__)

def run_command(command):
    """Executa um comando shell e retorna o resultado"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, f"Erro: {e.stderr}"

def update_from_github():
    """Atualiza o código do GitHub e reinicia a aplicação"""
    # Registrar início da atualização
    logging.info(f"Iniciando atualização em {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Diretório do projeto (ajuste para o seu caminho no PythonAnywhere)
    project_dir = os.environ.get('PROJECT_DIR', '/home/kluferso/MesaDigital')
    
    # Mudar para o diretório do projeto
    os.chdir(project_dir)
    logging.info(f"Trabalhando no diretório: {project_dir}")
    
    # Verificar se é um repositório git
    success, output = run_command("git status")
    if not success:
        error_msg = "Não é um repositório git ou ocorreu um erro: " + output
        logging.error(error_msg)
        return {"status": "error", "message": error_msg}
    
    # Buscar alterações do GitHub
    logging.info("Buscando alterações do GitHub...")
    success, output = run_command("git fetch origin")
    if not success:
        error_msg = "Erro ao buscar alterações: " + output
        logging.error(error_msg)
        return {"status": "error", "message": error_msg}
    
    # Verificar se há alterações
    success, output = run_command("git status -uno")
    if "Your branch is up to date" in output:
        msg = "Nenhuma alteração detectada. Repositório já atualizado."
        logging.info(msg)
        return {"status": "success", "message": msg}
    
    # Fazer backup do código atual (apenas arquivos críticos)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"/tmp/mesa_backup_{timestamp}"
    logging.info(f"Criando backup em {backup_dir}...")
    
    # Criar diretório de backup e copiar apenas arquivos principais
    success, output = run_command(f"mkdir -p {backup_dir}/server")
    if success:
        run_command(f"cp -r {project_dir}/server/*.py {backup_dir}/server/")
    
    # Atualizar do GitHub (método seguro)
    logging.info("Atualizando código do GitHub...")
    success, output = run_command("git pull origin main")
    if not success:
        # Tentar método mais agressivo se o pull falhar
        logging.warning(f"Git pull falhou, tentando hard reset: {output}")
        success, output = run_command("git fetch origin && git reset --hard origin/main")
        if not success:
            error_msg = "Erro ao atualizar código: " + output
            logging.error(error_msg)
            return {"status": "error", "message": error_msg}
    
    # Instalar dependências Python atualizadas
    logging.info("Instalando dependências...")
    success, output = run_command("pip install --user -r requirements.txt")
    if not success:
        logging.warning("Aviso ao instalar dependências: " + output)
    
    # Recarregar aplicação no PythonAnywhere
    logging.info("Recarregando aplicação...")
    try:
        # Método 1: Tocar o arquivo WSGI (funciona apenas para alguns planos)
        run_command("touch /var/www/kluferso_pythonanywhere_com_wsgi.py")
        
        # Método 2: Usar a API do PythonAnywhere (requer token)
        api_token = os.environ.get('PYTHONANYWHERE_API_TOKEN', '')
        if api_token:
            import requests
            response = requests.post(
                'https://www.pythonanywhere.com/api/v0/user/kluferso/webapps/kluferso.pythonanywhere.com/reload/',
                headers={'Authorization': f'Token {api_token}'}
            )
            if response.status_code == 200:
                logging.info("Aplicação recarregada via API com sucesso!")
            else:
                logging.warning(f"Erro ao recarregar via API: {response.status_code} {response.text}")
    except Exception as e:
        logging.warning(f"Aviso ao recarregar aplicação: {str(e)}")
    
    # Registrar conclusão da atualização
    success_msg = "Atualização concluída com sucesso!"
    logging.info(success_msg)
    return {"status": "success", "message": success_msg}

@app.route('/git-webhook', methods=['POST'])
def webhook_endpoint():
    """Endpoint para receber webhook do GitHub"""
    logging.info("Webhook recebido")
    try:
        # Executar atualização imediatamente
        result = update_from_github()
        return jsonify(result)
    except Exception as e:
        error_msg = f"Erro durante atualização: {str(e)}"
        logging.error(error_msg)
        return jsonify({"status": "error", "message": error_msg}), 500

if __name__ == "__main__":
    if 'FLASK_RUN' in os.environ:
        # Executar como servidor web para receber webhooks
        app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))
    else:
        # Executar script de atualização diretamente
        result = update_from_github()
        print(json.dumps(result, indent=2))
