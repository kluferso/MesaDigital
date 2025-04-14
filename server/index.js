require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  path: '/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 10000,
  pingInterval: 5000
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Importar handlers de sinalização WebRTC
const handleWebRTCSignaling = require('./webrtc/signaling');

// Armazena as salas e seus participantes
const rooms = new Map();

// Gerencia conexões Socket.IO
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // Aplicar handlers de sinalização WebRTC
  handleWebRTCSignaling(io, socket, rooms);

  // Quando um cliente cria uma sala
  socket.on('create_room', async (data) => {
    try {
      const { name, instrument, noMedia } = data;
      
      console.log(`Tentando criar sala por ${name} (${instrument})`);
      
      // Valida os dados
      if (!name || !instrument) {
        socket.emit('create_room_error', { message: 'Nome e instrumento são obrigatórios' });
        return;
      }

      // Gera um ID único para a sala
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Cria a sala
      const room = {
        id: roomId,
        users: new Map(),
        messages: [],
        createdAt: new Date()
      };

      // Adiciona a sala ao mapa
      rooms.set(roomId, room);
      
      // Adiciona o usuário à sala
      room.users.set(socket.id, {
        id: socket.id,
        name,
        instrument,
        noMedia,
        isAdmin: true,
        joinedAt: new Date()
      });
      
      // Junta o socket à sala
      socket.join(roomId);
      socket.roomId = roomId;
      
      console.log(`Sala ${roomId} criada por ${name}`);
      
      // Notifica o cliente
      socket.emit('create_room_success', {
        room: {
          id: roomId,
          userId: socket.id,
          users: Array.from(room.users.values())
        }
      });
      
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      socket.emit('create_room_error', { message: 'Erro ao criar sala' });
    }
  });

  // Quando um cliente tenta entrar em uma sala
  socket.on('join_room', async (data) => {
    try {
      const { roomId, name, instrument, hasMedia } = data;
      
      console.log(`Tentando entrar na sala ${roomId} como ${name} (${instrument})`);
      console.log('Socket atual:', socket.id);
      console.log('Socket roomId:', socket.roomId);
      
      // Valida os dados
      if (!roomId || !name || !instrument) {
        socket.emit('join_room_error', { message: 'ID da sala, nome e instrumento são obrigatórios' });
        return;
      }

      // Verifica se a sala existe
      const room = rooms.get(roomId);
      if (!room) {
        console.log(`Sala ${roomId} não existe`);
        socket.emit('join_room_error', { message: 'Esta sala não existe' });
        return;
      }

      // Se o usuário já está nesta sala específica, não precisa entrar novamente
      if (socket.roomId === roomId) {
        console.log(`${name} já está na sala ${roomId}`);
        socket.emit('join_room_success', {
          room: {
            id: roomId,
            userId: socket.id,
            users: Array.from(room.users.values())
          }
        });
        return;
      }

      // Se o usuário está em outra sala, remove ele da sala anterior
      if (socket.roomId && socket.roomId !== roomId) {
        const oldRoom = rooms.get(socket.roomId);
        if (oldRoom) {
          oldRoom.users.delete(socket.id);
          socket.leave(socket.roomId);
          io.to(socket.roomId).emit('user_left', {
            userId: socket.id,
            userName: name
          });
          
          // Se a sala antiga ficou vazia, remove ela
          if (oldRoom.users.size === 0) {
            rooms.delete(socket.roomId);
            console.log(`Sala ${socket.roomId} removida`);
          }
        }
      }

      // Adiciona o usuário à nova sala
      room.users.set(socket.id, {
        id: socket.id,
        name,
        instrument,
        hasMedia,
        isAdmin: false,
        joinedAt: new Date()
      });
      
      // Junta o socket à sala
      await socket.leave(socket.roomId); // Garante que saiu da sala anterior
      socket.roomId = roomId; // Atualiza o ID da sala atual
      await socket.join(roomId); // Entra na nova sala
      
      console.log(`${name} entrou na sala ${roomId}`);
      
      // Notifica todos na sala
      io.to(roomId).emit('user_joined', {
        user: {
          id: socket.id,
          name,
          instrument,
          hasMedia,
          isAdmin: false
        }
      });

      // Envia dados da sala para o novo usuário
      socket.emit('join_room_success', {
        room: {
          id: roomId,
          userId: socket.id,
          users: Array.from(room.users.values())
        }
      });
      
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      socket.emit('join_room_error', { message: 'Erro ao entrar na sala' });
    }
  });

  // Quando um cliente envia uma mensagem
  socket.on('send_message', (data) => {
    try {
      if (!socket.roomId) {
        socket.emit('message_error', { message: 'Você não está em nenhuma sala' });
        return;
      }

      const room = rooms.get(socket.roomId);
      if (!room) {
        socket.emit('message_error', { message: 'Sala não encontrada' });
        return;
      }

      const user = room.users.get(socket.id);
      if (!user) {
        socket.emit('message_error', { message: 'Usuário não encontrado' });
        return;
      }

      const message = {
        ...data,
        userId: socket.id,
        user: {
          id: socket.id,
          name: user.name,
          instrument: user.instrument
        },
        timestamp: new Date()
      };

      // Salva a mensagem no histórico
      room.messages.push(message);

      // Limita o histórico a 100 mensagens
      if (room.messages.length > 100) {
        room.messages.shift();
      }

      // Envia para todos na sala
      io.to(socket.roomId).emit('chat_message', message);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      socket.emit('message_error', { message: 'Erro ao enviar mensagem' });
    }
  });

  // Quando um cliente se desconecta
  socket.on('disconnect', () => {
    try {
      console.log('Cliente desconectado:', socket.id);
      
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          const user = room.users.get(socket.id);
          
          // Remove o usuário da sala
          room.users.delete(socket.id);
          
          // Se a sala ficou vazia, remove ela
          if (room.users.size === 0) {
            rooms.delete(socket.roomId);
            console.log(`Sala ${socket.roomId} removida`);
          } else {
            // Notifica os outros usuários
            io.to(socket.roomId).emit('user_left', {
              userId: socket.id,
              userName: user ? user.name : 'Usuário desconhecido'
            });
          }
        }
        // Limpa o roomId do socket
        socket.roomId = null;
        // Remove o socket da sala
        socket.leave(socket.roomId);
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  });

  // Quando um cliente sai da sala manualmente
  socket.on('leave_room', () => {
    try {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          const user = room.users.get(socket.id);
          
          // Remove o usuário da sala
          room.users.delete(socket.id);
          
          // Se a sala ficou vazia, remove ela
          if (room.users.size === 0) {
            rooms.delete(socket.roomId);
            console.log(`Sala ${socket.roomId} removida`);
          } else {
            // Notifica os outros usuários
            io.to(socket.roomId).emit('user_left', {
              userId: socket.id,
              userName: user ? user.name : 'Usuário desconhecido'
            });
          }
        }
        // Limpa o roomId do socket
        socket.roomId = null;
        // Remove o socket da sala
        socket.leave(socket.roomId);
      }
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
      socket.emit('leave_room_error', { message: 'Erro ao sair da sala' });
    }
  });
});

// Webhook para atualização automática do GitHub
app.post('/git-webhook', express.json(), (req, res) => {
  const { headers, body } = req;
  
  // Verificar se é um evento de push
  if (headers['x-github-event'] !== 'push') {
    return res.status(200).send('Evento ignorado');
  }

  // Executar script de atualização
  const execSync = require('child_process').execSync;
  try {
    execSync('bash ~/update_app.sh', { stdio: 'inherit' });
    res.status(200).send('Atualização concluída com sucesso');
  } catch (error) {
    console.error('Erro na atualização:', error);
    res.status(500).send('Erro na atualização');
  }
});

// Rota para servir o app React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Inicia o servidor
const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
