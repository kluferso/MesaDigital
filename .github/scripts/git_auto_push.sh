#!/bin/bash
# Script para commit e push automáticos para o repositório Git
# Uso: bash .github/scripts/git_auto_push.sh "Mensagem do commit"

COMMIT_MSG=${1:-"Atualização automática de dependências e scripts"}

git add .
git commit -m "$COMMIT_MSG"
git push origin main

echo "Push automático realizado. Aguarde o deploy automático via GitHub Actions (PythonAnywhere)."
