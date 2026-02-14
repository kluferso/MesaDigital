# Guia de Deploy - Mesa Digital

Este documento descreve como preparar e implantar a aplicação **Mesa Digital**, uma plataforma de ensaio musical online com suporte a WebRTC e Socket.IO.

## Pré-requisitos

- Node.js 16+
- Servidor com suporte a HTTPS (obrigatório para WebRTC/Microfone)
- Servidor com suporte a WebSockets (Socket.IO)

## Instalação e Build

O projeto utiliza uma estrutura monorepo simplificada onde o Node.js serve tanto a API quanto o frontend estático.

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Build do Frontend**:
   O servidor Node.js serve os arquivos estáticos da pasta `build/`. Você deve gerar o build de produção do React antes de iniciar o servidor.
   ```bash
   npm run build
   ```

## Estrutura de Pastas

- `/server`: Código do backend (Node.js/Express/Socket.IO)
- `/src`: Código do frontend (React)
- `/public`: Assets estáticos
- `/uploads`: Diretório para armazenamento de partituras (PDFs)
- `/build`: Frontend compilado (gerado pelo `npm run build`)

## Executando em Produção

Para iniciar o servidor em produção:

```bash
# Define a porta (opcional, padrão 5000) e inicia
set PORT=8080 && node server/index.js
# ou
npm start
```

### Persistência de Arquivos
O sistema permite upload de partituras que são salvas na pasta `uploads/`. Certifique-se de que esta pasta tenha permissões de escrita e seja persistida entre deploys (volume persistente em Docker/K8s).

## Configuração de HTTPS (Obrigatório)

O navegador **bloqueará** o acesso ao microfone e câmera se o site não estiver servido via HTTPS (exceto em localhost).

- **VPS (Nginx + Certbot):** Configure o Nginx como proxy reverso para a porta do Node.js e use Certbot para SSL gratuito.
- **Heroku/Railway/Render:** O HTTPS é gerenciado automaticamente pela plataforma.

## Configuração de WebRTC (STUN/TURN)

Para produção, recomenda-se configurar servidores TURN próprios para garantir conectividade através de firewalls restritivos. Atualmente o projeto usa servidores STUN públicos do Google.

Para configurar servidores ICE personalizados, edite `src/services/webrtc/WebRTCManager.js`.

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 5000)
- `NODE_ENV`: Define o ambiente (development/production)

## Solução de Problemas Comuns

- **Erro "GetUserMedia"**: Verifique se está usando HTTPS.
- **Conexão cai**: Verifique se as portas UDP (WebRTC) não estão bloqueadas pelo firewall.
- **Metrônomo dessincronizado**: A latência da rede pode variar. O sistema usa sincronização NTP-like para minimizar isso.
- **Uploads falhando**: Verifique as permissões da pasta `uploads/`.
