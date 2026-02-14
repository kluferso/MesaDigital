require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const http = require('http').createServer(app);

// Configuração do Multer para uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Manter a extensão original e adicionar timestamp para evitar colisões
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!'), false);
    }
  }
});

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Importar handlers de sinalização WebRTC
const handleWebRTCSignaling = require('./webrtc/signaling');
const persistence = require('./controllers/persistence');

// API Routes
app.get('/api/events', persistence.getEvents);
app.post('/api/events', persistence.createEvent);
app.delete('/api/events/:id', persistence.deleteEvent);

app.get('/api/setlists', persistence.getSetlists);
app.post('/api/setlists', persistence.saveSetlist);
app.delete('/api/setlists/:id', persistence.deleteSetlist);

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    url: fileUrl, 
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Armazena as salas e seus participantes
const rooms = new Map();

// Gerencia conexões Socket.IO
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // Aplicar handlers de sinalização WebRTC
  handleWebRTCSignaling(io, socket, rooms);

  // Quando um cliente cria uma sala
  socket.on('create_room', async (data, callback) => {
    try {
      const { name, instrument, noMedia } = data;

      console.log(`Tentando criar sala por ${name} (${instrument})`);

      // Valida os dados
      if (!name || !instrument) {
        if (callback) callback({ error: 'Nome e instrumento são obrigatórios' });
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

      // Notifica o cliente via callback
      if (callback) {
        callback({
          room: {
            id: roomId,
            userId: socket.id,
            users: Array.from(room.users.values())
          }
        });
      }

    } catch (error) {
      console.error('Erro ao criar sala:', error);
      if (callback) callback({ error: 'Erro ao criar sala' });
    }
  });

  // Quando um cliente tenta entrar em uma sala
  socket.on('join_room', async (data, callback) => {
    try {
      const { roomId, name, instrument, hasMedia } = data;

      console.log(`Tentando entrar na sala ${roomId} como ${name} (${instrument})`);
      console.log('Socket atual:', socket.id);
      console.log('Socket roomId:', socket.roomId);

      // Valida os dados
      if (!roomId || !name || !instrument) {
        if (callback) callback({ error: 'ID da sala, nome e instrumento são obrigatórios' });
        return;
      }

      // Verifica se a sala existe
      const room = rooms.get(roomId);
      if (!room) {
        console.log(`Sala ${roomId} não existe`);
        if (callback) callback({ error: 'Esta sala não existe' });
        return;
      }

      // Se o usuário já está nesta sala específica, não precisa entrar novamente
      if (socket.roomId === roomId) {
        console.log(`${name} já está na sala ${roomId}`);
        if (callback) {
          callback({
            room: {
              id: roomId,
              userId: socket.id,
              users: Array.from(room.users.values())
            }
          });
        }
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
      
      // Envia lista atualizada para compatibilidade com Android e outros clientes
      io.to(roomId).emit('room_users', {
        users: Array.from(room.users.values())
      });

      // Envia dados da sala para o novo usuário via callback
      if (callback) {
        callback({
          room: {
            id: roomId,
            userId: socket.id,
            users: Array.from(room.users.values())
          }
        });
      }

    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      if (callback) callback({ error: 'Erro ao entrar na sala' });
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

  // Compartilhamento de Arquivos (Partituras)
  socket.on('share_file', (data) => {
    const { roomId, url, filename, type } = data;
    if (!roomId) return;

    // Recupera informações do usuário
    const room = rooms.get(roomId);
    const user = room ? room.users.get(socket.id) : null;
    const userName = user ? user.name : 'Usuário';

    io.to(roomId).emit('file_shared', {
      url,
      filename,
      type: type || 'pdf',
      sharedBy: socket.id,
      sharedByName: userName,
      timestamp: new Date()
    });
    
    // Opcional: Adicionar mensagem no chat avisando do arquivo
    const systemMessage = {
      id: `sys_${Date.now()}`,
      type: 'system',
      text: `${userName} compartilhou uma partitura: ${filename}`,
      timestamp: new Date()
    };
    io.to(roomId).emit('chat_message', systemMessage);
  });

  // ----- Stage & Metronome Events (Ported from Flask) -----

  // Atualizar posição espacial (pan) do usuário no palco
  socket.on('update_user_position', (data) => {
    const { roomId, position } = data;
    
    if (!roomId) {
      return;
    }
    
    // Broadcast para todos na sala
    io.to(roomId).emit('user_position_updated', {
      userId: socket.id,
      position: position
    });
  });

  // Toggle Audio
  socket.on('toggle_audio', (data) => {
    const { roomId, enabled } = data;
    if (!roomId) return;
    io.to(roomId).emit('user_audio_toggled', {
      userId: socket.id,
      enabled
    });
  });

  // Toggle Video
  socket.on('toggle_video', (data) => {
    const { roomId, enabled } = data;
    if (!roomId) return;
    io.to(roomId).emit('user_video_toggled', {
      userId: socket.id,
      enabled
    });
  });

  // Sincronização de tempo para o metrônomo (NTP-like)
  socket.on('time_sync', (data, callback) => {
    // Retorna o timestamp atual do servidor para calcular offset
    if (callback) {
      callback(Date.now());
    }
  });

  // Iniciar metrônomo para todos na sala
  socket.on('metronome_start', (data) => {
    const { roomId, tempo, startTime } = data;
    
    if (!roomId) return;
        
    io.to(roomId).emit('metronome_started', {
      tempo: tempo || 120,
      startTime: startTime,
      startedBy: socket.id
    });
  });

  // Parar metrônomo
  socket.on('metronome_stop', (data) => {
    const { roomId } = data;
    if (!roomId) return;
        
    io.to(roomId).emit('metronome_stopped', {});
  });

  // Alterar BPM
  socket.on('metronome_tempo_change', (data) => {
    const { roomId, tempo } = data;
    if (!roomId) return;
        
    io.to(roomId).emit('metronome_tempo_changed', { tempo });
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

  // Lista todas as salas ativas
  socket.on('list_rooms', (callback) => {
    try {
      const activeRooms = Array.from(rooms.values()).map(room => ({
        id: room.id,
        usersCount: room.users.size,
        createdAt: room.createdAt,
        // Pegar o nome do admin ou o primeiro usuário como "dono" para exibição
        owner: Array.from(room.users.values()).find(u => u.isAdmin)?.name || 'Desconhecido'
      }));

      if (callback) {
        callback({ rooms: activeRooms });
      } else {
        socket.emit('rooms_list', activeRooms);
      }
    } catch (error) {
      console.error('Erro ao listar salas:', error);
      if (callback) callback({ error: 'Erro ao listar salas' });
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
