============================================
MESA DIGITAL - PACOTE DE DEPLOY PYTHONANYWHERE
============================================

Este pacote contém todos os arquivos necessários para fazer o deploy da aplicação Mesa Digital no PythonAnywhere.

Conteúdo:
- /build: Pasta com os arquivos compilados do frontend React
- /server: Pasta com os arquivos do servidor Flask e configuração WSGI
- requirements.txt: Lista de dependências Python
- DEPLOY.md: Instruções detalhadas para deploy

Para instruções completas sobre como fazer o deploy, consulte o arquivo DEPLOY.md

Características desta versão:
- Monitoramento em tempo real da qualidade da conexão
- Reconexão automática em caso de queda de rede
- Modo de emergência para entrada na sala mesmo com problemas técnicos
- Interface moderna com indicadores visuais de qualidade de conexão
- Compatibilidade com WebSockets para comunicação em tempo real

Requisitos:
- Conta no PythonAnywhere (recomendada conta paga para acesso a WebSockets)
- Python 3.8 ou superior
- Dependências listadas no arquivo requirements.txt
