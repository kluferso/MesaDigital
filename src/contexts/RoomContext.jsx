import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketContext';

const RoomContext = createContext();

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}

export function RoomProvider({ children }) {
  const [room, setRoom] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // Limpa o estado quando a conexão cai
  useEffect(() => {
    if (!isConnected) {
      setRoom(null);
      setRoomId(null);
      setParticipants([]);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      setLocalStream(null);
      setRemoteStreams({});
      setMessages([]);
    }
  }, [isConnected, localStream]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('create_room_success', (data) => {
      console.log('Room created:', data);
      setRoom(data.room);
      setRoomId(data.room.id);
      setParticipants(data.room.users || []);
      setIsAdmin(true);
    });

    socket.on('join_room_success', (data) => {
      console.log('Joined room:', data);
      setRoom(data.room);
      setRoomId(data.room.id);
      setParticipants(data.room.users || []);
      setIsAdmin(false);
    });

    socket.on('user_joined', ({ user }) => {
      setParticipants(prev => [...prev, user]);
    });

    socket.on('user_left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    return () => {
      socket.off('create_room_success');
      socket.off('join_room_success');
      socket.off('user_joined');
      socket.off('user_left');
    };
  }, [socket]);

  const createRoom = useCallback(async (roomData) => {
    try {
      if (!socket || !isConnected) {
        throw new Error('Socket não conectado');
      }

      // Emite evento de criação de sala
      socket.emit('create_room', {
        ...roomData,
        isAdmin: true // Marca o criador como admin
      });

      // Aguarda resposta do servidor
      const response = await new Promise((resolve, reject) => {
        socket.once('create_room_success', resolve);
        socket.once('create_room_error', reject);
        
        // Timeout após 5 segundos
        setTimeout(() => reject(new Error('Timeout ao criar sala')), 5000);
      });

      console.log('Room created:', response);
      return response;

    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }, [socket, isConnected]);

  const joinRoom = useCallback(async (roomData) => {
    try {
      if (!socket || !isConnected) {
        throw new Error('Socket não conectado');
      }

      // Emite evento para entrar na sala
      socket.emit('join_room', {
        ...roomData,
        isAdmin: false // Participante normal
      });

      // Aguarda resposta do servidor
      const response = await new Promise((resolve, reject) => {
        socket.once('join_room_success', resolve);
        socket.once('join_room_error', reject);
        
        // Timeout após 5 segundos
        setTimeout(() => reject(new Error('Timeout ao entrar na sala')), 5000);
      });

      console.log('Joined room:', response);
      return response;

    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }, [socket, isConnected]);

  const leaveRoom = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStreams({});
    setParticipants([]);
    setRoomId(null);
    setRoom(null);
    setMessages([]);
    
    if (socket && isConnected) {
      socket.emit('leave_room', { roomId });
    }
    
    navigate('/');
  }, [localStream, socket, isConnected, roomId, navigate]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        if (socket && isConnected) {
          socket.emit('toggle_audio', { enabled: audioTrack.enabled });
        }
      }
    }
  }, [localStream, socket, isConnected]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        if (socket && isConnected) {
          socket.emit('toggle_video', { enabled: videoTrack.enabled });
        }
      }
    }
  }, [localStream, socket, isConnected]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        localStream.getTracks().forEach(track => {
          if (track.kind === 'video') {
            track.stop();
          }
        });
        
        // Get new video stream
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnections.current[remotePeerId]
          .getSenders()
          .find(s => s.track.kind === 'video');
          
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
        
        setLocalStream(prev => {
          prev.getVideoTracks().forEach(track => track.stop());
          return newStream;
        });
        
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        const sender = peerConnections.current[remotePeerId]
          .getSenders()
          .find(s => s.track.kind === 'video');
          
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
        
        setLocalStream(prev => {
          prev.getVideoTracks().forEach(track => track.stop());
          return screenStream;
        });
      }
      
      setIsScreenSharing(!isScreenSharing);
      
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenSharing, localStream]);

  const value = {
    room,
    roomId,
    participants,
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    messages,
    error,
    isAdmin,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}
