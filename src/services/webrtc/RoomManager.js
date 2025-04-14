/**
 * RoomManager.js
 * Gerencia salas e integração entre Socket.io e WebRTC
 */

import WebRTCManager from './WebRTCManager';
import AudioProcessor from './AudioProcessor';
import QualityMonitor from './QualityMonitor';

class RoomManager {
  constructor(socket) {
    this.socket = socket;
    this.webRTC = new WebRTCManager();
    this.audioProcessor = null;
    this.qualityMonitor = new QualityMonitor();
    this.roomId = null;
    this.users = new Map();
    this.localUser = null;
    this.callbacks = {};
    this.initialized = false;
    
    // Inicializar AudioProcessor quando o WebRTC estiver pronto
    this.webRTC.on('onInitialized', () => {
      if (this.webRTC.audioContext) {
        this.audioProcessor = new AudioProcessor(this.webRTC.audioContext);
        this.webRTC.setAudioProcessor(this.audioProcessor);
        this.webRTC.setQualityMonitor(this.qualityMonitor);
        
        // Configurar callbacks entre componentes
        this._setupComponentCallbacks();
      }
    });
  }

  /**
   * Configura callbacks entre os componentes
   * @private
   */
  _setupComponentCallbacks() {
    // Adaptação da qualidade
    this.qualityMonitor.on('onQualityChange', ({ userId, score }) => {
      if (this.audioProcessor) {
        this.audioProcessor.adjustBufferSize(userId, score);
      }
      
      this.triggerCallback('onQualityChange', { userId, score });
    });
    
    // Análise de áudio
    if (this.audioProcessor) {
      this.audioProcessor.on('onAudioAnalysis', (data) => {
        this.triggerCallback('onAudioAnalysis', data);
      });
      
      this.audioProcessor.on('onSpectrumAnalysis', (data) => {
        this.triggerCallback('onSpectrumAnalysis', data);
      });
    }
    
    // Eventos WebRTC
    this.webRTC.on('onTrack', ({ userId, streams }) => {
      this.triggerCallback('onUserMediaReceived', { userId, streams });
    });
    
    this.webRTC.on('onIceCandidate', ({ userId, candidate }) => {
      this._sendSignal(userId, candidate, 'candidate');
    });
    
    this.webRTC.on('onOfferCreated', ({ userId, offer }) => {
      this._sendSignal(userId, offer, 'offer');
    });
    
    this.webRTC.on('onAnswerCreated', ({ userId, answer }) => {
      this._sendSignal(userId, answer, 'answer');
    });
    
    this.webRTC.on('onConnectionStateChange', ({ userId, state }) => {
      this.triggerCallback('onConnectionStateChange', { userId, state });
    });
    
    this.webRTC.on('onError', (error) => {
      this.triggerCallback('onError', error);
    });
  }

