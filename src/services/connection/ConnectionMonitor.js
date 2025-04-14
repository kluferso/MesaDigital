/**
 * ConnectionMonitor.js
 * Serviço para monitorar a qualidade e estado de conexões WebRTC em tempo real
 */

class ConnectionMonitor {
  constructor(webRTCManager, socket) {
    this.webRTCManager = webRTCManager;
    this.socket = socket;
    this.callbacks = {};
    this.reconnectAttempts = {};
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000; // ms
    this.userQualities = new Map();
    this.pingInterval = null;
    this.pingDelay = 3000; // ms
    this.disconnectedUsers = new Set();
    this.lastPingTime = {};
    this.pingTimeouts = new Map();
    
    // Estados de conexão para os usuários
    this.connectionStates = {
      // userId: { state: 'connected' | 'reconnecting' | 'disconnected', lastUpdate: timestamp }
    };
  }
  
  /**
   * Inicializa o monitor de conexão
   */
  initialize() {
    if (this.initialized) {
      return;
    }
    
    console.log('Inicializando ConnectionMonitor...');
    
    // Configurar ping para medir latência
    this.startPingInterval();
    
    // Registrar callbacks para eventos de conexão
    this._setupConnectionCallbacks();
    
    this.initialized = true;
    this.triggerCallback('onInitialized');
  }
  
  /**
   * Configura callbacks para eventos de conexão
   * @private
   */
  _setupConnectionCallbacks() {
    // Monitorar mudanças de estado de conexão do WebRTC
    if (this.webRTCManager) {
      this.webRTCManager.on('onConnectionStateChange', ({ userId, state }) => {
        this._handleConnectionStateChange(userId, state);
      });
      
      this.webRTCManager.on('onIceConnectionStateChange', ({ userId, state }) => {
        this._handleIceConnectionStateChange(userId, state);
      });
      
      this.webRTCManager.on('onQualityChange', ({ userId, score, category }) => {
        this._updateUserQuality(userId, score, category);
      });
    }
    
    // Monitorar eventos do socket
    if (this.socket) {
      this.socket.on('disconnect', () => {
        console.log('Socket desconectado, iniciando reconexão automática...');
        this._handleSocketDisconnect();
      });
      
      this.socket.on('connect', () => {
        console.log('Socket reconectado, restaurando conexões...');
        this._handleSocketReconnect();
      });
      
      // Ping-pong para verificar conectividade com outros clientes
      this.socket.on('ping_request', (data) => {
        this.socket.emit('ping_response', {
          from: this.socket.id,
          to: data.from,
          timestamp: data.timestamp,
          roomId: data.roomId
        });
      });
      
      this.socket.on('ping_response', (data) => {
        if (data.to === this.socket.id) {
          const now = Date.now();
          const latency = now - data.timestamp;
          this._updateUserLatency(data.from, latency);
        }
      });
      
      // Pedido de reconexão
      this.socket.on('request_reconnect', (data) => {
        const { userId, roomId } = data;
        console.log(`Recebido pedido de reconexão do usuário ${userId} na sala ${roomId}`);
        this._handleReconnectRequest(userId, roomId);
      });
    }
  }
  
