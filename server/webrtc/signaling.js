/**
 * signaling.js
 * Gerencia a sinalização WebRTC no servidor
 */

function handleWebRTCSignaling(io, socket, rooms) {
  // Enviar sinal WebRTC para outro cliente
  socket.on('webrtc_signal', (data) => {
    const { to, signal, type, roomId } = data;
    
    if (!roomId) {
      console.error('Tentativa de envio de sinal WebRTC sem roomId');
      return;
    }
    
    // Adicionar campo 'from' ao sinal
    const signalData = {
      from: socket.id,
      signal,
      type,
      roomId
    };
    
    // Enviar o sinal para o cliente de destino
    if (to === 'all') {
      // Broadcast para toda a sala
      socket.to(roomId).emit('webrtc_signal', signalData);
    } else {
      // Enviar apenas para um cliente específico
      io.to(to).emit('webrtc_signal', signalData);
    }
  });
  
  // Evento para controle de qualidade de conexão
  socket.on('connection_quality', (data) => {
    const { roomId, quality } = data;
    
    // Verificar se está em uma sala
    if (!roomId) {
      console.error('Tentativa de atualização de qualidade sem roomId');
      return;
    }
    
    // Adicionar userId
    const qualityData = {
      ...quality,
      userId: socket.id
    };
    
    // Enviar para todos na sala
    io.to(roomId).emit('connection_quality', qualityData);
  });
  
  // Função para notificar usuários WebRTC na sala
  const notifyWebRTCUsers = (roomId) => {
    if (!roomId || !rooms.has(roomId)) return;
    
    const webRTCUsers = [];
    const room = rooms.get(roomId);
    
    // Construir lista de usuários com WebRTC
    room.users.forEach(user => {
      if (user.webrtcEnabled) {
        webRTCUsers.push({
          id: user.id,
          name: user.name,
          instrument: user.instrument
        });
      }
    });
    
    // Enviar lista atualizada
    io.to(roomId).emit('webrtc_users', {
      users: webRTCUsers
    });
  };
  
  // Estender eventos existentes para incluir WebRTC
  
  // NOTE: A lógica de interceptação de eventos 'create_room' e 'join_room' foi movida 
  // para o arquivo principal (server/index.js) para evitar handlers duplicados.
  // Este arquivo agora foca apenas na troca de mensagens de sinalização (offer/answer/candidate)
  // e eventos auxiliares de qualidade.

  // Mantendo a função notifyWebRTCUsers para uso futuro se necessário
  // mas a notificação principal deve vir do gerenciamento central de estado da sala.
}

module.exports = handleWebRTCSignaling;
