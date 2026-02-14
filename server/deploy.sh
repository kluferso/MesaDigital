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

# Instala PM2 globalmente se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi

# Build do React
echo "Fazendo build do React..."
cd $PROJECT_DIR
rm -rf build
CI=false npm run build

# Ajusta as permissões do build
echo "Ajustando permissões..."
chmod -R 755 $PROJECT_DIR/build
find $PROJECT_DIR/build -type f -exec chmod 644 {} \;

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

# Verifica se o build foi criado
echo "Verificando build..."
if [ -f "$PROJECT_DIR/build/index.html" ]; then
    echo "Build criado com sucesso!"
    ls -la $PROJECT_DIR/build
else
    echo "ERRO: Build não foi criado corretamente!"
    echo "Conteúdo do diretório build:"
    ls -la $PROJECT_DIR/build
fi

echo "Deploy concluído!"
