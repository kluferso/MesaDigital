/**
 * WebRTCManager.js
 * Gerencia conexões WebRTC peer-to-peer para áudio com baixa latência
 */

class WebRTCManager {
  constructor(options = {}) {
    this.connections = new Map();
    this.localStream = null;
    this.audioContext = this._createAudioContext();
    this.audioProcessor = null;
    this.qualityMonitor = null;
    this.mediaOptions = {
      audio: {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true }
      },
      video: false
    };
    this.callbacks = {};
    this.iceCandidateQueue = new Map();
    this.initialized = false;
    this.connectionStates = new Map(); // Armazenar estados de conexão por usuário
    this.connectionQuality = new Map(); // Armazenar qualidade de conexão por usuário
    this.statsInterval = null; // Intervalo para coleta de estatísticas
    this._reconnectionTimers = {}; // Timers para tentativas de reconexão
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Para produção, adicionar servidores TURN dedicados
        // { 
        //   urls: 'turn:turn.mesadigital.com:3478',
        //   username: 'username',
        //   credential: 'credential'
        // }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 10
    };

    // Mesclar opções personalizadas
    if (options.iceServers) {
      this.config.iceServers = options.iceServers;
    }
  }

  /**
   * Cria o contexto de áudio com configurações otimizadas
   * @private
   */
  _createAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.error('Web Audio API não suportada neste navegador');
      return null;
    }
    
    return new AudioContext({
      latencyHint: 'interactive',
      sampleRate: 48000
    });
  }

  /**
   * Cria um stream de áudio simulado quando nenhum microfone está disponível
   * @private
   */
  _createEmptyAudioStream() {
    if (!this.audioContext) {
      this.audioContext = this._createAudioContext();
    }
    
    if (!this.audioContext) {
      throw new Error('AudioContext não suportado neste navegador');
    }

    // Criar um oscilador silencioso como fonte de áudio
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(0, this.audioContext.currentTime); // 0Hz = silêncio
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.0001, this.audioContext.currentTime); // Quase silencioso
    
    oscillator.connect(gainNode);
    oscillator.start();
    
    // Criar MediaStream do nó de destino
    const destination = this.audioContext.createMediaStreamDestination();
    gainNode.connect(destination);
    
    console.log('Stream de áudio simulado criado com sucesso');
    return destination.stream;
  }

  /**
   * Inicializa o WebRTCManager obtendo o stream de áudio local
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Inicializando WebRTCManager...');

      // Tentar obter acesso ao microfone
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaOptions);
        console.log('Acesso ao microfone concedido:', this.localStream.id);
      } catch (micError) {
        console.warn('Não foi possível acessar o microfone:', micError);
        
        // Criar áudio simulado como fallback
        this.localStream = this._createEmptyAudioStream();
        console.log('Usando áudio simulado (modo somente audição)');
        
        // Disparar evento de aviso
        this.triggerCallback('onWarning', {
          type: 'microphone_unavailable',
          message: 'Usando áudio simulado (modo somente audição). Seu microfone não está disponível.'
        });
      }

      // Inicializar contexto de áudio se não estiver inicializado
      if (!this.audioContext) {
        this.audioContext = this._createAudioContext();
      }

      // Configurar processador de áudio
      this.audioProcessor = this._setupAudioProcessor(this.localStream);
      
      console.log('Stream local obtido:', this.localStream.id);
      
      // Iniciar monitoramento de estatísticas das conexões
      this._startConnectionQualityMonitoring();

      this.initialized = true;
      this.triggerCallback('onInitialized', { 
        success: true,
        stream: this.localStream
      });
    } catch (error) {
      console.error('Erro ao inicializar WebRTCManager:', error);
      
      // Mesmo com erro, tente prosseguir com stream simulado
      if (!this.localStream) {
        this.localStream = this._createEmptyAudioStream();
        console.log('Usando áudio simulado após erro de inicialização');
      }
      
      // Tentar inicializar mesmo com erro
      this.initialized = true;
      
      this.triggerCallback('onInitialized', { 
        success: false,
        error,
        stream: this.localStream
      });
    }
  }

  /**
   * Define o processador de áudio
   */
  setAudioProcessor(audioProcessor) {
    this.audioProcessor = audioProcessor;
  }

  /**
   * Define o monitor de qualidade
   */
  setQualityMonitor(qualityMonitor) {
    this.qualityMonitor = qualityMonitor;
  }

  /**
   * Cria uma conexão peer para um usuário específico
   */
  createPeerConnection(userId, isInitiator = false) {
    if (this.connections.has(userId)) {
      console.log(`Conexão com ${userId} já existe, reutilizando`);
      return this.connections.get(userId).pc;
    }

    console.log(`Criando nova conexão peer para ${userId} (iniciador: ${isInitiator})`);
    
    try {
      const pc = new RTCPeerConnection(this.config);
      
      // Adicionar tracks locais à conexão
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          console.log(`Adicionando track ${track.kind} à conexão com ${userId}`);
          pc.addTrack(track, this.localStream);
        });
      }

      // Configurar handlers de eventos
      pc.onicecandidate = event => {
        if (event.candidate) {
          console.log(`ICE candidate gerado para ${userId}`);
          this.triggerCallback('onIceCandidate', { 
            userId, 
            candidate: event.candidate 
          });
        } else {
          console.log(`Coleta de ICE candidatos completa para ${userId}`);
        }
      };

      pc.ontrack = event => {
        console.log(`Track ${event.track.kind} recebido de ${userId}`);
        
        // Processar o stream de áudio recebido
        if (this.audioProcessor && event.track.kind === 'audio') {
          this.audioProcessor.processStream(userId, event.streams[0]);
        }
        
        this.triggerCallback('onTrack', { 
          userId, 
          streams: event.streams,
          track: event.track
        });
      };

      pc.onconnectionstatechange = () => {
        console.log(`Estado da conexão com ${userId} alterado para: ${pc.connectionState}`);
        
        // Armazenar o estado atual
        this.connectionStates.set(userId, pc.connectionState);
        
        // Notificar sobre mudança de estado
        this.triggerCallback('onConnectionStateChange', { 
          userId, 
          state: pc.connectionState 
        });

        // Monitorar estados críticos
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          this.triggerCallback('onConnectionProblem', {
            userId,
            state: pc.connectionState
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`Estado da conexão ICE com ${userId} alterado para: ${pc.iceConnectionState}`);
        
        // Notificar sobre mudança de estado
        this.triggerCallback('onIceConnectionStateChange', { 
          userId, 
          state: pc.iceConnectionState 
        });

        // Aplicar candidatos ICE em fila quando o estado for correto
        if (pc.iceConnectionState === 'checking' && 
            this.iceCandidateQueue.has(userId) && 
            this.iceCandidateQueue.get(userId).length > 0) {
          this._applyQueuedIceCandidates(userId, pc);
        }
        
        // Tentar reconectar se estiver desconectado
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          this._scheduleReconnectionAttempt(userId);
        }
      };

      // Iniciar monitoramento de qualidade
      if (this.qualityMonitor) {
        this.qualityMonitor.startMonitoring(userId, pc);
      }

      // Armazenar a conexão
      this.connections.set(userId, { pc, isInitiator });

      // Se for o iniciador, criar oferta
      if (isInitiator) {
        this._createOffer(userId, pc);
      }

      return pc;
    } catch (error) {
      console.error(`Erro ao criar conexão peer para ${userId}:`, error);
      this.triggerCallback('onError', { 
        type: 'peer_connection_error', 
        userId, 
        message: error.message,
        error
      });
      throw error;
    }
  }

  /**
   * Cria uma oferta SDP e configura como descrição local
   * @private
   */
  async _createOffer(userId, pc) {
    try {
      console.log(`Criando oferta para ${userId}`);
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      await pc.setLocalDescription(offer);
      
      console.log(`Oferta criada e definida como descrição local para ${userId}`);
      
      this.triggerCallback('onOfferCreated', { 
        userId, 
        offer: pc.localDescription 
      });
    } catch (error) {
      console.error(`Erro ao criar oferta para ${userId}:`, error);
      this.triggerCallback('onError', { 
        type: 'offer_creation_error', 
        userId, 
        message: error.message,
        error
      });
    }
  }

  /**
   * Processa uma oferta SDP recebida de um peer
   */
  async processOffer(userId, offer) {
    console.log(`Processando oferta de ${userId}`);
    
    try {
      // Criar peer connection se não existir
      const pc = this.connections.has(userId) 
        ? this.connections.get(userId).pc 
        : this.createPeerConnection(userId, false);
      
      // Definir descrição remota
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log(`Descrição remota definida para ${userId}`);
      
      // Criar resposta
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(`Resposta criada e definida como descrição local para ${userId}`);
      
      this.triggerCallback('onAnswerCreated', { 
        userId, 
        answer: pc.localDescription 
      });
    } catch (error) {
      console.error(`Erro ao processar oferta de ${userId}:`, error);
      this.triggerCallback('onError', { 
        type: 'offer_processing_error', 
        userId, 
        message: error.message,
        error
      });
    }
  }

  /**
   * Processa uma resposta SDP recebida de um peer
   */
  async processAnswer(userId, answer) {
    console.log(`Processando resposta de ${userId}`);
    
    try {
      if (!this.connections.has(userId)) {
        throw new Error(`Nenhuma conexão existente para ${userId}`);
      }
      
      const pc = this.connections.get(userId).pc;
      
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`Descrição remota definida para ${userId}`);
      
      // Aplicar candidatos ICE em fila
      if (this.iceCandidateQueue.has(userId) && this.iceCandidateQueue.get(userId).length > 0) {
        this._applyQueuedIceCandidates(userId, pc);
      }
      
      this.triggerCallback('onAnswerProcessed', { userId });
    } catch (error) {
      console.error(`Erro ao processar resposta de ${userId}:`, error);
      this.triggerCallback('onError', { 
        type: 'answer_processing_error', 
        userId, 
        message: error.message,
        error
      });
    }
  }

  /**
   * Adiciona um candidato ICE à conexão peer
   */
  async addIceCandidate(userId, candidate) {
    try {
      if (!this.connections.has(userId)) {
        // Armazenar candidato na fila para aplicação posterior
        this._queueIceCandidate(userId, candidate);
        return;
      }
      
      const pc = this.connections.get(userId).pc;
      
      // Verificar se descrição remota está definida
      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`ICE candidato adicionado para ${userId}`);
      } else {
        // Armazenar candidato na fila para aplicação posterior
        this._queueIceCandidate(userId, candidate);
      }
    } catch (error) {
      console.error(`Erro ao adicionar candidato ICE para ${userId}:`, error);
      this.triggerCallback('onError', { 
        type: 'ice_candidate_error', 
        userId, 
        message: error.message,
        error
      });
    }
  }

  /**
   * Armazena um candidato ICE na fila para aplicação posterior
   * @private
   */
  _queueIceCandidate(userId, candidate) {
    if (!this.iceCandidateQueue.has(userId)) {
      this.iceCandidateQueue.set(userId, []);
    }
    
    console.log(`ICE candidato colocado na fila para ${userId}`);
    this.iceCandidateQueue.get(userId).push(candidate);
  }

  /**
   * Aplica candidatos ICE em fila a uma conexão peer
   * @private
   */
  async _applyQueuedIceCandidates(userId, pc) {
    if (!this.iceCandidateQueue.has(userId)) return;
    
    const candidates = this.iceCandidateQueue.get(userId);
    console.log(`Aplicando ${candidates.length} candidatos ICE em fila para ${userId}`);
    
    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error(`Erro ao aplicar candidato ICE para ${userId}:`, error);
      }
    }
    
    // Limpar fila
    this.iceCandidateQueue.set(userId, []);
  }

  /**
   * Fecha a conexão peer com um usuário específico
   */
  closePeerConnection(userId) {
    if (!this.connections.has(userId)) {
      console.log(`Nenhuma conexão encontrada para ${userId}`);
      return;
    }
    
    console.log(`Fechando conexão peer com ${userId}`);
    
    try {
      const { pc } = this.connections.get(userId);
      
      // Parar monitoramento de qualidade
      if (this.qualityMonitor) {
        this.qualityMonitor.stopMonitoring(userId);
      }
      
      // Remover processamento de áudio
      if (this.audioProcessor) {
        this.audioProcessor.removeStream(userId);
      }
      
      // Fechar conexão peer
      pc.close();
      
      // Remover da lista de conexões
      this.connections.delete(userId);
      
      // Limpar fila de candidatos ICE
      if (this.iceCandidateQueue.has(userId)) {
        this.iceCandidateQueue.delete(userId);
      }
      
      this.triggerCallback('onPeerConnectionClosed', { userId });
    } catch (error) {
      console.error(`Erro ao fechar conexão peer com ${userId}:`, error);
    }
  }

  /**
   * Fecha todas as conexões peer
   */
  closeAllConnections() {
    console.log('Fechando todas as conexões peer');
    
    for (const userId of this.connections.keys()) {
      this.closePeerConnection(userId);
    }
    
    // Parar stream local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Fechar contexto de áudio
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.initialized = false;
    this.triggerCallback('onAllConnectionsClosed');
  }

  /**
   * Ativa/desativa uma faixa de áudio local
   */
  toggleLocalAudio(enabled) {
    if (!this.localStream) {
      console.error('Stream local não disponível');
      return false;
    }
    
    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.error('Nenhuma faixa de áudio encontrada');
      return false;
    }
    
    console.log(`${enabled ? 'Ativando' : 'Desativando'} áudio local`);
    
    audioTracks.forEach(track => {
      track.enabled = enabled;
    });
    
    this.triggerCallback('onLocalAudioToggled', { enabled });
    return true;
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
   * @param {string} event - Nome do evento
   * @param {Object} data - Dados do evento
   */
  triggerCallback(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no callback para ${event}:`, error);
        }
      });
    }
    
    // Disparar eventos customizados para avisos e erros para integrar com os componentes React
    if (event === 'onWarning' || event === 'onError') {
      const eventName = event === 'onWarning' ? 'webrtc_warning' : 'webrtc_error';
      const customEvent = new CustomEvent(eventName, { detail: data });
      window.dispatchEvent(customEvent);
    }
  }

  /**
   * Inicia monitoramento de qualidade de conexão
   * @private
   */
  _startConnectionQualityMonitoring() {
    // Limpar intervalo existente, se houver
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    
    // Coletar estatísticas a cada 3 segundos
    this.statsInterval = setInterval(() => {
      this.connections.forEach((peer, userId) => {
        if (peer && peer.pc.getStats) {
          peer.pc.getStats().then(stats => {
            this._processConnectionStats(userId, stats);
          }).catch(error => {
            console.warn(`Erro ao coletar estatísticas para ${userId}:`, error);
          });
        }
      });
    }, 3000);
  }
  
  /**
   * Processa estatísticas da conexão para calcular qualidade
   * @param {string} userId - ID do usuário
   * @param {RTCStatsReport} stats - Relatório de estatísticas
   * @private
   */
  _processConnectionStats(userId, stats) {
    let totalPacketsLost = 0;
    let totalPacketsSent = 0;
    let totalPacketsReceived = 0;
    let audioLevel = 0;
    let jitter = 0;
    let roundTripTime = 0;
    let statsCounter = 0;
    
    // Processar estatísticas
    stats.forEach(stat => {
      // Coletar dados de pacotes perdidos (inbound)
      if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
        if (stat.packetsLost !== undefined) {
          totalPacketsLost += stat.packetsLost;
        }
        if (stat.packetsReceived !== undefined) {
          totalPacketsReceived += stat.packetsReceived;
        }
        if (stat.jitter !== undefined) {
          jitter = stat.jitter;
        }
        if (stat.audioLevel !== undefined) {
          audioLevel = stat.audioLevel;
        }
        statsCounter++;
      }
      
      // Coletar dados de pacotes enviados (outbound)
      if (stat.type === 'outbound-rtp' && stat.kind === 'audio') {
        if (stat.packetsSent !== undefined) {
          totalPacketsSent += stat.packetsSent;
        }
        statsCounter++;
      }
      
      // Coletar RTT
      if (stat.type === 'remote-inbound-rtp' && stat.kind === 'audio') {
        if (stat.roundTripTime !== undefined) {
          roundTripTime = stat.roundTripTime;
        }
        statsCounter++;
      }
    });
    
    if (statsCounter > 0) {
      // Calcular taxa de perda de pacotes
      const packetLossRate = totalPacketsReceived > 0 
        ? totalPacketsLost / (totalPacketsReceived + totalPacketsLost) 
        : 0;
      
      // Calcular pontuação de qualidade (0-1)
      // Pesos para cada métrica
      const weights = {
        packetLoss: 0.5,   // 50% peso para perda de pacotes
        jitter: 0.3,       // 30% peso para variação de atraso
        rtt: 0.2           // 20% peso para tempo de ida e volta
      };
      
      // Normalizar valores (quanto menor, melhor)
      const normalizedPacketLoss = 1 - Math.min(1, packetLossRate * 10); // 10% perda = 0 pontos
      const normalizedJitter = 1 - Math.min(1, jitter / 0.1); // 100ms jitter = 0 pontos
      const normalizedRtt = 1 - Math.min(1, roundTripTime / 1); // 1s RTT = 0 pontos
      
      // Calcular pontuação ponderada
      const score = (
        normalizedPacketLoss * weights.packetLoss + 
        normalizedJitter * weights.jitter + 
        normalizedRtt * weights.rtt
      );
      
      // Determinar categoria de qualidade
      let category;
      if (score >= 0.8) {
        category = 'excellent';
      } else if (score >= 0.6) {
        category = 'good';
      } else if (score >= 0.4) {
        category = 'fair';
      } else if (score >= 0.2) {
        category = 'poor';
      } else {
        category = 'critical';
      }
      
      // Salvar dados de qualidade
      this.connectionQuality.set(userId, { 
        score, 
        category, 
        timestamp: Date.now(),
        details: {
          packetLoss: packetLossRate,
          jitter,
          roundTripTime,
          audioLevel
        }
      });
      
      // Disparar evento de mudança de qualidade
      this.triggerCallback('onQualityChange', {
        userId,
        score,
        category,
        details: {
          packetLoss: packetLossRate,
          jitter,
          roundTripTime,
          audioLevel
        }
      });
    }
  }
  
  /**
   * Agenda tentativa de reconexão com um usuário
   * @param {string} userId - ID do usuário
   * @private
   */
  _scheduleReconnectionAttempt(userId) {
    // Evitar sobreposição de tentativas para o mesmo usuário
    if (this._reconnectionTimers && this._reconnectionTimers[userId]) {
      clearTimeout(this._reconnectionTimers[userId]);
    }
    
    // Inicializar objeto de timers, se necessário
    if (!this._reconnectionTimers) {
      this._reconnectionTimers = {};
    }
    
    // Definir um tempo aleatório para evitar colisões (entre 1 e 3 segundos)
    const delay = 1000 + Math.floor(Math.random() * 2000);
    
    // Agendar tentativa
    this._reconnectionTimers[userId] = setTimeout(() => {
      // Verificar se a conexão ainda está em estado problemático
      const connectionState = this.connectionStates.get(userId);
      if (connectionState === 'disconnected' || 
          connectionState === 'failed' || 
          connectionState === 'closed') {
        console.log(`Tentando reconectar com ${userId}...`);
        
        // Fechar a conexão atual
        this.closePeerConnection(userId);
        
        // Notificar sobre tentativa de reconexão
        this.triggerCallback('onReconnectionAttempt', { userId });
        
        // Criar nova conexão
        setTimeout(() => {
          this.createPeerConnection(userId, true);
        }, 500);
      }
      
      // Limpar timer
      delete this._reconnectionTimers[userId];
    }, delay);
  }

  /**
   * Obtém a qualidade de conexão para um usuário
   * @param {string} userId - ID do usuário
   * @returns {Object|null} - Dados de qualidade da conexão
   */
  getConnectionQuality(userId) {
    return this.connectionQuality.get(userId) || null;
  }
  
  /**
   * Obtém o estado atual da conexão para um usuário
   * @param {string} userId - ID do usuário
   * @returns {string} - Estado da conexão
   */
  getConnectionState(userId) {
    return this.connectionStates.get(userId) || 'unknown';
  }
}

export default WebRTCManager;
