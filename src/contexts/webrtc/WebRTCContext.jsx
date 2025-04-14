import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Contexto para gerenciar WebRTC e conexões de áudio
const WebRTCContext = createContext({});

// URL base para o servidor
const SERVER_URL = process.env.REACT_APP_SERVER_URL || window.location.origin;

// Configuração do WebRTC
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org:3478' }
  ],
  sdpSemantics: 'unified-plan',
  iceCandidatePoolSize: 10
};

export const WebRTCProvider = ({ children }) => {
  // Estado para conexões e usuários
  const [isInitialized, setIsInitialized] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [localUser, setLocalUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [connectionQuality, setConnectionQuality] = useState({});
  const [connectingUsers, setConnectingUsers] = useState([]);
  const [error, setError] = useState(null);
  
  // Refs para WebRTC
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudiosRef = useRef({});
  
  const navigate = useNavigate();
  
  // Inicialização do Socket.IO
  useEffect(() => {
    const socketInstance = io(SERVER_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 15000
    });
    
    socketInstance.on('connect', () => {
      console.log('Socket.IO conectado');
      setIsInitialized(true);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Socket.IO desconectado');
      setIsInitialized(false);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.IO:', error);
      setError('Erro de conexão com o servidor. Tente novamente.');
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  // Configuração dos listeners de Socket.IO para WebRTC
  useEffect(() => {
    if (!socket) return;
    
    // Configurar listeners de sinal WebRTC
    socket.on('webrtc_signal', handleWebRTCSignal);
    
    // Configurar listeners para entrada/saída de usuários
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    
    // Configurar listeners para lista de usuários na sala
    socket.on('room_users', handleRoomUsers);
    
    // Configurar listener para qualidade de conexão
    socket.on('connection_quality', handleConnectionQuality);
    
    return () => {
      socket.off('webrtc_signal');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('room_users');
      socket.off('connection_quality');
    };
  }, [socket, localUser]);
  
  // Manipulador de sinais WebRTC
  const handleWebRTCSignal = useCallback((data) => {
    try {
      const { from, type, signal } = data;
      
      console.log(`Sinal WebRTC recebido: ${type} de ${from}`);
      
      // Obter a conexão peer existente ou criar uma nova
      const peerConnection = peerConnectionsRef.current[from] || 
        createPeerConnection(from, false);
      
      if (!peerConnection) {
        console.error(`Sem conexão peer para ${from}`);
        return;
      }
      
      // Processar o sinal com base no tipo
      if (type === 'offer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal))
          .then(() => peerConnection.createAnswer())
          .then(answer => peerConnection.setLocalDescription(answer))
          .then(() => {
            // Enviar resposta para o par
            socket.emit('webrtc_signal', {
              to: from,
              type: 'answer',
              signal: peerConnection.localDescription,
              roomId
            });
          })
          .catch(error => console.error('Erro ao processar oferta:', error));
      }
      else if (type === 'answer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal))
          .catch(error => console.error('Erro ao processar resposta:', error));
      }
      else if (type === 'candidate') {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal))
          .catch(error => console.error('Erro ao adicionar candidato ICE:', error));
      }
    } catch (error) {
      console.error('Erro ao processar sinal WebRTC:', error);
    }
  }, [socket, roomId]);
  
  // Criação de conexão peer
  const createPeerConnection = useCallback((userId, isInitiator) => {
    if (peerConnectionsRef.current[userId]) {
      console.log(`Conexão peer já existe para ${userId}`);
      return peerConnectionsRef.current[userId];
    }
    
    console.log(`Criando conexão peer para ${userId} (iniciador: ${isInitiator})`);
    
    try {
      const peerConnection = new RTCPeerConnection(rtcConfig);
      
      // Adicionar track de áudio local
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }
      
      // Listeners de eventos da conexão peer
      peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          // Enviar candidato ICE para o par
          socket.emit('webrtc_signal', {
            to: userId,
            type: 'candidate',
            signal: candidate,
            roomId
          });
        }
      };
      
      peerConnection.onconnectionstatechange = () => {
        console.log(`Estado da conexão com ${userId}: ${peerConnection.connectionState}`);
        
        if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed') {
          closePeerConnection(userId);
        }
      };
      
      peerConnection.ontrack = (event) => {
        console.log(`Track recebido de ${userId}`);
        
        // Adicionar o áudio remoto
        if (event.track.kind === 'audio') {
          if (!remoteAudiosRef.current[userId]) {
            const audio = new Audio();
            audio.srcObject = new MediaStream([event.track]);
            audio.autoplay = true;
            remoteAudiosRef.current[userId] = audio;
            
            // Atualizar volumes
            updateUserWithAudio(userId);
          }
        }
      };
      
      // Armazenar a conexão
      peerConnectionsRef.current[userId] = peerConnection;
      
      // Se for o iniciador, criar e enviar oferta
      if (isInitiator) {
        console.log(`Criando oferta para ${userId}`);
        
        peerConnection.createOffer()
          .then(offer => peerConnection.setLocalDescription(offer))
          .then(() => {
            // Enviar oferta para o par
            socket.emit('webrtc_signal', {
              to: userId,
              type: 'offer',
              signal: peerConnection.localDescription,
              roomId
            });
          })
          .catch(error => console.error('Erro ao criar oferta:', error));
      }
      
      return peerConnection;
    } catch (error) {
      console.error(`Erro ao criar conexão peer para ${userId}:`, error);
      return null;
    }
  }, [socket, roomId]);
  
  // Fechar conexão peer
  const closePeerConnection = useCallback((userId) => {
    const peerConnection = peerConnectionsRef.current[userId];
    if (peerConnection) {
      try {
        peerConnection.close();
        delete peerConnectionsRef.current[userId];
        
        // Remover o áudio
        if (remoteAudiosRef.current[userId]) {
          remoteAudiosRef.current[userId].srcObject = null;
          delete remoteAudiosRef.current[userId];
          
          // Atualizar lista de usuários
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        }
        
        console.log(`Conexão peer fechada para ${userId}`);
      } catch (error) {
        console.error(`Erro ao fechar conexão peer para ${userId}:`, error);
      }
    }
  }, []);
  
  // Manipulador de entrada de usuário
  const handleUserJoined = useCallback((data) => {
    const { userId, userName, instrument } = data;
    console.log(`Usuário entrou: ${userName} (${userId}) com ${instrument}`);
    
    // Adicionar à lista de usuários em conexão
    setConnectingUsers(prev => [...prev, userId]);
    
    // Criar conexão peer se não for o usuário local
    if (localUser && userId !== localUser.id) {
      createPeerConnection(userId, true);
    }
    
    // Adicionar à lista de usuários
    setUsers(prevUsers => {
      if (!prevUsers.find(user => user.id === userId)) {
        return [...prevUsers, {
          id: userId,
          name: userName,
          instrument: instrument || 'Sem instrumento',
          volume: 1.0,
          muted: false
        }];
      }
      return prevUsers;
    });
    
    // Remover da lista de usuários em conexão após um tempo
    setTimeout(() => {
      setConnectingUsers(prev => prev.filter(id => id !== userId));
    }, 5000);
  }, [localUser, createPeerConnection]);
  
  // Manipulador de saída de usuário
  const handleUserLeft = useCallback((data) => {
    const { userId } = data;
    console.log(`Usuário saiu: ${userId}`);
    
    // Fechar a conexão peer
    closePeerConnection(userId);
    
    // Remover da lista de usuários
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  }, [closePeerConnection]);
  
  // Manipulador de lista de usuários na sala
  const handleRoomUsers = useCallback((data) => {
    const { users: roomUsers } = data;
    console.log(`Lista de usuários na sala: ${roomUsers.length}`);
    
    // Processar lista de usuários
    const userList = roomUsers.map(user => ({
      id: user.id,
      name: user.name,
      instrument: user.instrument || 'Sem instrumento',
      volume: 1.0,
      muted: false
    }));
    
    setUsers(userList);
    
    // Criar conexões peer para usuários que não são o local
    if (localUser) {
      roomUsers.forEach(user => {
        if (user.id !== localUser.id && !peerConnectionsRef.current[user.id]) {
          createPeerConnection(user.id, true);
        }
      });
    }
  }, [localUser, createPeerConnection]);
  
  // Manipulador de qualidade de conexão
  const handleConnectionQuality = useCallback((data) => {
    setConnectionQuality(prevState => ({
      ...prevState,
      [data.userId]: {
        category: data.category,
        score: data.score,
        latency: data.latency,
        jitter: data.jitter
      }
    }));
  }, []);
  
  // Atualizar usuário com áudio
  const updateUserWithAudio = useCallback((userId) => {
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.id === userId) {
        return { ...user, hasAudio: true };
      }
      return user;
    }));
  }, []);
  
  // Solicitação de acesso ao microfone
  const requestMicrophoneAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      // Configurações para qualidade de áudio musical
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      
      // Processador de áudio - podemos adicionar efeitos aqui
      const processor = audioCtx.createGain();
      processor.gain.value = 1.0;
      
      source.connect(processor);
      const destination = audioCtx.createMediaStreamDestination();
      processor.connect(destination);
      
      // Armazenar o stream
      localStreamRef.current = destination.stream;
      localAudioRef.current = processor;
      
      setAudioEnabled(true);
      
      return stream;
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      setError('Erro ao acessar microfone. Verifique as permissões.');
      throw error;
    }
  }, []);
  
  // Alternar áudio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !audioEnabled;
      
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
      
      setAudioEnabled(newState);
      
      // Emitir evento de alteração de áudio
      if (socket && inRoom) {
        socket.emit('toggle_audio', { enabled: newState });
      }
    }
  }, [socket, inRoom, audioEnabled]);
  
  // Definir volume para um usuário
  const setUserVolume = useCallback((userId, volume) => {
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.id === userId) {
        return { ...user, volume, muted: volume === 0 };
      }
      return user;
    }));
    
    // Ajustar o volume do áudio
    if (remoteAudiosRef.current[userId]) {
      remoteAudiosRef.current[userId].volume = volume * masterVolume;
    }
    
    // Emitir evento de alteração de volume
    if (socket && inRoom) {
      socket.emit('set_user_volume', { userId, volume });
    }
  }, [socket, inRoom, masterVolume]);
  
  // Definir volume master
  const setMasterVolumeValue = useCallback((volume) => {
    setMasterVolume(volume);
    
    // Ajustar o volume de todos os áudios
    Object.entries(remoteAudiosRef.current).forEach(([userId, audio]) => {
      const user = users.find(u => u.id === userId);
      if (user) {
        audio.volume = user.volume * volume;
      }
    });
    
    // Emitir evento de alteração de volume master
    if (socket && inRoom) {
      socket.emit('set_master_volume', { volume });
    }
  }, [socket, inRoom, users]);
  
  // Criar sala
  const createRoom = useCallback(async (name, instrument = 'Vocal') => {
    if (!socket || !isInitialized) {
      setError('Socket não inicializado. Tente novamente.');
      return false;
    }
    
    try {
      // Solicitar acesso ao microfone
      await requestMicrophoneAccess();
      
      // Gerar ID de sala aleatório
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Definir usuário local
      const localUserId = `local-${Date.now()}`;
      setLocalUser({
        id: localUserId,
        name,
        instrument,
        isLocal: true,
        volume: 1.0,
        muted: false
      });
      
      // Entrar na sala
      socket.emit('join_room', {
        roomId: newRoomId,
        name,
        instrument,
        hasMedia: true,
        webrtcEnabled: true,
        platform: 'web'
      });
      
      setRoomId(newRoomId);
      setInRoom(true);
      
      // Navegar para a sala
      navigate(`/room/${newRoomId}`);
      
      return true;
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      setError('Erro ao criar sala. Verifique as permissões do microfone.');
      return false;
    }
  }, [socket, isInitialized, requestMicrophoneAccess, navigate]);
  
  // Entrar em sala
  const joinRoom = useCallback(async (roomId, name, instrument = 'Vocal') => {
    if (!socket || !isInitialized) {
      setError('Socket não inicializado. Tente novamente.');
      return false;
    }
    
    try {
      // Solicitar acesso ao microfone
      await requestMicrophoneAccess();
      
      // Definir usuário local
      const localUserId = `local-${Date.now()}`;
      setLocalUser({
        id: localUserId,
        name,
        instrument,
        isLocal: true,
        volume: 1.0,
        muted: false
      });
      
      // Entrar na sala
      socket.emit('join_room', {
        roomId,
        name,
        instrument,
        hasMedia: true,
        webrtcEnabled: true,
        platform: 'web'
      });
      
      setRoomId(roomId);
      setInRoom(true);
      
      return true;
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      setError('Erro ao entrar na sala. Verifique as permissões do microfone.');
      return false;
    }
  }, [socket, isInitialized, requestMicrophoneAccess]);
  
  // Sair da sala
  const leaveRoom = useCallback(() => {
    if (socket && inRoom) {
      socket.emit('leave_room', { roomId });
      
      // Fechar todas as conexões peer
      Object.keys(peerConnectionsRef.current).forEach(userId => {
        closePeerConnection(userId);
      });
      
      // Parar o stream local
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Resetar estado
      setRoomId('');
      setInRoom(false);
      setUsers([]);
      setLocalUser(null);
      
      // Navegar para a página inicial
      navigate('/');
    }
  }, [socket, inRoom, roomId, closePeerConnection, navigate]);
  
  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      // Fechar todas as conexões e limpar streams
      Object.keys(peerConnectionsRef.current).forEach(userId => {
        closePeerConnection(userId);
      });
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [closePeerConnection]);
  
  // Valor do contexto
  const contextValue = {
    isInitialized,
    inRoom,
    roomId,
    localUser,
    users,
    audioEnabled,
    masterVolume,
    connectionQuality,
    connectingUsers,
    error,
    toggleAudio,
    setUserVolume,
    setMasterVolume: setMasterVolumeValue,
    createRoom,
    joinRoom,
    leaveRoom
  };
  
  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  );
};

// Hook para usar o contexto
export const useWebRTC = () => useContext(WebRTCContext);

export default WebRTCContext;
