#!/bin/bash

# Log de início
echo "Iniciando atualização do MesaDigital..."

# Ir para o diretório do projeto
cd ~/MesaDigital

# Puxar alterações do GitHub
echo "Puxando alterações do GitHub..."
git pull

# Instalar dependências do projeto principal
echo "Instalando dependências do projeto principal..."
npm install

# Construir o app React
echo "Construindo o app React..."
npm run build

# Ir para o diretório do servidor
cd server

# Instalar dependências do servidor
echo "Instalando dependências do servidor..."
npm install

# Reiniciar o servidor Node.js
echo "Reiniciando o servidor..."
touch /var/www/kluferso_pythonanywhere_com_wsgi.py

echo "Atualização concluída!"
