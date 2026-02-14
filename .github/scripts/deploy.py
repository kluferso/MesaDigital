#!/usr/bin/env python
import os
import sys
import time
import requests
import json

def log(message):
    """Exibir mensagem com timestamp"""
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}")

def deploy_to_pythonanywhere():
    """
    Executa o deploy para o PythonAnywhere usando a API
    
    Esta abordagem é mais confiável que webhooks pois:
    1. Não depende da conexão direta do GitHub com o PythonAnywhere
    2. Pode incluir tentativas de reconexão em caso de falha
    3. Fornece feedback mais detalhado sobre o processo
    """
    # Obtém credenciais do ambiente
    api_token = os.environ.get('PYTHONANYWHERE_API_TOKEN')
    username = os.environ.get('PYTHONANYWHERE_USERNAME', 'kluferso')
    
    if not api_token:
        log("Erro: Token de API do PythonAnywhere não encontrado")
        log("Por favor, adicione PYTHONANYWHERE_API_TOKEN aos secrets do GitHub")
        sys.exit(1)
    
    # Configuração base da API
    base_url = f"https://www.pythonanywhere.com/api/v0/user/{username}/"
    headers = {
        'Authorization': f'Token {api_token}',
        'Content-Type': 'application/json'
    }
    
    # Step 1: Executar o comando de pull via a API de consoles
    log("Iniciando pull do código do GitHub...")
    
    # Criar um novo console para executar comandos
    console_url = f"{base_url}consoles/"
    console_data = {
        'executable': 'bash',
        'arguments': '',
        'working_directory': f'/home/{username}/MesaDigital'
    }
    
    try:
        # Criar console
        console_response = requests.post(
            console_url, 
            headers=headers,
            json=console_data
        )
        console_response.raise_for_status()
        console_id = console_response.json().get('id')
        
        log(f"Console criado com ID: {console_id}")
        
        # Executar comandos no console
        send_input_url = f"{base_url}consoles/{console_id}/send_input/"
        commands = [
            f"cd /home/{username}/MesaDigital\n",
            "git pull origin main\n",
            "pip install -r requirements.txt --user\n",
            "exit\n"
        ]
        
        # Enviar comandos um por um
        for cmd in commands:
            log(f"Executando: {cmd.strip()}")
            send_response = requests.post(
                send_input_url,
                headers=headers,
                json={'input': cmd}
            )
            send_response.raise_for_status()
            # Pequena pausa para permitir que o comando seja processado
            time.sleep(2)
        
        log("Comandos executados com sucesso")
        
    except requests.RequestException as e:
        log(f"Erro ao executar comandos: {str(e)}")
        if hasattr(e, 'response') and e.response:
            log(f"Resposta do servidor: {e.response.text}")
        
    # Step 2: Recarregar a aplicação web
    log("Recarregando aplicação web...")
    
    try:
        reload_url = f"{base_url}webapps/{username}.pythonanywhere.com/reload/"
        reload_response = requests.post(reload_url, headers=headers)
        reload_response.raise_for_status()
        log("Aplicação web recarregada com sucesso!")
        log("Deploy concluído com sucesso!")
        return True
        
    except requests.RequestException as e:
        log(f"Erro ao recarregar aplicação: {str(e)}")
        if hasattr(e, 'response') and e.response:
            log(f"Resposta do servidor: {e.response.text}")
        return False

if __name__ == "__main__":
    log("Iniciando deploy para PythonAnywhere...")
    success = deploy_to_pythonanywhere()
    if not success:
        sys.exit(1)
