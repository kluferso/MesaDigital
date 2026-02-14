/**
 * Testes unitários para WebRTCManager
 */

import WebRTCManager from '../WebRTCManager';

// Mocks para RTCPeerConnection
class MockRTCPeerConnection {
  constructor(config) {
    this.config = config;
    this.localDescription = null;
    this.remoteDescription = null;
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.onicecandidate = null;
    this.ontrack = null;
    this.onconnectionstatechange = null;
    this.oniceconnectionstatechange = null;
    this.addTrack = jest.fn();
    this.close = jest.fn();
  }

  createOffer() {
    return Promise.resolve({ type: 'offer', sdp: 'test-sdp-offer' });
  }

  createAnswer() {
    return Promise.resolve({ type: 'answer', sdp: 'test-sdp-answer' });
  }

  setLocalDescription(description) {
    this.localDescription = description;
    return Promise.resolve();
  }

  setRemoteDescription(description) {
    this.remoteDescription = description;
    return Promise.resolve();
  }

  addIceCandidate(candidate) {
    return Promise.resolve();
  }

  getStats() {
    return Promise.resolve(new Map());
  }
}

// Mock para navigator.mediaDevices
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    id: 'test-stream-id',
    getTracks: () => [
      { kind: 'audio', enabled: true, stop: jest.fn() }
    ],
    getAudioTracks: () => [
      { kind: 'audio', enabled: true, stop: jest.fn() }
    ],
    getVideoTracks: () => []
  })
};

// Mock para RTCPeerConnection
global.RTCPeerConnection = MockRTCPeerConnection;
global.RTCSessionDescription = class MockRTCSessionDescription {
  constructor(init) {
    this.type = init.type;
    this.sdp = init.sdp;
  }
};
global.RTCIceCandidate = class MockRTCIceCandidate {
  constructor(init) {
    this.candidate = init.candidate;
    this.sdpMid = init.sdpMid;
    this.sdpMLineIndex = init.sdpMLineIndex;
  }
};

// Mocks para AudioContext
const createMockAudioContext = () => ({
  destination: {},
  currentTime: 0,
  close: jest.fn().mockResolvedValue(),
  createMediaStreamSource: jest.fn().mockReturnValue({}),
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    gain: { 
      value: 1.0,
      setValueAtTime: jest.fn() 
    }
  }),
  createOscillator: jest.fn().mockReturnValue({
    connect: jest.fn(),
    start: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn()
    }
  }),
  createMediaStreamDestination: jest.fn().mockReturnValue({
    stream: {
      getTracks: jest.fn().mockReturnValue([]),
      getAudioTracks: jest.fn().mockReturnValue([]),
      getVideoTracks: jest.fn().mockReturnValue([])
    }
  }),
  createScriptProcessor: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    onaudioprocess: null
  }),
  createAnalyser: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn()
  })
});

const MockAudioContext = jest.fn().mockImplementation(createMockAudioContext);

// Setup globals before tests
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

