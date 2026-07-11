# Guia de Deploy no Render.com - 100% Gratuito

## Pré-requisitos
- Conta no GitHub com o projeto MesaDigital
- Conta no Render.com (grátis em https://render.com)

## Passo a Passo (5 minutos)

### 1. Criar Conta no Render
1. Acesse https://render.com
2. Clique em "Sign Up"
3. Faça login com GitHub (recomendado)

### 2. Conectar Repositório
1. No dashboard do Render, clique em "New +"
2. Selecione "Web Service"
3. Clique em "Connect GitHub"
4. Autorize o Render a acessar seu GitHub
5. Selecione o repositório `kluferso/MesaDigital`

### 3. Configurar o Deploy (Node.js Nativo - CONFIGURAÇÃO MANUAL)
Render detectará automaticamente a configuração Node.js, mas você DEVE configurar manualmente:

**Configurações MANUAIS (obrigatório):**
- **Name**: mesa-digital
- **Region**: Oregon (ou São Paulo se disponível)
- **Branch**: main
- **Plan**: Free
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**CRUCIAL**: O Render NÃO executa npm install automaticamente. Você DEVE configurar manualmente o Build Command como `npm install && npm run build`.

**Variáveis de ambiente (adicione manualmente):**
- PORT: 5000
- NODE_ENV: production

### 4. Deploy
1. Clique em "Create Web Service"
2. Aguarde o build (3-5 minutos)
3. O Render fornecerá uma URL como: `https://mesa-digital.onrender.com`

**Nota sobre a configuração:**
- Arquivo `.nvmrc` especifica Node.js 20 LTS (18 está EOL)
- Configuração nativa Node.js é mais estável que Docker
- Render gerencia automaticamente o ambiente Node.js
- **IMPORTANTE**: Se já existe um serviço, DELETE e crie um NOVO para aplicar as configurações

## Limitações do Plano Gratuito
- **Sleep**: Aplicações "dormem" após 15min inatividade
- **Wake-up**: Primeiro acesso após sleep leva ~30 segundos
- **RAM**: 512MB
- **CPU**: Compartilhado
- **Bandwidth**: 100GB/mês

**Para ensaio com 5 pessoas**: Funciona perfeitamente! Basta alguém acessar o site 5min antes do ensaio para "acordar" o servidor.

## Deploy Automático
Toda vez que você fizer `git push` para a branch `main`, o Render fará deploy automático.

## Acessar a Aplicação
Após o deploy, acesse: `https://mesa-digital.onrender.com`

## Troubleshooting

### Erro: "Application failed to start"
- Verifique os logs em "Logs" no dashboard do Render
- Certifique-se que o `package.json` tem o script `start`

### Erro: "Port already in use"
- O Render define automaticamente a porta via variável de ambiente
- O código já está configurado para usar `process.env.PORT || 5000`

### Aplicação não "acorda"
- Acesse a URL diretamente no navegador
- Aguarde até 30 segundos para o primeiro carregamento

### Upload de arquivos não funciona
- No plano gratuito, arquivos são perdidos ao reiniciar
- Para persistência, considere upgrade para plano pago ou usar serviço externo (AWS S3, Cloudinary)

## Dicas para Melhor Performance

### 1. Manter Servidor Ativo
Antes do ensaio, alguém deve acessar o site 5 minutos antes.

### 2. Monitorar Logs
No dashboard do Render, acesse "Logs" para ver erros em tempo real.

### 3. Variáveis de Ambiente Adicionais
Se precisar adicionar mais variáveis:
1. No dashboard do serviço
2. Vá em "Environment"
3. Adicione novas variáveis

## URL Personalizada (Opcional)
Para usar domínio próprio:
1. No dashboard, vá em "Domains"
2. Adicione seu domínio
3. Configure DNS conforme instruções do Render

## Suporte
- Documentação: https://render.com/docs
- Status: https://status.render.com
