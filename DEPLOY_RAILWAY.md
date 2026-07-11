# Guia de Deploy no Railway.app - $5 Créditos/Mês

## Pré-requisitos
- Conta no GitHub com o projeto MesaDigital
- Conta no Railway.app (grátis em https://railway.app)

## Por que Railway.app?
- **Melhor suporte para WebRTC/Socket.IO** que o Render
- **Deploy automático via GitHub**
- **HTTPS automático**
- **$5 créditos/mês grátis** (suficiente para ensaio com 5 pessoas)
- **Não tem sleep inactivity** como o Render
- **Performance mais consistente**

## Passo a Passo (3 minutos)

### 1. Criar Conta no Railway
1. Acesse https://railway.app
2. Clique em "Start a New Project"
3. Faça login com GitHub (recomendado)

### 2. Conectar Repositório
1. Clique em "Deploy from GitHub repo"
2. Autorize o Railway a acessar seu GitHub
3. Selecione o repositório `kluferso/MesaDigital`
4. Clique em "Deploy Now"

### 3. Configuração Automática
Railway detectará automaticamente:
- **Runtime**: Node.js
- **Build Command**: npm install && npm run build
- **Start Command**: npm start

### 4. Variáveis de Ambiente
Railway adicionará automaticamente:
- `PORT`: Variável de ambiente gerada pelo Railway
- `NODE_ENV`: production

Se precisar adicionar mais variáveis:
1. Vá em "Variables" no dashboard
2. Adicione as variáveis necessárias

### 5. Deploy
1. Clique em "Deploy"
2. Aguarde o build (2-3 minutos)
3. O Railway fornecerá uma URL como: `https://mesa-digital.up.railway.app`

## Limitações do Plano Gratuito
- **$5 créditos/mês**: Suficiente para uso moderado
- **RAM**: 512MB
- **CPU**: Compartilhado
- **Bandwidth**: 1GB/mês (suficiente para ensaio com 5 pessoas)
- **Sem sleep inactivity**: Aplicação fica sempre ativa

**Para ensaio com 5 pessoas**: Perfeito! Sem sleep inactivity e performance consistente.

## Deploy Automático
Toda vez que você fizer `git push` para a branch `main`, o Railway fará deploy automático.

## Acessar a Aplicação
Após o deploy, acesse a URL fornecida pelo Railway.

## Troubleshooting

### Erro: "Build failed"
- Verifique os logs em "Logs" no dashboard do Railway
- Certifique-se que o `package.json` tem os scripts corretos

### Erro: "Application not responding"
- Verifique se a porta está configurada corretamente
- O Railway define a porta via variável de ambiente

### Upload de arquivos não funciona
- No plano gratuito, arquivos podem ser perdidos ao reiniciar
- Para persistência, considere upgrade ou usar serviço externo

## Monitoramento
- No dashboard do Railway, monitore uso de recursos
- Acompanhe logs em tempo real
- Configure alertas se necessário

## Dicas para Melhor Performance

### 1. Otimizar Build
- O Railway faz cache de dependências
- Builds subsequentes são mais rápidos

### 2. Variáveis de Ambiente
- Use variáveis de ambiente para configurações sensíveis
- Nunca faça commit de secrets no código

### 3. Monitorar Logs
- Acesse "Logs" para ver erros em tempo real
- Use logs estruturados para facilitar debug

## Comparação: Railway vs Render

| Característica | Railway.app | Render.com |
|---|---|---|
| Plano grátis | $5 créditos/mês | 100% gratuito |
| Sleep inactivity | Não | Sim (15min) |
| Suporte WebRTC | Excelente | Limitado |
| Deploy automático | Sim | Sim |
| HTTPS automático | Sim | Sim |
| Performance | Consistente | Variável |

## Suporte
- Documentação: https://docs.railway.app
- Status: https://status.railway.app
