import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  IconButton,
  Typography,
  Paper,
  Tooltip,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  Warning,
  ScreenShare,
  StopScreenShare,
  Settings,
  ExitToApp,
  PersonRemove
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRoom } from '../contexts/RoomContext';
import { safeFilter, safe, ensureArray, processParticipants } from '../utils/safeUtils';

function VideoPanel() {
  const { t } = useTranslation();
  const { room, users, socket, isAdmin, admin, leaveRoom, kickUser } = useRoom();
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStatus, setMediaStatus] = useState({
    video: false,
    audio: false,
    videoLoading: false,
    audioLoading: false,
    videoError: null,
    audioError: null
  });
  const videoRefs = useRef({});
  const peerConnections = useRef({});

  const safeUsers = processParticipants(users || []);
  const safeRoom = room || {};
  const safeRoomUserId = safe(safeRoom, 'userId', '');

  const setupLocalStream = useCallback(async () => {
    if (!room?.mediaConfig) return;
    
    const { videoEnabled, audioEnabled, videoDeviceId, audioDeviceId } = room.mediaConfig;

    try {
      const constraints = {
        video: videoEnabled ? { deviceId: videoDeviceId || undefined } : false,
        audio: audioEnabled ? { deviceId: audioDeviceId || undefined } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setMediaStatus(prev => ({
        ...prev,
        video: videoEnabled,
        audio: audioEnabled
      }));

      // Enviar stream para outros usuários
      if (socket) {
        safeFilter(safeUsers, user => user.id !== safeRoomUserId).forEach(user => {
          createPeerConnection(user.id, stream);
        });
      }
    } catch (error) {
      console.error('Erro ao configurar stream local:', error);
      setMediaStatus(prev => ({
        ...prev,
        videoError: videoEnabled ? 'Erro ao acessar câmera' : null,
        audioError: audioEnabled ? 'Erro ao acessar microfone' : null
      }));
    }
  }, [room?.mediaConfig, safeRoomUserId, socket, safeUsers]);

  const createPeerConnection = async (userId, stream) => {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnections.current[userId] = pc;

      // Adicionar tracks ao peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Lidar com ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: userId
          });
        }
      };

      // Receber stream remoto
      pc.ontrack = event => {
        if (videoRefs.current[userId] && videoRefs.current[userId].current) {
          videoRefs.current[userId].current.srcObject = event.streams[0];
        }
      };

      // Criar e enviar oferta
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('video-offer', {
        offer: pc.localDescription,
        to: userId
      });

    } catch (error) {
      console.error('Erro ao criar conexão peer:', error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('video-offer', async ({ offer, from }) => {
        try {
          const pc = peerConnections.current[from] || await createPeerConnection(from, localStream);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('video-answer', {
            answer: pc.localDescription,
            to: from
          });
        } catch (error) {
          console.error('Erro ao processar oferta de vídeo:', error);
        }
      });

      socket.on('video-answer', async ({ answer, from }) => {
        try {
          const pc = peerConnections.current[from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        } catch (error) {
          console.error('Erro ao processar resposta de vídeo:', error);
        }
      });

      socket.on('ice-candidate', async ({ candidate, from }) => {
        try {
          const pc = peerConnections.current[from];
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (error) {
          console.error('Erro ao adicionar ICE candidate:', error);
        }
      });

      return () => {
        socket.off('video-offer');
        socket.off('video-answer');
        socket.off('ice-candidate');
      };
    }
  }, [socket, localStream]);

  useEffect(() => {
    setupLocalStream();
    return () => {
      // Limpar todas as conexões peer
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      
      // Parar todas as tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupLocalStream]);

  const toggleVideo = async () => {
    setMediaStatus(prev => ({ ...prev, videoLoading: true, videoError: null }));
    try {
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: mediaStatus.audio
        });
        setLocalStream(stream);
        setMediaStatus(prev => ({ 
          ...prev, 
          video: true,
          videoLoading: false 
        }));
        return;
      }

      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setMediaStatus(prev => ({ 
          ...prev, 
          video: videoTrack.enabled,
          videoLoading: false 
        }));
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        localStream.addTrack(newVideoTrack);
        setMediaStatus(prev => ({ 
          ...prev, 
          video: true,
          videoLoading: false 
        }));
      }
    } catch (error) {
      console.error('Erro ao alternar vídeo:', error);
      setMediaStatus(prev => ({ 
        ...prev, 
        videoError: 'Erro ao acessar câmera',
        videoLoading: false 
      }));
    }
  };

  const toggleAudio = async () => {
    setMediaStatus(prev => ({ ...prev, audioLoading: true, audioError: null }));
    try {
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: mediaStatus.video
        });
        setLocalStream(stream);
        setMediaStatus(prev => ({ 
          ...prev, 
          audio: true,
          audioLoading: false 
        }));
        return;
      }

      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMediaStatus(prev => ({ 
          ...prev, 
          audio: audioTrack.enabled,
          audioLoading: false 
        }));
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = newStream.getAudioTracks()[0];
        localStream.addTrack(newAudioTrack);
        setMediaStatus(prev => ({ 
          ...prev, 
          audio: true,
          audioLoading: false 
        }));
      }
    } catch (error) {
      console.error('Erro ao alternar áudio:', error);
      setMediaStatus(prev => ({ 
        ...prev, 
        audioError: 'Erro ao acessar microfone',
        audioLoading: false 
      }));
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        screenStream?.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        setIsScreenSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        setScreenStream(stream);
        setIsScreenSharing(true);

        // Enviar stream de tela para outros usuários
        safeFilter(safeUsers, user => user.id !== safeRoomUserId).forEach(user => {
          const pc = peerConnections.current[user.id];
          if (pc) {
            stream.getTracks().forEach(track => {
              pc.addTrack(track, stream);
            });
          }
        });
      }
    } catch (error) {
      console.error('Erro ao compartilhar tela:', error);
    }
  };

  // Inicializar refs de vídeo para cada usuário
  useEffect(() => {
    safeFilter(safeUsers, user => user.id !== safeRoomUserId).forEach(user => {
      if (!videoRefs.current[user.id]) {
        videoRefs.current[user.id] = React.createRef();
      }
    });

    // Limpar refs não utilizadas
    Object.keys(videoRefs.current).forEach(userId => {
      if (!safeUsers.find(u => u.id === userId)) {
        delete videoRefs.current[userId];
      }
    });
  }, [safeUsers]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap',
      gap: 2,
      height: '100%',
      overflow: 'auto',
      p: 2
    }}>
      {safeFilter(safeUsers, user => user.id !== safeRoomUserId).map((user) => (
        <Box 
          key={user.id} 
          sx={{
            width: { xs: '100%', sm: '47%', md: '31%', lg: '23%' },
            height: 200,
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 3
          }}
        >
          <Box
            component="video"
            autoPlay
            playsInline
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: 'black'
            }}
          />
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="body2">
              {safe(user, 'name', 'Usuário')}
            </Typography>
            <Typography variant="caption">
              {safe(user, 'instrument', 'Instrumento')}
            </Typography>
          </Box>
        </Box>
      ))}
      
      {safeFilter(safeUsers, user => user.id !== safeRoomUserId).length === 0 && (
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%'
        }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum outro participante na sala
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default VideoPanel;