  /**
   * Envia um sinal WebRTC via Socket.io
   * @private
   */
  _sendSignal(to, signal, type) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket não está conectado');
      return;
    }
    
    console.log(`Enviando sinal ${type} para ${to}`);
    
    this.socket.emit('webrtc_signal', {
      to,
      signal,
      type,
      from: this.socket.id,
      roomId: this.roomId
    });
  }

  /**
   * Inicializa o RoomManager
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }
    
    console.log('Inicializando RoomManager...');
    
    if (!this.socket) {
      console.error('Socket não definido');
      throw new Error('Socket não definido');
    }
    
    try {
      // Inicializar WebRTC
      await this.webRTC.initialize();
      
      // Configurar handlers para sinais WebRTC
      this._setupSignalingHandlers();
      
      this.initialized = true;
      this.triggerCallback('onInitialized');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar RoomManager:', error);
      this.triggerCallback('onError', { 
        type: 'initialization_error', 
        message: error.message,
        error
      });
      throw error;
    }
  }

  /**
   * Configura handlers para sinais WebRTC
   * @private
   */
  _setupSignalingHandlers() {
    // Remover handlers existentes
    this.socket.off('webrtc_signal');
    
    // Adicionar novos handlers
    this.socket.on('webrtc_signal', async (data) => {
      const { from, signal, type } = data;
      
      console.log(`Sinal ${type} recebido de ${from}`);
      
      try {
        if (type === 'offer') {
          await this.webRTC.processOffer(from, signal);
        } else if (type === 'answer') {
          await this.webRTC.processAnswer(from, signal);
        } else if (type === 'candidate') {
          await this.webRTC.addIceCandidate(from, signal);
        }
      } catch (error) {
        console.error(`Erro ao processar sinal ${type} de ${from}:`, error);
        this.triggerCallback('onError', { 
          type: 'signaling_error', 
          message: error.message,
          error
        });
      }
    });
  }

  /**
   * Configura handlers para eventos de sala
   * @private
   */
  _setupRoomEventHandlers() {
    // Quando um usuário entra na sala
    this.socket.on('user_joined', (data) => {
      const { user } = data;
      
      console.log(`Usuário entrou na sala: ${user.name} (${user.id})`);
      
      // Adicionar à lista de usuários
      this.users.set(user.id, user);
      
      // Se não somos nós mesmos, iniciar conexão WebRTC
      if (user.id !== this.socket.id) {
        console.log(`Iniciando conexão WebRTC com ${user.name} (${user.id})`);
        this.webRTC.createPeerConnection(user.id, true);
      }
      
      this.triggerCallback('onUserJoined', { user });
    });
    
    // Quando um usuário sai da sala
    this.socket.on('user_left', (data) => {
      const { userId, userName } = data;
      
      console.log(`Usuário saiu da sala: ${userName} (${userId})`);
      
      // Fechar conexão WebRTC
      if (this.webRTC.connections.has(userId)) {
        this.webRTC.closePeerConnection(userId);
      }
      
      // Remover da lista de usuários
      this.users.delete(userId);
      
      this.triggerCallback('onUserLeft', { userId, userName });
    });
    
    // Quando alguém envia uma mensagem no chat
    this.socket.on('chat_message', (message) => {
      this.triggerCallback('onChatMessage', message);
    });
  }

  /**
   * Cria uma nova sala e entra nela
   * @param {string} name - Nome do usuário
   * @param {string} instrument - Instrumento do usuário
   */
  async createRoom(name, instrument) {
    await this.initialize();
    
    if (!this.socket || !this.socket.connected) {
      throw new Error('Socket não está conectado');
    }
    
    return new Promise((resolve, reject) => {
      console.log(`Criando sala como ${name} (${instrument})`);
      
      this.socket.emit('create_room', { 
        name, 
        instrument,
        hasWebRTC: true, // Indicar suporte a WebRTC
        audioOnly: true
      }, (response) => {
        if (response.error) {
          console.error('Erro ao criar sala:', response.error);
          reject(new Error(response.error));
          return;
        }
        
        console.log('Sala criada:', response.room);
        
        this.roomId = response.room.id;
        this.localUser = {
          id: this.socket.id,
          name,
          instrument,
          isAdmin: true
        };
        
        this.users.clear();
        
        // Adicionar usuário local
        this.users.set(this.socket.id, this.localUser);
        
        // Configurar handlers de eventos da sala
        this._setupRoomEventHandlers();
        
        this.triggerCallback('onRoomCreated', { 
          roomId: this.roomId, 
          userId: this.socket.id 
        });
        
        resolve(response.room);
      });
    });
  }

  /**
   * Entra em uma sala existente
   * @param {string} roomId - ID da sala
   * @param {string} name - Nome do usuário
   * @param {string} instrument - Instrumento do usuário
   */
  async joinRoom(roomId, name, instrument) {
    try {
      await this.initialize();
    } catch (error) {
      console.error('Erro na inicialização do RoomManager, tentando continuar:', error);
      // Continuar mesmo com erro de inicialização
    }
    
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket não está conectado, tentando modo de emergência');
      // Tentativa de usar modo de emergência local
      if (!this.localUser) {
        this.localUser = {
          id: 'local-' + Date.now(),
          name,
          instrument,
          isAdmin: false,
          emergencyMode: true
        };
      }
      
      this.roomId = roomId;
      
      // Salvar no localStorage para recuperar depois
      try {
        localStorage.setItem('emergency_room', JSON.stringify({
          roomId,
          user: this.localUser
        }));
      } catch (e) {
        console.warn('Não foi possível salvar dados de emergência:', e);
      }
      
      this.triggerCallback('onRoomJoined', { 
        roomId: this.roomId, 
        userId: this.localUser.id,
        emergencyMode: true
      });
      
      return { 
        id: roomId,
        emergencyMode: true,
        users: [this.localUser]
      };
    }
    
    return new Promise((resolve, reject) => {
      console.log(`Entrando na sala ${roomId} como ${name} (${instrument})`);
      
      // Configurar um timeout de segurança
      const timeoutId = setTimeout(() => {
        console.warn('Timeout ao tentar entrar na sala, tentando modo de emergência');
        
        // Entrar em modo de emergência
        this.roomId = roomId;
        this.localUser = {
          id: this.socket.id || ('local-' + Date.now()),
          name,
          instrument,
          isAdmin: false,
          emergencyMode: true
        };
        
        // Salvar no localStorage para recuperação de emergência
        try {
          localStorage.setItem('emergency_room', JSON.stringify({
            roomId,
            user: this.localUser
          }));
        } catch (e) {
          console.warn('Não foi possível salvar dados de emergência:', e);
        }
        
        this.triggerCallback('onRoomJoined', { 
          roomId: this.roomId, 
          userId: this.localUser.id,
          emergencyMode: true
        });
        
        resolve({ 
          id: roomId,
          emergencyMode: true,
          users: [this.localUser]
        });
      }, 10000); // 10 segundos de timeout
      
      // Verificar se já temos dados de emergência para esta sala
      let emergencyData = null;
      try {
        const savedData = localStorage.getItem('emergency_room');
        if (savedData) {
          emergencyData = JSON.parse(savedData);
          if (emergencyData.roomId !== roomId) {
            emergencyData = null; // Ignorar se for para outra sala
          }
        }
      } catch (e) {
        console.warn('Erro ao ler dados de emergência:', e);
      }
      
      this.socket.emit('join_room', { 
        roomId, 
        name, 
        instrument,
        hasWebRTC: true, // Indicar suporte a WebRTC
        audioOnly: true,
        emergencyMode: emergencyData ? true : false
      }, (response) => {
        clearTimeout(timeoutId); // Cancelar o timeout
        
        if (response.error) {
          console.error('Erro ao entrar na sala:', response.error);
          
          // Se houver erro, mas tivermos dados de emergência, usar esses dados
          if (emergencyData) {
            console.log('Usando dados de emergência para entrar na sala');
            
            this.roomId = roomId;
            this.localUser = emergencyData.user;
            
            this.triggerCallback('onRoomJoined', { 
              roomId: this.roomId, 
              userId: this.localUser.id,
              emergencyMode: true
            });
            
            resolve({ 
              id: roomId,
              emergencyMode: true,
              users: [this.localUser]
            });
          } else {
            reject(new Error(response.error));
          }
          return;
        }
        
        console.log('Entrou na sala:', response.room);
        
        this.roomId = response.room.id;
        this.localUser = {
          id: this.socket.id,
          name,
          instrument,
          isAdmin: response.room.isAdmin || false
        };
        
        this.users.clear();
        
        // Adicionar todos os usuários
        response.room.users.forEach(user => {
          this.users.set(user.id, user);
          
          // Iniciar conexão WebRTC com todos, exceto nós mesmos
          if (user.id !== this.socket.id) {
            console.log(`Iniciando conexão WebRTC com ${user.name} (${user.id})`);
            try {
              this.webRTC.createPeerConnection(user.id, true);
            } catch (e) {
              console.error(`Erro ao criar conexão com ${user.id}:`, e);
              // Continuar mesmo com erro de conexão
            }
          }
        });
        
        // Configurar handlers de eventos da sala
        this._setupRoomEventHandlers();
        
        // Salvar no localStorage para recuperação de emergência
        try {
          localStorage.setItem('emergency_room', JSON.stringify({
            roomId,
            user: this.localUser
          }));
        } catch (e) {
          console.warn('Não foi possível salvar dados de emergência:', e);
        }
        
        this.triggerCallback('onRoomJoined', { 
          roomId: this.roomId, 
          userId: this.socket.id 
        });
        
        resolve(response.room);
      });
    });
  }

  /**
   * Sai da sala atual
   */
  leaveRoom() {
    if (!this.roomId) {
      console.log('Não está em nenhuma sala');
      return;
    }
    
    console.log(`Saindo da sala ${this.roomId}`);
    
    // Fechar todas as conexões WebRTC
    this.webRTC.closeAllConnections();
    
    // Notificar o servidor
    this.socket.emit('leave_room', { roomId: this.roomId });
    
    // Limpar estado
    this.roomId = null;
    this.localUser = null;
    this.users.clear();
    
    // Remover handlers de eventos da sala
    this.socket.off('user_joined');
    this.socket.off('user_left');
    this.socket.off('chat_message');
    
    this.triggerCallback('onRoomLeft');
  }

  /**
   * Envia uma mensagem de chat para a sala
   * @param {Object} message - Mensagem a ser enviada
   */
  sendChatMessage(message) {
    if (!this.roomId) {
      console.error('Não está em nenhuma sala');
      return false;
    }
    
    this.socket.emit('send_message', {
      roomId: this.roomId,
      ...message
    });
    
    return true;
  }

  /**
   * Ativa/desativa o áudio local
   * @param {boolean} enabled - True para ativar, false para desativar
   */
  toggleAudio(enabled) {
    return this.webRTC.toggleLocalAudio(enabled);
  }

  /**
   * Ajusta o volume de um usuário específico
   * @param {string} userId - ID do usuário
   * @param {number} volume - Volume (0-1)
   */
  setUserVolume(userId, volume) {
    if (!this.audioProcessor) {
      console.error('AudioProcessor não inicializado');
      return false;
    }
    
    return this.audioProcessor.setVolume(userId, volume);
  }

  /**
   * Ajusta o volume mestre
   * @param {number} volume - Volume (0-1)
   */
  setMasterVolume(volume) {
    if (!this.audioProcessor) {
      console.error('AudioProcessor não inicializado');
      return false;
    }
    
    return this.audioProcessor.setMasterVolume(volume);
  }

  /**
   * Obtém informações de qualidade de conexão para um usuário
   * @param {string} userId - ID do usuário
   */
  getConnectionQuality(userId) {
    return this.qualityMonitor.getQuality(userId);
  }

  /**
   * Registra um callback para um evento específico
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    
    this.callbacks[event].push(callback);
    return () => this.off(event, callback);
  }

  /**
   * Remove um callback de um evento específico
   */
  off(event, callback) {
    if (!this.callbacks[event]) return;
    
    const index = this.callbacks[event].indexOf(callback);
    if (index !== -1) {
      this.callbacks[event].splice(index, 1);
    }
  }

  /**
   * Dispara callbacks para um evento específico
   */
  triggerCallback(event, data) {
    if (!this.callbacks[event]) return;
    
    for (const callback of this.callbacks[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erro ao executar callback para evento ${event}:`, error);
      }
    }
  }
}

export default RoomManager;
