/**
 * AudioProcessor.js
 * Processa streams de áudio com buffer adaptativo para otimizar latência e qualidade
 */

class AudioProcessor {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.sources = new Map();
    this.analyzers = new Map();
    this.bufferSize = 256; // Valor inicial, será adaptativo
    this.processors = new Map();
    this.gainNodes = new Map();
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.connect(this.audioContext.destination);
    this.masterGainNode.gain.value = 1.0;
    this.callbacks = {};
  }

  /**
   * Processa um stream de áudio recebido
   * @param {string} userId - ID do usuário dono do stream
   * @param {MediaStream} stream - Stream de mídia para processar
   * @returns {Object} - Informações sobre o processamento
   */
  processStream(userId, stream) {
    if (this.sources.has(userId)) {
      this.removeStream(userId);
    }

    console.log(`Processando stream de áudio para ${userId}`);

    try {
      // Criar nós de áudio
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyzer = this.audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;

      // Criar nó de processamento para adaptação dinâmica
      const processor = this.audioContext.createScriptProcessor(
        this.bufferSize, 
        2, // número de canais de entrada
        2  // número de canais de saída
      );

      processor.onaudioprocess = this.createAudioProcessHandler(userId);

      // Conectar nós
      source.connect(analyzer);
      analyzer.connect(gainNode);
      gainNode.connect(processor);
      processor.connect(this.masterGainNode);

      // Armazenar referências
      this.sources.set(userId, { source, stream });
      this.analyzers.set(userId, analyzer);
      this.processors.set(userId, processor);
      this.gainNodes.set(userId, gainNode);

      // Iniciar análise periódica
      this._startAnalysis(userId, analyzer);

      return {
        userId,
        gainNode
      };
    } catch (error) {
      console.error(`Erro ao processar stream de áudio para ${userId}:`, error);
      this.triggerCallback('onError', { 
        type: 'audio_processing_error', 
        userId, 
        message: error.message,
        error
      });
      throw error;
    }
  }

  /**
   * Cria um manipulador para processamento de áudio
   * @private
   */
  createAudioProcessHandler(userId) {
    return (e) => {
      try {
        // Implementação para adaptação dinâmica do buffer
        const inputBuffer = e.inputBuffer;
        const outputBuffer = e.outputBuffer;
        
        // Copiar dados do buffer de entrada para o de saída
        for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
          const inputData = inputBuffer.getChannelData(channel);
          const outputData = outputBuffer.getChannelData(channel);
          
          for (let i = 0; i < inputBuffer.length; i++) {
            outputData[i] = inputData[i];
          }
        }
        
        // Análise de qualidade do áudio
        this._analyzeAudioQuality(userId, inputBuffer);
      } catch (error) {
        console.error(`Erro no processamento de áudio para ${userId}:`, error);
      }
    };
  }

  /**
   * Analisa a qualidade do áudio
   * @private
   */
  _analyzeAudioQuality(userId, buffer) {
    // Implementação simples para detectar silêncio e picos
    let sum = 0;
    let max = 0;
    
    // Analisar apenas o primeiro canal
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      sum += abs;
      max = Math.max(max, abs);
    }
    
    const avg = sum / data.length;
    
    // Detectar silêncio
    const isSilent = avg < 0.005 && max < 0.01;
    
    // Detectar picos (possível clipping)
    const hasPeaks = max > 0.99;
    
    if (isSilent) {
      // Sem áudio detectável
      this.triggerCallback('onAudioAnalysis', { 
        userId, 
        status: 'silent',
        level: avg,
        max
      });
    } else if (hasPeaks) {
      // Possível clipping
      this.triggerCallback('onAudioAnalysis', { 
        userId, 
        status: 'peaking',
        level: avg,
        max
      });
    } else {
      // Áudio normal
      this.triggerCallback('onAudioAnalysis', { 
        userId, 
        status: 'normal',
        level: avg,
        max
      });
    }
  }

  /**
   * Inicia análise periódica do espectro de áudio
   * @private
   */
  _startAnalysis(userId, analyzer) {
    if (!analyzer) return;
    
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const analyze = () => {
      if (!this.analyzers.has(userId)) return;
      
      analyzer.getByteFrequencyData(dataArray);
      
      // Calcular energia média nas diferentes faixas de frequência
      const lowFreq = this._calculateBandEnergy(dataArray, 0, bufferLength * 0.1);
      const midFreq = this._calculateBandEnergy(dataArray, bufferLength * 0.1, bufferLength * 0.5);
      const highFreq = this._calculateBandEnergy(dataArray, bufferLength * 0.5, bufferLength);
      
      this.triggerCallback('onSpectrumAnalysis', {
        userId,
        lowFreq,
        midFreq,
        highFreq,
        fullSpectrum: Array.from(dataArray)
      });
      
      // Continuar análise
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  /**
   * Calcula a energia em uma banda de frequência
   * @private
   */
  _calculateBandEnergy(dataArray, start, end) {
    start = Math.floor(start);
    end = Math.floor(end);
    
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += dataArray[i];
    }
    
    return sum / (end - start);
  }

  /**
   * Ajusta o tamanho do buffer baseado na qualidade da conexão
   * @param {string} userId - ID do usuário
   * @param {number} connectionQuality - Qualidade da conexão (0-1)
   */
  adjustBufferSize(userId, connectionQuality) {
    if (!this.processors.has(userId)) {
      console.log(`Não há processador para ${userId}`);
      return;
    }
    
    let newSize;
    
    // Ajustar tamanho do buffer baseado na qualidade
    if (connectionQuality < 0.3) {
      // Conexão ruim - buffer maior para mais estabilidade
      newSize = 1024;
    } else if (connectionQuality < 0.7) {
      // Conexão média
      newSize = 512;
    } else {
      // Conexão boa - buffer menor para menos latência
      newSize = 256;
    }
    
    // Se o tamanho for diferente do atual, recriar o processador
    if (newSize !== this.bufferSize && this.sources.has(userId)) {
      console.log(`Ajustando tamanho do buffer para ${userId}: ${this.bufferSize} -> ${newSize}`);
      
      const oldProcessor = this.processors.get(userId);
      const { source } = this.sources.get(userId);
      const analyzer = this.analyzers.get(userId);
      const gainNode = this.gainNodes.get(userId);
      
      // Desconectar o processador atual
      if (oldProcessor) {
        oldProcessor.disconnect();
      }
      
      // Criar novo processador
      const newProcessor = this.audioContext.createScriptProcessor(
        newSize,
        2,
        2
      );
      
      newProcessor.onaudioprocess = this.createAudioProcessHandler(userId);
      
      // Reconectar os nós
      source.connect(analyzer);
      analyzer.connect(gainNode);
      gainNode.connect(newProcessor);
      newProcessor.connect(this.masterGainNode);
      
      // Atualizar referência
      this.processors.set(userId, newProcessor);
      
      // Atualizar tamanho do buffer
      this.bufferSize = newSize;
      
      this.triggerCallback('onBufferSizeChanged', {
        userId,
        oldSize: this.bufferSize,
        newSize,
        connectionQuality
      });
    }
  }

  /**
   * Ajusta o volume de um usuário específico
   * @param {string} userId - ID do usuário
   * @param {number} volume - Volume (0-1)
   */
  setVolume(userId, volume) {
    if (!this.gainNodes.has(userId)) {
      console.log(`Não há controle de ganho para ${userId}`);
      return false;
    }
    
    // Garantir que o volume esteja entre 0 e 1
    volume = Math.max(0, Math.min(1, volume));
    
    console.log(`Ajustando volume para ${userId}: ${volume}`);
    
    const gainNode = this.gainNodes.get(userId);
    gainNode.gain.value = volume;
    
    this.triggerCallback('onVolumeChanged', { 
      userId, 
      volume 
    });
    
    return true;
  }

  /**
   * Ajusta o volume mestre
   * @param {number} volume - Volume (0-1)
   */
  setMasterVolume(volume) {
    // Garantir que o volume esteja entre 0 e 1
    volume = Math.max(0, Math.min(1, volume));
    
    console.log(`Ajustando volume mestre: ${volume}`);
    
    this.masterGainNode.gain.value = volume;
    
    this.triggerCallback('onMasterVolumeChanged', { volume });
    
    return true;
  }

  /**
   * Remove o processamento de áudio para um usuário
   * @param {string} userId - ID do usuário
   */
  removeStream(userId) {
    if (!this.sources.has(userId)) {
      return;
    }
    
    console.log(`Removendo processamento de áudio para ${userId}`);
    
    try {
      // Desconectar e remover nós de áudio
      if (this.processors.has(userId)) {
        this.processors.get(userId).disconnect();
        this.processors.delete(userId);
      }
      
      if (this.analyzers.has(userId)) {
        this.analyzers.get(userId).disconnect();
        this.analyzers.delete(userId);
      }
      
      if (this.gainNodes.has(userId)) {
        this.gainNodes.get(userId).disconnect();
        this.gainNodes.delete(userId);
      }
      
      if (this.sources.has(userId)) {
        this.sources.get(userId).source.disconnect();
        this.sources.delete(userId);
      }
      
      this.triggerCallback('onStreamRemoved', { userId });
    } catch (error) {
      console.error(`Erro ao remover stream de ${userId}:`, error);
    }
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

export default AudioProcessor;
