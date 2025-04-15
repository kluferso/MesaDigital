#!/bin/bash
# Script automatizado para testar frontend e backend localmente e abrir navegador

# 1. Teste do frontend (dev e produção)
echo "[FRONTEND] Instalando dependências..."
npm install

echo "[FRONTEND] Gerando build de produção..."
npm run build

# 2. Sobe servidor do build (produção)
echo "[FRONTEND] Servindo build em http://localhost:5000 ..."
npx serve -s build &
FRONTEND_PID=$!
sleep 3

# 3. Teste do backend
if [ ! -d "venv" ]; then
  echo "[BACKEND] Criando ambiente virtual..."
  python -m venv venv
fi
source venv/bin/activate

echo "[BACKEND] Instalando dependências..."
pip install --upgrade pip
pip install -r requirements.txt

# 4. Sobe o backend (Flask)
echo "[BACKEND] Subindo Flask em http://localhost:8000 ..."
export FLASK_APP=server/flask_app.py
export FLASK_ENV=development
flask run -p 8000 &
BACKEND_PID=$!
sleep 3

# 5. Abrir navegador (frontend build)
echo "Abrindo navegador para http://localhost:5000 ..."
if command -v xdg-open >/dev/null; then
  xdg-open http://localhost:5000
elif command -v gnome-open >/dev/null; then
  gnome-open http://localhost:5000
elif command -v open >/dev/null; then
  open http://localhost:5000
elif command -v start >/dev/null; then
  start http://localhost:5000
else
  echo "Abra manualmente: http://localhost:5000"
fi

# 6. Instruções para parar
echo "\nPressione Ctrl+C para encerrar ambos os servidores."
trap "kill $FRONTEND_PID $BACKEND_PID" EXIT
wait
