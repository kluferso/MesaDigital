#!/bin/bash
# Testa o backend Flask localmente

# 1. Cria e ativa virtualenv
python -m venv venv
source venv/bin/activate

# 2. Instala dependências
pip install --upgrade pip
pip install -r requirements.txt

# 3. Roda o Flask (ajuste o caminho se necessário)
export FLASK_APP=server/flask_app.py
export FLASK_ENV=development
flask run

# Para Windows, use:
# venv\Scripts\activate
# set FLASK_APP=server/flask_app.py
# set FLASK_ENV=development
# flask run