describe('WebRTCManager', () => {
  let webRTCManager;
  
  beforeAll(() => {
    // Garantir que window tenha os mocks
    Object.defineProperty(window, 'AudioContext', {
      writable: true,
      value: MockAudioContext
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      writable: true,
      value: MockAudioContext
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default mock implementation for getUserMedia with consistent tracks
    const audioTrack = { kind: 'audio', enabled: true, stop: jest.fn() };
    const tracks = [audioTrack];
    
    navigator.mediaDevices.getUserMedia.mockResolvedValue({
      id: 'test-stream-id',
      getTracks: () => tracks,
      getAudioTracks: () => tracks,
      getVideoTracks: () => []
    });

    // Mock do método privado _createAudioContext para evitar dependência de globais
    jest.spyOn(WebRTCManager.prototype, '_createAudioContext').mockImplementation(createMockAudioContext);
    webRTCManager = new WebRTCManager();
  });
  
  afterEach(() => {
    if (webRTCManager.audioContext) {
      webRTCManager.audioContext.close();
    }
  });
  
  describe('Inicialização', () => {
    test('deve inicializar corretamente e obter stream local', async () => {
      await webRTCManager.initialize();
      
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: expect.any(Object),
        video: false
      });
      
      expect(webRTCManager.localStream).toBeTruthy();
      expect(webRTCManager.initialized).toBe(true);
    });
    
    test('deve usar áudio simulado quando microfone falhar', async () => {
      const errorMock = new Error('Erro de acesso à mídia');
      navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(errorMock);
      
      const warningCallback = jest.fn();
      const initCallback = jest.fn();
      
      webRTCManager.on('onWarning', warningCallback);
      webRTCManager.on('onInitialized', initCallback);
      
      // Deve resolver com sucesso (usando fallback)
      await webRTCManager.initialize();
      
      // Deve ter emitido aviso
      expect(warningCallback).toHaveBeenCalledWith(expect.objectContaining({
        type: 'microphone_unavailable'
      }));
      
      // Deve ter inicializado com sucesso
      expect(initCallback).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
      
      expect(webRTCManager.initialized).toBe(true);
      expect(webRTCManager.localStream).toBeTruthy();
      
      // Verificar se createOscillator foi chamado (prova que usou fallback)
      // Precisamos acessar a instância do mock retornada
      // Como não temos acesso direto à instância criada internamente, 
      // confiamos no comportamento (warning + initialized)
    });
  });
  
  describe('Gerenciamento de conexões peer', () => {
    beforeEach(async () => {
      await webRTCManager.initialize();
    });
    
    test('deve criar conexão peer e adicionar tracks locais', async () => {
      // Setup local stream first
      await webRTCManager.initialize();
      
      webRTCManager.createPeerConnection('test-user', true);
      
      // Verificar se RTCPeerConnection foi instanciado
      const pc = webRTCManager.connections.get('test-user').pc;
      expect(pc).toBeInstanceOf(MockRTCPeerConnection);
      expect(webRTCManager.connections.has('test-user')).toBe(true);
      expect(pc.addTrack).toHaveBeenCalled();
    });
    
    test('deve reutilizar conexão peer existente', () => {
      const pc1 = webRTCManager.createPeerConnection('test-user', true);
      const pc2 = webRTCManager.createPeerConnection('test-user', true);
      
      expect(pc1).toBe(pc2);
      expect(webRTCManager.connections.size).toBe(1);
    });
    
    test('deve disparar evento onIceCandidate quando candidato for gerado', () => {
      const mockCallback = jest.fn();
      webRTCManager.on('onIceCandidate', mockCallback);
      
      const pc = webRTCManager.createPeerConnection('test-user', true);
      const mockCandidate = { candidate: 'test-candidate' };
      
      // Simular evento de candidato ICE
      pc.onicecandidate({ candidate: mockCandidate });
      
      expect(mockCallback).toHaveBeenCalledWith({
        userId: 'test-user',
        candidate: mockCandidate
      });
    });
    
    test('deve fechar conexão peer corretamente', () => {
      const pc = webRTCManager.createPeerConnection('test-user', true);
      const mockCallback = jest.fn();
      webRTCManager.on('onPeerConnectionClosed', mockCallback);
      
      webRTCManager.closePeerConnection('test-user');
      
      expect(pc.close).toHaveBeenCalled();
      expect(webRTCManager.connections.has('test-user')).toBe(false);
      expect(mockCallback).toHaveBeenCalledWith({ userId: 'test-user' });
    });
    
    test('deve fechar todas as conexões peer', () => {
      webRTCManager.createPeerConnection('user1', true);
      webRTCManager.createPeerConnection('user2', true);
      webRTCManager.createPeerConnection('user3', true);
      
      const mockCallback = jest.fn();
      webRTCManager.on('onAllConnectionsClosed', mockCallback);
      
      webRTCManager.closeAllConnections();
      
      expect(webRTCManager.connections.size).toBe(0);
      expect(mockCallback).toHaveBeenCalled();
    });
  });
  
  describe('Processamento de sinais WebRTC', () => {
    beforeEach(async () => {
      await webRTCManager.initialize();
    });
    
    test('deve processar oferta corretamente', async () => {
      const mockOffer = { type: 'offer', sdp: 'test-offer-sdp' };
      const mockCallback = jest.fn();
      webRTCManager.on('onAnswerCreated', mockCallback);
      
      await webRTCManager.processOffer('test-user', mockOffer);
      
      const pc = webRTCManager.connections.get('test-user').pc;
      expect(pc.remoteDescription).toEqual(mockOffer);
      expect(pc.localDescription).toBeTruthy();
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'test-user',
        answer: expect.objectContaining({
          type: 'answer'
        })
      }));
    });
    
    test('deve processar resposta corretamente', async () => {
      const pc = webRTCManager.createPeerConnection('test-user', true);
      const mockAnswer = { type: 'answer', sdp: 'test-answer-sdp' };
      const mockCallback = jest.fn();
      webRTCManager.on('onAnswerProcessed', mockCallback);
      
      await webRTCManager.processAnswer('test-user', mockAnswer);
      
      expect(pc.remoteDescription).toEqual(mockAnswer);
      expect(mockCallback).toHaveBeenCalledWith({ userId: 'test-user' });
    });
    
    test('deve adicionar candidato ICE à conexão peer', async () => {
      const pc = webRTCManager.createPeerConnection('test-user', true);
      const mockCandidate = { sdpMid: 'audio', candidate: 'test-candidate' };
      const addIceCandidateSpy = jest.spyOn(pc, 'addIceCandidate');
      
      // Simular descrição remota já definida
      pc.remoteDescription = { type: 'answer' };
      
      await webRTCManager.addIceCandidate('test-user', mockCandidate);
      
      expect(addIceCandidateSpy).toHaveBeenCalled();
    });
    
    test('deve colocar candidato ICE na fila se não houver descrição remota', async () => {
      webRTCManager.createPeerConnection('test-user', true);
      const mockCandidate = { sdpMid: 'audio', candidate: 'test-candidate' };
      
      await webRTCManager.addIceCandidate('test-user', mockCandidate);
      
      expect(webRTCManager.iceCandidateQueue.has('test-user')).toBe(true);
      expect(webRTCManager.iceCandidateQueue.get('test-user')).toContainEqual(mockCandidate);
    });
  });
  
  describe('Controle de mídia', () => {
    beforeEach(async () => {
      await webRTCManager.initialize();
    });
    
    test('deve ativar/desativar áudio local', () => {
      const audioTrack = webRTCManager.localStream.getTracks()[0];
      const mockCallback = jest.fn();
      webRTCManager.on('onLocalAudioToggled', mockCallback);
      
      webRTCManager.toggleLocalAudio(false);
      expect(audioTrack.enabled).toBe(false);
      expect(mockCallback).toHaveBeenCalledWith({ enabled: false });
      
      webRTCManager.toggleLocalAudio(true);
      expect(audioTrack.enabled).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith({ enabled: true });
    });
  });
});
