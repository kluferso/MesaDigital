#!/bin/bash
# Testa o frontend localmente (dev e produção)

# 1. Instala dependências
npm install

# 2. Roda em modo desenvolvimento
npm start &
DEV_PID=$!
echo "Frontend dev rodando em http://localhost:3000 (PID $DEV_PID)"

# 3. Gera build de produção
echo "Aguardando 10 segundos para dev subir antes do build..."
sleep 10
npm run build

# 4. Serve build de produção
npx serve -s build &
PROD_PID=$!
echo "Frontend produção rodando em http://localhost:5000 (PID $PROD_PID)"

# 5. Instruções para parar
trap "kill $DEV_PID $PROD_PID" EXIT
wait
