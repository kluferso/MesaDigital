## Diagnóstico e Progresso (Atualizado)

### Status Atual: ✅ Implementado (Fase 1 e 2 Concluídas)

#### 1. Correções de Sala e i18n
- [x] **Traduções**: Implementado uso de `t('...')` em `EnhancedStudioRoom`, `ParticipantCard`, etc.
- [x] **Labels**: Removidos textos hardcoded.

#### 2. Chat e Presença Multiusuário
- [x] **Chat Contextual**: `ChatPanel` agora usa `useSocket` e `useParams` corretamente.
- [x] **Lista de Usuários**: `ParticipantCard` atualizado e integrado ao layout lateral.
- [x] **Eventos de Sala**: Unificado `room_users` e `user_joined` no backend Node.js.

#### 3. Sinalização WebRTC e Vídeo
- [x] **Unificação**: Lógica de sinalização limpa em `server/index.js` e `WebRTCManager.js`.
- [x] **Vídeo MVP**:
  - `WebRTCManager` suporta `toggleVideo` e `offerToReceiveVideo: true`.
  - Controles de câmera adicionados ao `ParticipantCard` e Toolbar do Palco.
  - Overlay de vídeo local implementado no "Modo Ensaio".

#### 4. Novo Layout "Rehearsal First" (Inovação)
- [x] **Layout de 3 Colunas**:
  - **Esquerda**: Participantes e Mixer Compacto.
  - **Centro**: Palco Virtual (`StageView`) + Vídeo Overlay.
  - **Direita**: Chat e Configurações.
- [x] **Stage View**: Visualização espacial dos usuários (posição estéreo) implementada com `canvas`/`div` absolute.
- [x] **Metrônomo Compartilhado**: Sincronização via NTP-like (`TimeSyncService`) e áudio local sintetizado.

---

## Próximos Passos (Plano de Inovação Contínua)

### 1. Gravação de Ensaio (Client-Side) 🔴
Permitir que qualquer participante grave o áudio mixado (ou seu próprio áudio + retorno) diretamente no navegador.
- **Técnica**: Usar `MediaRecorder` API no `AudioContext` principal (`WebRTCManager`).
- **Feature**: Botão "REC" no topo. Download automático de `.webm` ou `.wav` ao final.

### 2. Compartilhamento de Partituras/Arquivos 📄
Aba ou modal para upload e visualização sincronizada de PDFs.
- **Técnica**: Upload via Socket.io (buffer) ou link externo.
- **Visualização**: `react-pdf` ou iframe simples para MVP.

### 3. Refinamento de Vídeo (Grade/Grid) 📹
Atualmente o vídeo é um overlay simples.
- **Melhoria**: Criar um `VideoGrid` que substitui o `StageView` quando o foco for visual, ou renderiza pequenos vídeos sobre os avatares no Palco.

### 4. Validação e Testes 🧪
- Executar testes unitários de `WebRTCManager`.
- Teste manual de conexão (simulado).

---

## Instruções para Teste Manual

1. **Iniciar Servidor**: `npm start` (Backend Node + Frontend React).
2. **Abrir 2 Abas**: `http://localhost:3000/room/teste123`.
3. **Verificar**:
   - Chat funcionando entre abas.
   - Metrônomo sincronizado (iniciar em uma, ver na outra).
   - Movimentar avatar no Palco (deve mover na outra aba).
   - Ativar Vídeo (permitir câmera).
