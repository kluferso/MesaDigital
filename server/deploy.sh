#!/bin/bash

echo "Iniciando deploy do MesaDigital..."

# Variáveis
PROJECT_DIR="/home/kluferso/MesaDigital"
WSGI_SOURCE="$PROJECT_DIR/server/pythonanywhere_wsgi.py"
WSGI_TARGET="/var/www/kluferso_pythonanywhere_com_wsgi.py"

# Atualiza o código
echo "Atualizando código do repositório..."
cd $PROJECT_DIR
git fetch --all
git reset --hard origin/main

# Instala dependências do Node.js
echo "Instalando dependências do Node.js..."
cd $PROJECT_DIR
npm install

# Instala PM2 globalmente
echo "Instalando PM2..."
npm install -g pm2

# Build do React
echo "Fazendo build do React..."
npm run build

# Instala dependências do Python
echo "Instalando dependências do Python..."
cd $PROJECT_DIR/server
pip install -r requirements.txt

# Copia o arquivo WSGI
echo "Configurando WSGI..."
cp $WSGI_SOURCE $WSGI_TARGET
chmod 644 $WSGI_TARGET

# Configura as variáveis de ambiente
echo "Configurando variáveis de ambiente..."
echo "PORT=3000" > $PROJECT_DIR/server/.env
echo "NODE_ENV=production" >> $PROJECT_DIR/server/.env

# Inicia o servidor Node.js com PM2
echo "Iniciando servidor Node.js..."
cd $PROJECT_DIR/server
pm2 delete mesadigital || true
pm2 start index.js --name mesadigital

# Recarrega o servidor WSGI
echo "Recarregando servidor WSGI..."
touch $WSGI_TARGET

echo "Deploy concluído!"
