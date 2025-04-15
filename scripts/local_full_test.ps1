# Teste automatizado frontend + backend (Windows PowerShell)

Write-Host "`n[FRONTEND] Instalando dependências..."
npm install

Write-Host "`n[FRONTEND] Gerando build de produção..."
npm run build

Write-Host "`n[FRONTEND] Servindo build em http://localhost:5000 ..."
Start-Process npx -ArgumentList "serve -s build -l 5000"
Start-Sleep -Seconds 3

# Ambiente virtual Python
if (!(Test-Path "venv")) {
    Write-Host "`n[BACKEND] Criando ambiente virtual..."
    python -m venv venv
}

Write-Host "`n[BACKEND] Ativando ambiente virtual e instalando dependências..."
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "`n[BACKEND] Subindo Flask em http://localhost:8000 ..."
$env:FLASK_APP = "server/flask_app.py"
$env:FLASK_ENV = "development"
Start-Process powershell -ArgumentList "flask run --port=8000"
Start-Sleep -Seconds 3

Write-Host "`nAbrindo navegador para http://localhost:5000 ..."
Start-Process "http://localhost:5000"

Write-Host "`nTudo rodando! Para encerrar, feche as janelas ou mate os processos 'serve' e 'flask'."
