require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
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
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// Estado do servidor
const rooms = new Map();
const users = new Map();

// Função para limpar recursos de um usuário
const cleanupUser = (socket, userId) => {
  const userData = users.get(userId);
  if (!userData) return;

  const { roomId } = userData;
  const room = rooms.get(roomId);
  
  if (room) {
    // Remover usuário da sala
    room.users = room.users.filter(u => u.id !== userId);
    
    // Se era admin, passar para outro usuário
    if (room.admin === userId && room.users.length > 0) {
      room.admin = room.users[0].id;
      room.users[0].isAdmin = true;
      io.to(roomId).emit('admin_changed', { admin: room.users[0] });
    }
    
    // Se a sala ficou vazia, remover
    if (room.users.length === 0) {
      console.log(`Removendo sala vazia: ${roomId}`);
      rooms.delete(roomId);
    } else {
      // Notificar outros usuários
      io.to(roomId).emit('user_left', { userId });
      io.to(roomId).emit('user_list', { users: room.users });
    }
  }

  // Remover socket da sala
  socket.leave(roomId);
  
  // Remover dados do usuário
  users.delete(userId);
  
  console.log(`Usuário ${userId} removido da sala ${roomId}`);
  console.log('Usuários na sala:', room?.users || []);
};

// Gerenciamento de conexões Socket.IO
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // Solicitar lista de usuários
  socket.on('request_user_list', ({ roomId }) => {
    try {
      const room = rooms.get(roomId);
      if (room) {
        socket.emit('user_list', { users: room.users });
      }
    } catch (error) {
      console.error('Erro ao buscar lista de usuários:', error);
      socket.emit('error', { message: 'Erro ao buscar lista de usuários' });
    }
  });

  socket.on('create_room', (data) => {
    try {
      const { name, instrument, noMedia } = data;
      const roomId = Math.random().toString(36).substring(7);
      
      // Verificar se usuário já está em uma sala
      if (users.has(socket.id)) {
        socket.emit('create_room_error', { message: 'Você já está em uma sala' });
        return;
      }
      
      const room = {
        id: roomId,
        admin: socket.id,
        users: [{
          id: socket.id,
          name,
          instrument,
          isAdmin: true,
          hasMedia: !noMedia
        }]
      };
      
      rooms.set(roomId, room);
      socket.join(roomId);
      users.set(socket.id, { 
        name, 
        instrument, 
        roomId,
        hasMedia: !noMedia 
      });
      
      socket.emit('create_room_success', {
        room,
        users: room.users,
        admin: room.admin
      });
      
      console.log(`Sala criada: ${roomId}`);
      console.log('Usuários na sala:', room.users);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      socket.emit('create_room_error', { message: 'Erro ao criar sala' });
    }
  });

  socket.on('join_room', (data) => {
    try {
      const { roomId, name, instrument, hasMedia } = data;
      console.log(`Usuário ${name} (${socket.id}) tentando entrar na sala ${roomId}`);
      
      // Verificar se a sala existe
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('join_room_error', { message: 'Sala não encontrada' });
        return;
      }
      
      // Verificar se o usuário já está em uma sala
      if (users.has(socket.id)) {
        socket.emit('join_room_error', { message: 'Você já está em uma sala' });
        return;
      }
      
      // Verificar se o usuário já está na sala
      if (room.users.some(u => u.id === socket.id)) {
        socket.emit('join_room_error', { message: 'Você já está nesta sala' });
        return;
      }
      
      // Adicionar usuário à sala
      const user = {
        id: socket.id,
        name,
        instrument,
        hasMedia,
        isAdmin: false
      };
      
      room.users.push(user);
      socket.join(roomId);
      users.set(socket.id, { name, instrument, roomId, hasMedia });
      
      // Notificar todos na sala
      socket.emit('join_room_success', { room });
      io.to(roomId).emit('user_joined', { user });
      io.to(roomId).emit('user_list', { users: room.users });
      
      console.log(`Usuário ${name} entrou na sala ${roomId}`);
      console.log('Usuários na sala:', room.users);
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      socket.emit('join_room_error', { message: 'Erro ao entrar na sala' });
    }
  });

  socket.on('leave_room', () => {
    try {
      cleanupUser(socket, socket.id);
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
      socket.emit('error', { message: 'Erro ao sair da sala' });
    }
  });

  socket.on('disconnect', () => {
    try {
      console.log('Cliente desconectado:', socket.id);
      cleanupUser(socket, socket.id);
    } catch (error) {
      console.error('Erro ao desconectar usuário:', error);
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

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
