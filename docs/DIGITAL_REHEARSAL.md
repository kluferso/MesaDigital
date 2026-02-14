# Mesa Digital - Módulo de Ensaio Digital

Este documento descreve as novas funcionalidades implementadas para transformar o Mesa Digital em uma plataforma completa para ensaios musicais remotos.

## 1. Player de Música e Setlist

Integramos um sistema de playlist colaborativa (Setlist) que permite aos músicos buscar, adicionar e organizar músicas do YouTube para ensaios.

### Funcionalidades
- **Busca Integrada**: Pesquise músicas diretamente no YouTube sem sair da sala.
- **Playlist Colaborativa**: Todos os participantes da sala veem e controlam a mesma playlist (Setlist).
- **Sincronização**: Adição e remoção de músicas são atualizadas em tempo real para todos os usuários via Socket.IO.
- **Streaming de Áudio**: Reprodução de áudio de alta qualidade diretamente do servidor para os clientes.

### Arquitetura
- **Backend**: Python Flask com `yt-dlp` para extração de metadados e URLs de stream.
- **Frontend**: React com Material UI, usando `useMusicPlayer` hook para gerenciar estado e eventos de socket.
- **Comunicação**: Eventos Socket.IO (`music_add_song`, `music_playlist_updated`) garantem que todos estejam na mesma página.

## 2. Novo Visual "Studio Mode"

A interface foi completamente reformulada para um tema "Dark Studio", inspirado em softwares de produção musical (DAWs) e plataformas de streaming modernas.

- **Tema Escuro**: Reduz o cansaço visual durante longas sessões de ensaio.
- **Cores de Acento**: Neon Purple (`#6200ea`) e Cyan (`#03dac6`) para destaque e modernidade.
- **Componentes Arredondados**: Estética moderna e fluida.

## 3. Como Usar

1. Entre em uma sala de estúdio.
2. Clique na aba **"Player"** (ícone de nota musical).
3. Use a aba **"Buscar"** para encontrar uma música no YouTube.
4. Clique no botão **"+"** para adicionar à Setlist.
5. Vá para a aba **"Playlist"** e clique no **Play** para iniciar.

## 4. Requisitos Técnicos

- **yt-dlp**: Biblioteca Python para interação com YouTube.
- **FFmpeg**: Recomendado instalar no servidor para melhor compatibilidade de formatos de áudio.

## 5. Próximos Passos (Sugestões)

- Implementar sincronização precisa de "Play/Pause" (atualmente apenas o estado visual é sincronizado, cada cliente inicia o stream individualmente).
- Adicionar suporte a letras de músicas.
- Permitir upload de arquivos MP3 locais.
