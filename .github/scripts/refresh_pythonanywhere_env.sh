#!/bin/bash
# Script para atualizar ambiente virtual no PythonAnywhere
# Uso: bash .github/scripts/refresh_pythonanywhere_env.sh

# 1. Remover virtualenv antigo (opcional)
# workon mesadigital-env
# deactivate
rmvirtualenv mesadigital-env

# 2. Criar novo virtualenv
mkvirtualenv mesadigital-env --python=python3.8

# 3. Instalar dependências principais
target_req="requirements.txt"
if [ -f "pythonanywheredeploy/requirements.txt" ]; then
    target_req="pythonanywheredeploy/requirements.txt"
fi
if [ -f "server/requirements.txt" ]; then
    target_req="server/requirements.txt"
fi

pip install -r $target_req

echo "Ambiente virtual atualizado com sucesso! Lembre-se de apontar o webapp para o novo virtualenv e recarregar o app no painel do PythonAnywhere."
