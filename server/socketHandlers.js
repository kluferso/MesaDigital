const rooms = new Map();

function handleSocketConnection(io, socket) {
  console.log('New client connected:', socket.id);

  socket.on('join_room', async (data) => {
    try {
      const { roomId, name, instrument, ...mediaConfig } = data;
      
      // Cria a sala se não existir
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: new Map(),
          messages: [],
          createdAt: new Date()
        });
      }

      const room = rooms.get(roomId);
      
      // Adiciona o usuário à sala
      room.users.set(socket.id, {
        id: socket.id,
        name,
        instrument,
        mediaConfig,
        joinedAt: new Date()
      });

      // Entra na sala do Socket.IO
      socket.join(roomId);

      // Notifica todos na sala
      io.to(roomId).emit('user_joined', {
        user: {
          id: socket.id,
          name,
          instrument
        }
      });

      // Envia dados da sala para o novo usuário
      socket.emit('room_joined', {
        room: {
          id: roomId,
          userId: socket.id,
          users: Array.from(room.users.values())
        }
      });

      // Envia histórico de mensagens
      room.messages.forEach(message => {
        socket.emit('chat_message', message);
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('room_error', { message: 'Error joining room' });
    }
  });

  socket.on('send_message', (data) => {
    const userRoom = Array.from(socket.rooms).find(room => rooms.has(room));
    
    if (!userRoom) {
      socket.emit('room_error', { message: 'Not in a room' });
      return;
    }

    const room = rooms.get(userRoom);
    const user = room.users.get(socket.id);

    if (!user) {
      socket.emit('room_error', { message: 'User not found' });
      return;
    }

    const message = {
      ...data,
      userId: socket.id,
      user: {
        id: socket.id,
        name: user.name,
        instrument: user.instrument
      }
    };

    // Salva a mensagem no histórico
    room.messages.push(message);

    // Limita o histórico a 100 mensagens
    if (room.messages.length > 100) {
      room.messages.shift();
    }

    // Envia para todos na sala
    io.to(userRoom).emit('chat_message', message);
  });

  socket.on('leave_room', () => {
    const userRoom = Array.from(socket.rooms).find(room => rooms.has(room));
    
    if (userRoom) {
      const room = rooms.get(userRoom);
      const user = room.users.get(socket.id);

      if (user) {
        // Remove o usuário da sala
        room.users.delete(socket.id);

        // Notifica todos na sala
        io.to(userRoom).emit('user_left', { userId: socket.id });

        // Remove a sala se estiver vazia
        if (room.users.size === 0) {
          rooms.delete(userRoom);
        }
      }

      // Sai da sala do Socket.IO
      socket.leave(userRoom);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Procura o usuário em todas as salas
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        // Remove o usuário da sala
        room.users.delete(socket.id);

        // Notifica todos na sala
        io.to(roomId).emit('user_left', { userId: socket.id });

        // Remove a sala se estiver vazia
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });

  // Manipulador de mensagens de chat
  const handleChatMessage = (io, socket, { roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }

    // Garantir que o remetente esteja na sala
    if (!room.users.some(user => user.id === socket.id)) {
      socket.emit('error', { message: 'Você não está nesta sala' });
      return;
    }

    // Adicionar informações do remetente à mensagem
    const user = room.users.find(user => user.id === socket.id);
    const enrichedMessage = {
      ...message,
      sender: socket.id,
      senderName: user.name,
      instrument: user.instrument
    };

    // Enviar mensagem para todos na sala
    io.to(roomId).emit('chat_message', enrichedMessage);
    
    // Opcional: armazenar mensagens recentes para novos participantes
    if (!room.messages) {
      room.messages = [];
    }
    
    // Limitando a 50 mensagens recentes por sala
    room.messages.push(enrichedMessage);
    if (room.messages.length > 50) {
      room.messages.shift();
    }
    
    console.log(`Mensagem de chat em ${roomId} de ${user.name}: ${message.text.substring(0, 30)}...`);
  };

  socket.on('chat_message', (data) => {
    handleChatMessage(io, socket, data);
  });

  // Handlers de mídia
  socket.on('track_toggle', (data) => {
    const { type, enabled } = data;
    const userRoom = Array.from(socket.rooms).find(room => rooms.has(room));
    
    if (userRoom) {
      io.to(userRoom).emit('track_toggle', {
        userId: socket.id,
        type,
        enabled
      });
    }
  });
}

module.exports = handleSocketConnection;
