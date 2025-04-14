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
  
  // Evento original: create_room
  // Verificar se existe listener para 'create_room' antes de tentar removê-lo
  const createRoomListeners = socket.listeners('create_room');
  const originalCreateRoom = createRoomListeners.length > 0 ? createRoomListeners[0] : null;
  
  // Só remover o listener original se ele existir
  if (originalCreateRoom) {
    socket.removeListener('create_room', originalCreateRoom);
  }
  
  socket.on('create_room', (data) => {
    // Verificar se o usuário suporta WebRTC
    const hasWebRTC = !!data.webrtcEnabled;
    
    // Salvar esta informação
    data.webrtcEnabled = hasWebRTC;
    
    // Chamar handler original ou criar comportamento padrão
    if (originalCreateRoom) {
      originalCreateRoom(data);
    } else {
      // Comportamento padrão se não houver handler original
      console.log(`Usuário ${data.name} criou sala com suporte WebRTC: ${hasWebRTC}`);
      // Implementar lógica básica de criação de sala aqui se necessário
    }
  });
  
  // Evento original: join_room
  const joinRoomListeners = socket.listeners('join_room');
  const originalJoinRoom = joinRoomListeners.length > 0 ? joinRoomListeners[0] : null;
  
  // Só remover o listener original se ele existir
  if (originalJoinRoom) {
    socket.removeListener('join_room', originalJoinRoom);
  }
  
  socket.on('join_room', (data) => {
    const { roomId, name, instrument } = data;
    const webrtcEnabled = !!data.webrtcEnabled;
    
    console.log(`${name} está entrando na sala ${roomId} com WebRTC: ${webrtcEnabled}`);
    
    // Salvar informações do usuário no socket
    socket.webrtcEnabled = webrtcEnabled;
    
    // Chamar handler original ou criar comportamento padrão
    if (originalJoinRoom) {
      originalJoinRoom(data);
    } else {
      // Comportamento padrão se não houver handler original
      console.log(`Usuário ${name} entrou na sala ${roomId}`);
      
      // Verificar se a sala existe
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { 
          id: roomId, 
          users: [] 
        });
      }
      
      // Adicionar usuário à sala
      const room = rooms.get(roomId);
      room.users.push({
        id: socket.id,
        name,
        instrument,
        webrtcEnabled
      });
      
      // Associar roomId ao socket
      socket.roomId = roomId;
      
      // Entrar na sala Socket.IO
      socket.join(roomId);
      
      // Notificar outros usuários
      socket.to(roomId).emit('user_joined', {
        userId: socket.id,
        userName: name,
        instrument
      });
      
      // Enviar lista de usuários para o cliente que acabou de entrar
      socket.emit('room_users', {
        users: room.users.map(u => ({
          id: u.id,
          name: u.name,
          instrument: u.instrument
        }))
      });
    }
    
    // Notificar sobre usuários WebRTC na sala
    setTimeout(() => {
      notifyWebRTCUsers(roomId);
    }, 1000);
  });
}

module.exports = handleWebRTCSignaling;
