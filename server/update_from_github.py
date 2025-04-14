#!/usr/bin/env python
import os
import subprocess
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    filename='github_update.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

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
    # Este seria algo como: /home/seu_usuario/MesaDigital
    project_dir = os.environ.get('PROJECT_DIR', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Mudar para o diretório do projeto
    os.chdir(project_dir)
    logging.info(f"Trabalhando no diretório: {project_dir}")
    
    # Verificar se é um repositório git
    success, output = run_command("git status")
    if not success:
        logging.error("Não é um repositório git ou ocorreu um erro: " + output)
        return "Erro: Não é um repositório git válido"
    
    # Buscar alterações do GitHub
    logging.info("Buscando alterações do GitHub...")
    success, output = run_command("git fetch origin")
    if not success:
        logging.error("Erro ao buscar alterações: " + output)
        return "Erro ao buscar alterações do GitHub"
    
    # Verificar se há alterações
    success, output = run_command("git status -uno")
    if "Your branch is up to date" in output:
        logging.info("Nenhuma alteração detectada. Repositório já atualizado.")
        return "Nenhuma alteração detectada"
    
    # Fazer backup do código atual
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_{timestamp}"
    logging.info(f"Criando backup em {backup_dir}...")
    
    # Apenas arquivos importantes
    for dir_to_backup in ['build', 'server']:
        success, output = run_command(f"mkdir -p {backup_dir}/{dir_to_backup} && cp -r {dir_to_backup}/* {backup_dir}/{dir_to_backup}/")
        if not success:
            logging.warning(f"Aviso ao fazer backup de {dir_to_backup}: {output}")
    
    # Atualizar do GitHub
    logging.info("Atualizando código do GitHub...")
    success, output = run_command("git reset --hard origin/main")
    if not success:
        logging.error("Erro ao atualizar código: " + output)
        return "Erro ao atualizar código do GitHub"
    
    # Instalar dependências Python atualizadas
    logging.info("Instalando dependências...")
    success, output = run_command("pip install --user -r requirements.txt")
    if not success:
        logging.warning("Aviso ao instalar dependências: " + output)
    
    # Reconstruir o frontend se necessário
    # Normalmente você faria isso localmente e enviaria o build,
    # mas é possível automatizar se o PythonAnywhere tiver Node.js
    
    # Tocar arquivo de reload para o PythonAnywhere recarregar a aplicação
    logging.info("Recarregando aplicação...")
    success, output = run_command("touch /var/www/USERNAME_pythonanywhere_com_wsgi.py")
    if not success:
        logging.warning("Aviso ao recarregar aplicação: " + output)
    
    # Registrar conclusão da atualização
    logging.info("Atualização concluída com sucesso!")
    return "Atualização concluída com sucesso!"

if __name__ == "__main__":
    result = update_from_github()
    print(result)
