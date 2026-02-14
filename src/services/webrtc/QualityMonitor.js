/**
 * QualityMonitor.js
 * Monitora a qualidade das conexões WebRTC e fornece métricas
 */

class QualityMonitor {
  constructor() {
    this.metrics = new Map();
    this.callbacks = {};
    this.monitoringIntervals = new Map();
    this.qualityScores = new Map();
    this.historyLength = 10; // Número de medições a manter para análise de tendência
    this.metricsHistory = new Map();
  }

  /**
   * Inicia o monitoramento de uma conexão peer
   * @param {string} userId - ID do usuário
   * @param {RTCPeerConnection} peerConnection - Conexão peer a monitorar
   */
  startMonitoring(userId, peerConnection) {
    if (this.monitoringIntervals.has(userId)) {
      this.stopMonitoring(userId);
    }

    console.log(`Iniciando monitoramento de qualidade para ${userId}`);

    // Inicializar histórico de métricas
    this.metricsHistory.set(userId, []);

    // Coletar métricas iniciais
    this.collectMetrics(userId, peerConnection);

    // Configurar intervalo para coleta periódica
    const interval = setInterval(() => {
      this.collectMetrics(userId, peerConnection);
    }, 3000);

    this.monitoringIntervals.set(userId, interval);
  }

  /**
   * Para o monitoramento de uma conexão peer
   * @param {string} userId - ID do usuário
   */
  stopMonitoring(userId) {
    if (!this.monitoringIntervals.has(userId)) {
      return;
    }

    console.log(`Parando monitoramento de qualidade para ${userId}`);

    clearInterval(this.monitoringIntervals.get(userId));
    this.monitoringIntervals.delete(userId);
  }

