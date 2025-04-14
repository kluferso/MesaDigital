# Guia de Deploy do Mesa Digital no PythonAnywhere

Este guia explica como fazer o deploy da aplicação Mesa Digital no PythonAnywhere.

## Pré-requisitos

1. Uma conta no PythonAnywhere (gratuita ou paga)
2. Aplicação Mesa Digital já construída (arquivos de build)

## Passos para Deploy

### 1. Preparação Inicial

- Faça login na sua conta do PythonAnywhere
- Na dashboard, selecione a aba "Consoles" e inicie um novo console "Bash"

### 2. Configurando o Ambiente

```bash
# Crie um diretório para o projeto
mkdir -p mesadigital

# Clone o repositório ou faça upload dos arquivos
# Opção 1: Clone o repositório (se estiver no GitHub)
# git clone https://github.com/seu-usuario/MesaDigital.git mesadigital

# Opção 2: Faça upload do código (o que faremos agora)
# Use a interface web do PythonAnywhere para fazer upload dos arquivos
```

### 3. Configuração da Web App

1. Na dashboard do PythonAnywhere, vá para a aba "Web"
2. Clique em "Add a new web app"
3. Escolha seu domínio (normalmente será username.pythonanywhere.com)
4. Na página de seleção de framework, escolha "Manual Configuration"
5. Selecione a versão Python (recomendamos Python 3.8 ou superior)

### 4. Configurar o WSGI

1. Na página da sua web app, localize a seção "Code" e clique no link do arquivo WSGI
2. Substitua o conteúdo do arquivo pelo conteúdo do seu arquivo `server/wsgi.py`
3. Certifique-se de que o caminho para o seu projeto está correto

### 5. Configurar o Caminho da Aplicação

1. Na página da sua web app, defina:
   - Source code: `/home/seu-usuario/mesadigital`
   - Working directory: `/home/seu-usuario/mesadigital`

### 6. Instalar Dependências

No console Bash, execute:

```bash
cd mesadigital
pip install --user -r requirements.txt
```

### 7. Configurar Arquivos Estáticos

1. Na seção "Static Files" da página da sua web app, adicione:
   - URL: `/static/`
   - Directory: `/home/seu-usuario/mesadigital/build/static`
   
2. Adicione outra entrada para os arquivos na raiz:
   - URL: `/`
   - Directory: `/home/seu-usuario/mesadigital/build`

### 8. Habilitar WebSockets

Para que o Socket.IO funcione no PythonAnywhere, você precisa de uma conta paga e habilitar WebSockets:

1. Vá para a página da sua web app
2. Na seção "Web" encontre "Enable WebSockets" e ative-o (apenas disponível em contas pagas)

### 9. Reiniciar a Aplicação

1. Na página da sua web app, clique no botão verde "Reload"
2. Aguarde alguns segundos para que as alterações sejam aplicadas

## Solução de Problemas

### Se a aplicação não iniciar:

1. Verifique os logs de erro na seção "Logs" da página da sua web app
2. Certifique-se de que todas as dependências foram instaladas corretamente
3. Verifique se os caminhos configurados estão corretos

### Problemas com Socket.IO:

1. Certifique-se de que WebSockets está habilitado (apenas em contas pagas)
2. Teste com fallback de polling (menos eficiente, mas mais compatível)

## Atualização da Aplicação

Para atualizar a aplicação após fazer alterações:

1. Reconstrua o frontend com `npm run build`
2. Faça upload dos novos arquivos para o PythonAnywhere
3. Reinicie a aplicação na página da web app

## Observações Importantes

- Certifique-se de que o WebRTC está configurado para usar STUN/TURN públicos
- PythonAnywhere tem limitações para contas gratuitas (sem WebSockets, limitações de CPU, etc.)
- Para uso em produção, considere uma conta paga ou outra plataforma com suporte total a WebSockets