  /**
   * Inicia o intervalo de ping para verificar latência
   * @private
   */
  startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected && this.webRTCManager && this.webRTCManager.roomId) {
        this._sendPingToAllUsers();
        this._checkConnectionTimeouts();
      }
    }, this.pingDelay);
  }
  
  /**
   * Envia ping para todos os usuários na sala
   * @private
   */
  _sendPingToAllUsers() {
    if (!this.socket || !this.webRTCManager) return;
    
    const connectedUsers = Array.from(this.webRTCManager.connections.keys());
    
    connectedUsers.forEach(userId => {
      this.lastPingTime[userId] = Date.now();
      
      this.socket.emit('ping_request', {
        from: this.socket.id,
        to: userId,
        timestamp: Date.now(),
        roomId: this.webRTCManager.roomId
      });
      
      // Configurar timeout para este ping
      const timeoutId = setTimeout(() => {
        // Se não recebemos resposta em 5 segundos, considerar perda de conectividade
        this._handlePingTimeout(userId);
      }, 5000);
      
      this.pingTimeouts.set(userId, timeoutId);
    });
  }
  
  /**
   * Verifica se há timeouts de conexão
   * @private
   */
  _checkConnectionTimeouts() {
    const now = Date.now();
    
    // Verificar cada usuário conectado
    Object.keys(this.connectionStates).forEach(userId => {
      const state = this.connectionStates[userId];
      
      // Se o último ping foi há mais de 10 segundos, considerar desconectado
      if (state.state === 'connected' && this.lastPingTime[userId]) {
        const lastPingTime = this.lastPingTime[userId];
        if (now - lastPingTime > 10000) {
          this._setUserConnectionState(userId, 'disconnected');
        }
      }
    });
  }
  
  /**
   * Manipula timeout de ping
   * @private
   */
  _handlePingTimeout(userId) {
    console.log(`Timeout de ping para o usuário ${userId}`);
    
    // Limpar o timeout atual
    this.pingTimeouts.delete(userId);
    
    // Atualizar estado de conexão
    const currentState = this.connectionStates[userId]?.state || 'disconnected';
    
    if (currentState === 'connected') {
      this._setUserConnectionState(userId, 'reconnecting');
      this._initiateReconnect(userId);
    }
  }
  
  /**
   * Atualiza a latência de um usuário
   * @private
   */
  _updateUserLatency(userId, latency) {
    // Limpar qualquer timeout para este usuário
    if (this.pingTimeouts.has(userId)) {
      clearTimeout(this.pingTimeouts.get(userId));
      this.pingTimeouts.delete(userId);
    }
    
    // Mapear latência para uma pontuação de qualidade (0-1)
    let qualityScore;
    
    if (latency < 100) {
      qualityScore = 1.0;  // Excelente: <100ms
    } else if (latency < 200) {
      qualityScore = 0.8;  // Muito boa: 100-200ms
    } else if (latency < 300) {
      qualityScore = 0.6;  // Boa: 200-300ms
    } else if (latency < 500) {
      qualityScore = 0.4;  // Moderada: 300-500ms
    } else if (latency < 1000) {
      qualityScore = 0.2;  // Fraca: 500-1000ms
    } else {
      qualityScore = 0.1;  // Muito fraca: >1000ms
    }
    
    // Atualizar a qualidade de conexão
    this._updateUserQuality(userId, qualityScore, {
      latency,
      category: this._getQualityCategory(qualityScore)
    });
    
    // Marcar o usuário como conectado
    this._setUserConnectionState(userId, 'connected');
  }
  
  /**
   * Manipula mudança no estado de conexão WebRTC
   * @private
   */
  _handleConnectionStateChange(userId, state) {
    console.log(`Estado de conexão alterado para ${userId}: ${state}`);
    
    if (state === 'connected' || state === 'completed') {
      this._setUserConnectionState(userId, 'connected');
      this.disconnectedUsers.delete(userId);
    } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      this._setUserConnectionState(userId, 'disconnected');
      this.disconnectedUsers.add(userId);
      this._initiateReconnect(userId);
    } else if (state === 'connecting' || state === 'checking') {
      this._setUserConnectionState(userId, 'reconnecting');
    }
  }
  
  /**
   * Manipula mudança no estado de conexão ICE
   * @private
   */
  _handleIceConnectionStateChange(userId, state) {
    console.log(`Estado de conexão ICE alterado para ${userId}: ${state}`);
    
    if (state === 'disconnected' || state === 'failed') {
      this._initiateReconnect(userId);
    }
  }
  
  /**
   * Atualiza a qualidade de conexão de um usuário
   * @private
   */
  _updateUserQuality(userId, score, additionalData = {}) {
    // Salvar a qualidade atualizada
    this.userQualities.set(userId, {
      score,
      timestamp: Date.now(),
      ...additionalData
    });
    
    // Disparar evento de mudança de qualidade
    this.triggerCallback('onQualityChange', {
      userId,
      score,
      ...additionalData
    });
  }
  
  /**
   * Manipula desconexão do socket
   * @private
   */
  _handleSocketDisconnect() {
    // Marcar todos os usuários como reconectando
    const allUsers = Array.from(this.webRTCManager?.connections?.keys() || []);
    
    allUsers.forEach(userId => {
      this._setUserConnectionState(userId, 'reconnecting');
    });
    
    // Disparar evento
    this.triggerCallback('onSocketDisconnect');
  }
  
  /**
   * Manipula reconexão do socket
   * @private
   */
  _handleSocketReconnect() {
    // Tentar restabelecer conexões
    const disconnectedUsers = Array.from(this.disconnectedUsers);
    
    disconnectedUsers.forEach(userId => {
      this._initiateReconnect(userId);
    });
    
    // Disparar evento
    this.triggerCallback('onSocketReconnect');
  }
  
  /**
   * Manipula pedido de reconexão
   * @private
   */
  _handleReconnectRequest(userId, roomId) {
    if (this.webRTCManager && this.webRTCManager.roomId === roomId) {
      console.log(`Reconectando com usuário ${userId}`);
      
      // Fecha a conexão existente, se houver
      if (this.webRTCManager.connections.has(userId)) {
        this.webRTCManager.closePeerConnection(userId);
      }
      
      // Cria uma nova conexão
      this.webRTCManager.createPeerConnection(userId, true);
      
      // Atualiza o estado
      this._setUserConnectionState(userId, 'reconnecting');
    }
  }
  
  /**
   * Inicia processo de reconexão com um usuário
   * @private
   */
  _initiateReconnect(userId) {
    // Verificar se já está reconectando
    if (this.reconnectAttempts[userId]) {
      return;
    }
    
    // Iniciar contador de tentativas
    this.reconnectAttempts[userId] = 1;
    
    const attemptReconnect = () => {
      // Verificar se atingiu o máximo de tentativas
      if (this.reconnectAttempts[userId] > this.maxReconnectAttempts) {
        console.log(`Máximo de tentativas alcançado para ${userId}`);
        delete this.reconnectAttempts[userId];
        this._setUserConnectionState(userId, 'disconnected');
        return;
      }
      
      console.log(`Tentativa de reconexão ${this.reconnectAttempts[userId]} para ${userId}`);
      
      // Envia pedido de reconexão via sinalização
      if (this.socket && this.socket.connected) {
        this.socket.emit('request_reconnect', {
          userId,
          roomId: this.webRTCManager?.roomId
        });
      }
      
      // Tenta recriar a conexão peer diretamente
      if (this.webRTCManager) {
        // Fechar conexão existente
        if (this.webRTCManager.connections.has(userId)) {
          this.webRTCManager.closePeerConnection(userId);
        }
        
        // Criar nova conexão
        setTimeout(() => {
          this.webRTCManager.createPeerConnection(userId, true);
        }, 500);
      }
      
      // Incrementar contador de tentativas
      this.reconnectAttempts[userId]++;
      
      // Agendar próxima tentativa com backoff exponencial
      const nextDelay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts[userId] - 1);
      setTimeout(attemptReconnect, nextDelay);
    };
    
    // Iniciar primeira tentativa
    attemptReconnect();
  }
  
  /**
   * Define o estado de conexão de um usuário
   * @private
   */
  _setUserConnectionState(userId, state) {
    // Atualizar estado
    this.connectionStates[userId] = {
      state,
      lastUpdate: Date.now()
    };
    
    // Disparar evento
    this.triggerCallback('onConnectionStateChange', {
      userId,
      state,
      timestamp: Date.now()
    });
  }
  
  /**
   * Converte pontuação de qualidade para categoria
   * @private
   */
  _getQualityCategory(score) {
    if (score >= 0.8) return 'excelente';
    if (score >= 0.6) return 'boa';
    if (score >= 0.4) return 'moderada';
    if (score >= 0.2) return 'fraca';
    return 'muito fraca';
  }
  
  /**
   * Obtém qualidade de conexão para um usuário
   */
  getConnectionQuality(userId) {
    return this.userQualities.get(userId) || { score: 0, category: 'desconhecida' };
  }
  
  /**
   * Obtém estado de conexão para um usuário
   */
  getConnectionState(userId) {
    return this.connectionStates[userId] || { state: 'unknown', lastUpdate: 0 };
  }
  
  /**
   * Registra um callback para um evento específico
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    
    this.callbacks[event].push(callback);
  }
  
  /**
   * Remove um callback de um evento específico
   */
  off(event, callback) {
    if (!this.callbacks[event]) return;
    
    this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
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

export default ConnectionMonitor;