  /**
   * Coleta métricas de uma conexão peer
   * @param {string} userId - ID do usuário
   * @param {RTCPeerConnection} peerConnection - Conexão peer
   */
  async collectMetrics(userId, peerConnection) {
    try {
      const stats = await peerConnection.getStats();
      
      const metrics = {
        timestamp: Date.now(),
        audio: {},
        connection: {}
      };

      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          metrics.audio = {
            packetsReceived: report.packetsReceived || 0,
            packetsLost: report.packetsLost || 0,
            jitter: report.jitter || 0,
            fractionLost: report.packetsLost ? 
              report.packetsLost / (report.packetsReceived + report.packetsLost) : 0,
            bytesReceived: report.bytesReceived || 0,
            codec: report.codecId || 'unknown'
          };
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          metrics.connection = {
            roundTripTime: report.currentRoundTripTime || 0,
            availableOutgoingBitrate: report.availableOutgoingBitrate || 0,
            bytesReceived: report.bytesReceived || 0,
            bytesSent: report.bytesSent || 0,
            localCandidateType: report.localCandidateId || 'unknown',
            remoteCandidateType: report.remoteCandidateId || 'unknown'
          };
        } else if (report.type === 'local-candidate') {
          // Armazenar informações sobre o candidato local
          metrics.localCandidate = {
            type: report.candidateType || 'unknown',
            protocol: report.protocol || 'unknown',
            ip: report.ip || 'unknown',
            port: report.port || 0
          };
        } else if (report.type === 'remote-candidate') {
          // Armazenar informações sobre o candidato remoto
          metrics.remoteCandidate = {
            type: report.candidateType || 'unknown',
            protocol: report.protocol || 'unknown',
            ip: report.ip || 'unknown',
            port: report.port || 0
          };
        }
      });

      // Armazenar métricas
      this.metrics.set(userId, metrics);

      // Adicionar ao histórico
      this._updateMetricsHistory(userId, metrics);

      // Calcular pontuação de qualidade
      const score = this.calculateQualityScore(userId);
      
      // Notificar callbacks
      this.triggerCallback('onMetricsUpdate', { userId, metrics });

      return metrics;
    } catch (error) {
      console.error(`Erro ao coletar métricas para ${userId}:`, error);
      this.triggerCallback('onError', { 
        type: 'metrics_collection_error', 
        userId, 
        message: error.message,
        error
      });
    }
  }

  /**
   * Atualiza o histórico de métricas para análise de tendência
   * @private
   */
  _updateMetricsHistory(userId, metrics) {
    if (!this.metricsHistory.has(userId)) {
      this.metricsHistory.set(userId, []);
    }

    const history = this.metricsHistory.get(userId);
    
    // Adicionar nova medição
    history.push(metrics);
    
    // Limitar tamanho do histórico
    if (history.length > this.historyLength) {
      history.shift();
    }
  }

  /**
   * Calcula a pontuação de qualidade para um usuário
   * @param {string} userId - ID do usuário
   * @returns {number} - Pontuação de qualidade (0-1)
   */
  calculateQualityScore(userId) {
    if (!this.metrics.has(userId)) return 1.0;
    
    const metrics = this.metrics.get(userId);
    const { audio, connection } = metrics;
    
    // Pontuação inicial ideal
    let score = 1.0;
    
    // Fatores de ponderação para diferentes métricas
    const weights = {
      packetLoss: 0.4,   // Perda de pacotes tem grande impacto
      jitter: 0.2,       // Jitter tem impacto moderado
      rtt: 0.3,          // Latência tem impacto significativo
      bitrate: 0.1       // Bitrate tem impacto menor
    };
    
    // 1. Reduzir pontuação baseado em perda de pacotes
    if (audio.fractionLost !== undefined) {
      const packetLossImpact = Math.min(audio.fractionLost * 5, 1) * weights.packetLoss;
      score -= packetLossImpact;
    }
    
    // 2. Reduzir pontuação baseado em jitter
    if (audio.jitter !== undefined) {
      // Converter jitter (em segundos) para ms e normalizar
      const jitterMs = audio.jitter * 1000;
      const jitterImpact = Math.min(jitterMs / 50, 1) * weights.jitter;
      score -= jitterImpact;
    }
    
    // 3. Reduzir pontuação baseado em latência (RTT)
    if (connection.roundTripTime !== undefined) {
      // Normalizar RTT (em segundos)
      const rttImpact = Math.min(connection.roundTripTime * 5, 1) * weights.rtt;
      score -= rttImpact;
    }
    
    // 4. Avaliar taxa de transferência disponível
    if (connection.availableOutgoingBitrate !== undefined) {
      // Calcular impacto de bitrate baixo (menos de 30kbps é problemático para áudio)
      const minBitrateForAudio = 30000; // 30 kbps
      const bitrateFactor = Math.min(connection.availableOutgoingBitrate / minBitrateForAudio, 1);
      const bitrateImpact = (1 - bitrateFactor) * weights.bitrate;
      score -= bitrateImpact;
    }
    
    // 5. Analisar tendência do histórico
    const trend = this._analyzeQualityTrend(userId);
    if (trend < 0) {
      // Tendência de piora (reduz até 10% adicionais)
      score *= (1 + trend * 0.1);
    }
    
    // Garantir que a pontuação fique entre 0 e 1
    score = Math.max(0, Math.min(score, 1));
    
    // Armazenar pontuação
    this.qualityScores.set(userId, score);
    
    // Determinar categoria
    const category = this.getQualityCategory(score);
    
    // Notificar mudança de qualidade
    this.triggerCallback('onQualityChange', {
      userId,
      score,
      category,
      metrics
    });
    
    return score;
  }

  /**
   * Analisa a tendência da qualidade com base no histórico
   * @private
   * @returns {number} - Tendência (-1 a 1, negativo = piora, positivo = melhora)
   */
  _analyzeQualityTrend(userId) {
    if (!this.metricsHistory.has(userId)) {
      return 0;
    }
    
    const history = this.metricsHistory.get(userId);
    if (history.length < 3) {
      return 0; // Não há dados suficientes
    }
    
    // Extrair as últimas 3 métricas para análise de tendência
    const latest = history.slice(-3);
    
    // Calcular tendência de perda de pacotes
    let packetLossTrend = 0;
    if (latest[0].audio.fractionLost !== undefined && 
        latest[2].audio.fractionLost !== undefined) {
      packetLossTrend = latest[0].audio.fractionLost - latest[2].audio.fractionLost;
    }
    
    // Calcular tendência de jitter
    let jitterTrend = 0;
    if (latest[0].audio.jitter !== undefined && 
        latest[2].audio.jitter !== undefined) {
      jitterTrend = latest[0].audio.jitter - latest[2].audio.jitter;
    }
    
    // Calcular tendência de RTT
    let rttTrend = 0;
    if (latest[0].connection.roundTripTime !== undefined && 
        latest[2].connection.roundTripTime !== undefined) {
      rttTrend = latest[0].connection.roundTripTime - latest[2].connection.roundTripTime;
    }
    
    // Combinar tendências (negativo = piora, positivo = melhora)
    // Inverter packetLossTrend, jitterTrend e rttTrend pois valores menores são melhores
    const trend = -0.5 * packetLossTrend - 0.2 * jitterTrend - 0.3 * rttTrend;
    
    return Math.max(-1, Math.min(1, trend));
  }

  /**
   * Determina a categoria de qualidade com base na pontuação
   * @param {number} score - Pontuação de qualidade (0-1)
   * @returns {string} - Categoria de qualidade
   */
  getQualityCategory(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    if (score >= 0.2) return 'poor';
    return 'critical';
  }

  /**
   * Obtém a qualidade atual para um usuário
   * @param {string} userId - ID do usuário
   * @returns {Object|null} - Informações de qualidade ou null se não disponível
   */
  getQuality(userId) {
    if (!this.qualityScores.has(userId)) {
      return null;
    }
    
    const score = this.qualityScores.get(userId);
    const category = this.getQualityCategory(score);
    
    return {
      userId,
      score,
      category,
      metrics: this.metrics.get(userId)
    };
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

export default QualityMonitor;
