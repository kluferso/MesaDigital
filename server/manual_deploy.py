#!/usr/bin/env python
"""
Script para deploy manual do Mesa Digital no PythonAnywhere
Use este script se o GitHub Actions não estiver funcionando
"""

import os
import subprocess
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    filename='/tmp/manual_deploy.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def run_command(command):
    """Executa um comando e retorna a saída"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        logging.info(f"Comando executado: {command}")
        logging.info(f"Saída: {result.stdout}")
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        logging.error(f"Erro ao executar: {command}")
        logging.error(f"Erro: {e.stderr}")
        return False, e.stderr

def manual_deploy():
    """Executa o deploy manual no PythonAnywhere"""
    logging.info(f"Iniciando deploy manual em {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar se estamos no PythonAnywhere
    if not os.path.exists('/home/kluferso'):
        logging.error("Este script deve ser executado no PythonAnywhere")
        print("Este script deve ser executado no PythonAnywhere")
        return False
    
    # Mudar para o diretório do projeto
    project_dir = "/home/kluferso/MesaDigital"
    os.chdir(project_dir)
    logging.info(f"Diretório do projeto: {project_dir}")
    
    # Atualizar código do GitHub
    logging.info("Atualizando código do GitHub...")
    success, output = run_command("git pull origin main")
    if not success:
        logging.error(f"Falha ao atualizar código: {output}")
        print(f"Falha ao atualizar código: {output}")
        return False
    
    # Instalar dependências
    logging.info("Instalando dependências Python...")
    run_command("pip install --user -r requirements.txt")
    
    # Atualizar dependências Node (opcional)
    logging.info("Instalando dependências Node...")
    run_command("cd /home/kluferso/MesaDigital && npm install")
    
    # Recarregar a aplicação
    logging.info("Recarregando a aplicação...")
    success, output = run_command("touch /var/www/kluferso_pythonanywhere_com_wsgi.py")
    if not success:
        logging.error(f"Falha ao recarregar a aplicação: {output}")
        print(f"Falha ao recarregar a aplicação: {output}")
        return False
    
    logging.info("Deploy manual concluído com sucesso!")
    print("Deploy manual concluído com sucesso!")
    return True

if __name__ == "__main__":
    print("Iniciando deploy manual...")
    manual_deploy()
