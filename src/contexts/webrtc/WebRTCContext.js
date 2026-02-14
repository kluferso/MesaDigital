/**
 * WebRTCContext.js
 * Contexto React para gerenciar WebRTC na aplicação
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';
import RoomManager from '../../services/webrtc/RoomManager';
import ConnectionMonitor from '../../services/connection/ConnectionMonitor';

// Criar contexto
const WebRTCContext = createContext();

// Hook para usar o contexto
export const useWebRTC = () => useContext(WebRTCContext);

export const WebRTCProvider = ({ children }) => {
  const { socket, connected } = useSocket();
  const [roomManager, setRoomManager] = useState(null);
  const [connectionMonitor, setConnectionMonitor] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [users, setUsers] = useState([]);
  const [userStreams, setUserStreams] = useState({});
  const [localUser, setLocalUser] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [musicMode, setMusicMode] = useState(false);
  const [audioLevels, setAudioLevels] = useState({});
  const [userVolumes, setUserVolumes] = useState({});
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [userQualities, setUserQualities] = useState({});
  const [connectionStates, setConnectionStates] = useState({});
  const [error, setError] = useState(null);
  const [connectingUsers, setConnectingUsers] = useState([]);
  const [reconnectingUsers, setReconnectingUsers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [lastRecording, setLastRecording] = useState(null);

  // Inicializar RoomManager quando o socket estiver conectado
  useEffect(() => {
    if (!connected || !socket) {
      setIsInitialized(false);
      setError('Socket não conectado');
      return;
    }

    let isMounted = true;
    const init = async () => {
      try {
        // Aguardar um momento para garantir que o socket está completamente conectado
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!isMounted) return;

        // Verificar novamente se o socket ainda está conectado
        if (!socket.connected) {
          throw new Error('Socket desconectado durante inicialização');
        }

        // Criar novo RoomManager
        const manager = new RoomManager(socket);

        // Configurar event handlers
        manager.on('onInitialized', () => {
          console.log('RoomManager inicializado');
          if (isMounted) {
            setIsInitialized(true);
            setError(null);
          }
        });

        manager.on('onRoomCreated', ({ roomId, userId }) => {
          console.log(`Sala criada: ${roomId}, usuário: ${userId}`);
          setRoomId(roomId);
          setInRoom(true);
        });

        manager.on('onRoomJoined', ({ roomId, userId }) => {
          console.log(`Entrou na sala: ${roomId}, usuário: ${userId}`);
          setRoomId(roomId);
          setInRoom(true);
        });

        manager.on('onRoomLeft', () => {
          console.log('Saiu da sala');
          setRoomId(null);
          setInRoom(false);
          setUsers([]);
          setUserStreams({});
          setUserQualities({});
          setUserVolumes({});
        });

        manager.on('onUserJoined', ({ user }) => {
          console.log(`Usuário entrou: ${user.name} (${user.id})`);
          setUsers(prev => {
            const existing = prev.find(u => u.id === user.id);
            if (existing) return prev;
            return [...prev, user];
          });

          // Adicionar à lista de usuários conectando
          setConnectingUsers(prev => [...prev, user.id]);
        });

        manager.on('onUserLeft', ({ userId, userName }) => {
          console.log(`Usuário saiu: ${userName} (${userId})`);
          setUsers(prev => prev.filter(user => user.id !== userId));

          // Remover stream do usuário
          setUserStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });

          // Remover usuário das listas
          setUserVolumes(prev => {
            const newVolumes = { ...prev };
            delete newVolumes[userId];
            return newVolumes;
          });

          setUserQualities(prev => {
            const newQualities = { ...prev };
            delete newQualities[userId];
            return newQualities;
          });

          setConnectingUsers(prev => prev.filter(id => id !== userId));
        });

        manager.on('onUserMediaReceived', ({ userId, stream }) => {
          console.log(`Recebeu mídia do usuário: ${userId}`);
          
          if (stream) {
            setUserStreams(prev => ({
              ...prev,
              [userId]: stream
            }));
          }

          // Remover da lista de usuários conectando
          setConnectingUsers(prev => prev.filter(id => id !== userId));
        });

        manager.on('onConnectionStateChange', ({ userId, state }) => {
          console.log(`Estado da conexão com ${userId}: ${state}`);
          if (state === 'connected') {
            // Usuário conectado
            setConnectingUsers(prev => prev.filter(id => id !== userId));
          }
        });

        manager.on('onQualityChange', ({ userId, score, category }) => {
          setUserQualities(prev => ({
            ...prev,
            [userId]: { score, category }
          }));
        });

        manager.on('onAudioAnalysis', ({ userId, level, status }) => {
          // Atualizar níveis de áudio (VU Meter)
          // Nota: O AudioProcessor deve limitar a frequência desses eventos
          setAudioLevels(prev => ({
            ...prev,
            [userId]: { level, status }
          }));
        });

        manager.on('onMusicModeChanged', ({ enabled }) => {
          console.log(`Contexto: Modo música alterado para ${enabled}`);
          setMusicMode(enabled);
        });

        manager.on('onRecordingStarted', () => {
          console.log('Contexto: Gravação iniciada');
          setIsRecording(true);
        });

        manager.on('onRecordingFinished', (data) => {
          console.log('Contexto: Gravação finalizada', data);
          setIsRecording(false);
          setLastRecording(data);
        });

        manager.on('onError', (error) => {
          console.error('Erro no RoomManager:', error);
          setError(error.message || 'Erro desconhecido');
        });

        // Inicializar
        await manager.initialize();

        if (!isMounted) return;

        // Criar e inicializar o monitor de conexão
        const monitor = new ConnectionMonitor(manager, socket);

        // Configurar event handlers para o monitor
        monitor.on('onQualityChange', ({ userId, score, category, details }) => {
          if (isMounted) {
            setUserQualities(prev => ({
              ...prev,
              [userId]: { score, category, details }
            }));
          }
        });

        monitor.on('onConnectionStateChange', ({ userId, state }) => {
          if (isMounted) {
            setConnectionStates(prev => ({
              ...prev,
              [userId]: state
            }));

            // Atualizar lista de usuários reconectando
            if (state === 'reconnecting') {
              setReconnectingUsers(prev => {
                if (!prev.includes(userId)) {
                  return [...prev, userId];
                }
                return prev;
              });
            } else {
              setReconnectingUsers(prev => prev.filter(id => id !== userId));
            }
          }
        });

        // Inicializar o monitor
        await monitor.initialize();

        // Salvar referências
        setRoomManager(manager);
        setConnectionMonitor(monitor);
      } catch (error) {
        console.error('Erro ao inicializar RoomManager:', error);
        if (isMounted) {
          setError('Falha ao inicializar WebRTC: ' + error.message);
          setIsInitialized(false);
        }
      }
    };

    // Iniciar apenas quando o socket estiver conectado
    if (socket.connected) {
      init();
    } else {
      // Configurar um listener para quando o socket conectar
      const handleConnect = () => {
        console.log('Socket conectado, iniciando WebRTC...');
        init();
      };

      socket.on('connect', handleConnect);

      return () => {
        socket.off('connect', handleConnect);
      };
    }

    return () => {
      isMounted = false;
      // Cleanup
      if (roomManager) {
        if (inRoom) {
          roomManager.leaveRoom();
        }
      }
    };
  }, [socket, connected]);

  // Atualizar lista de usuários quando o roomManager for atualizado
  useEffect(() => {
    if (!roomManager || !inRoom) return;

    const updateUsers = () => {
      const userList = Array.from(roomManager.users.values());
      setUsers(userList);

      // Atualizar usuário local
      if (roomManager.localUser) {
        setLocalUser(roomManager.localUser);
      }
    };

    updateUsers();
  }, [roomManager, inRoom]);

  // Listeners para eventos de áudio/vídeo
  useEffect(() => {
    if (!socket || !inRoom) return;

    const handleAudioToggled = ({ userId, enabled }) => {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isAudioMuted: !enabled } : u
      ));
    };

    const handleVideoToggled = ({ userId, enabled }) => {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isVideoMuted: !enabled } : u
      ));
    };

    socket.on('user_audio_toggled', handleAudioToggled);
    socket.on('user_video_toggled', handleVideoToggled);

    return () => {
      socket.off('user_audio_toggled', handleAudioToggled);
      socket.off('user_video_toggled', handleVideoToggled);
    };
  }, [socket, inRoom]);

  // Funções expostas pelo contexto
  const createRoom = async (name, instrument) => {
    if (!isInitialized || !roomManager) {
      throw new Error('RoomManager não inicializado');
    }

    try {
      const room = await roomManager.createRoom(name, instrument);

      // Atualizar usuário local
      setLocalUser(roomManager.localUser);

      return room;
    } catch (error) {
      setError('Erro ao criar sala: ' + error.message);
      throw error;
    }
  };

  const joinRoom = async (roomId, name, instrument) => {
    if (!isInitialized || !roomManager) {
      throw new Error('RoomManager não inicializado');
    }

    try {
      const room = await roomManager.joinRoom(roomId, name, instrument);

      // Atualizar usuário local
      setLocalUser(roomManager.localUser);

      return room;
    } catch (error) {
      setError('Erro ao entrar na sala: ' + error.message);
      throw error;
    }
  };

  const leaveRoom = () => {
    if (!isInitialized || !roomManager || !inRoom) {
      return;
    }

    roomManager.leaveRoom();
  };

  const toggleAudio = (enabled) => {
    if (!isInitialized || !roomManager) {
      return false;
    }

    const result = roomManager.toggleAudio(enabled);
    if (result) {
      setAudioEnabled(enabled);
      if (socket && inRoom && roomId) {
        socket.emit('toggle_audio', { roomId, enabled });
      }
    }
    return result;
  };

  const toggleVideo = (enabled) => {
    if (!isInitialized || !roomManager) {
      return false;
    }

    const result = roomManager.toggleVideo(enabled);
    if (result) {
      setVideoEnabled(enabled);
      if (socket && inRoom && roomId) {
        socket.emit('toggle_video', { roomId, enabled });
      }
    }
    return result;
  };

  const toggleMusicMode = async (enabled) => {
    if (!isInitialized || !roomManager) {
      return false;
    }
    await roomManager.setMusicMode(enabled);
    // O estado musicMode será atualizado via callback onMusicModeChanged
    return true;
  };

  const setUserVolume = (userId, volume) => {
    if (!isInitialized || !roomManager) {
      return false;
    }

    const result = roomManager.setUserVolume(userId, volume);
    if (result) {
      setUserVolumes(prev => ({
        ...prev,
        [userId]: volume
      }));
    }
    return result;
  };

  const setGlobalMasterVolume = (volume) => {
    if (!isInitialized || !roomManager) {
      return false;
    }

    const result = roomManager.setMasterVolume(volume);
    if (result) {
      setMasterVolume(volume);
    }
    return result;
  };

  const sendChatMessage = (message) => {
    if (!isInitialized || !roomManager || !inRoom) {
      return false;
    }

    return roomManager.sendChatMessage(message);
  };

  const shareFile = async (file) => {
    if (!isInitialized || !roomManager || !inRoom) {
      throw new Error('Não conectado à sala');
    }
    return roomManager.shareFile(file);
  };


  const getConnectionQuality = (userId) => {
    if (!isInitialized || !roomManager) {
      return null;
    }

    return roomManager.getConnectionQuality(userId);
  };

  const startRecording = () => {
    if (!isInitialized || !roomManager) {
      return false;
    }
    return roomManager.startRecording();
  };

  const stopRecording = () => {
    if (!isInitialized || !roomManager) {
      return false;
    }
    return roomManager.stopRecording();
  };

  const clearLastRecording = () => {
    setLastRecording(null);
  };

  // Funções de simulação/DevTools
  const addFakeUser = (user) => {
    setUsers(prev => [...prev, user]);
  };

  const removeFakeUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setAudioLevels(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const simulateAudioLevel = (userId, level) => {
    setAudioLevels(prev => ({
      ...prev,
      [userId]: { level, status: level > 0.05 ? 'speaking' : 'silence' }
    }));
  };

  return (
    <WebRTCContext.Provider
      value={{
        isInitialized,
        inRoom,
    roomId,
    users,
    userStreams,
    localUser,
    audioEnabled,
        videoEnabled,
        musicMode,
        audioLevels,
        userVolumes,
        masterVolume,
        userQualities,
        connectionStates,
        error,
        connectingUsers,
        reconnectingUsers,
        isRecording,
        lastRecording,
        createRoom,
        joinRoom,
        leaveRoom,
        toggleAudio,
        toggleVideo,
        toggleMusicMode,
        startRecording,
        stopRecording,
        clearLastRecording,
        setUserVolume,
        setMasterVolume: setGlobalMasterVolume,
        sendChatMessage,
        shareFile,
        getConnectionQuality,
        getConnectionState: (userId) => connectionStates[userId] || 'unknown',
        // DevTools helpers
        addFakeUser,
        removeFakeUser,
        simulateAudioLevel
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

export default WebRTCContext;
