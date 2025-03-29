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
        users.forEach(user => {
          if (user.id !== room.userId) {
            createPeerConnection(user.id, stream);
          }
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
  }, [room?.mediaConfig, room?.userId, socket, users]);

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
        users.forEach(user => {
          if (user.id !== room.userId) {
            const pc = peerConnections.current[user.id];
            if (pc) {
              stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Erro ao compartilhar tela:', error);
    }
  };

  // Inicializar refs de vídeo para cada usuário
  useEffect(() => {
    users.forEach(user => {
      if (!videoRefs.current[user.id]) {
        videoRefs.current[user.id] = React.createRef();
      }
    });

    // Limpar refs não utilizadas
    Object.keys(videoRefs.current).forEach(userId => {
      if (!users.find(u => u.id === userId)) {
        delete videoRefs.current[userId];
      }
    });
  }, [users]);

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* Vídeo Local */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              position: 'relative',
              aspectRatio: '16/9',
              overflow: 'hidden',
              bgcolor: 'background.default'
            }}
          >
            {localStream && mediaStatus.video ? (
              <video
                autoPlay
                muted
                playsInline
                ref={video => {
                  if (video) video.srcObject = localStream;
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                <VideocamOff sx={{ fontSize: 48, opacity: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {mediaStatus.videoError || t('room.video.disabled')}
                </Typography>
              </Box>
            )}

            {/* Controles de Mídia */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 2,
                p: 1
              }}
            >
              <Tooltip title={mediaStatus.video ? t('room.controls.disableVideo') : t('room.controls.enableVideo')}>
                <IconButton
                  onClick={toggleVideo}
                  disabled={mediaStatus.videoLoading}
                  color={mediaStatus.video ? 'primary' : 'default'}
                >
                  {mediaStatus.videoLoading ? (
                    <CircularProgress size={24} />
                  ) : mediaStatus.video ? (
                    <Videocam />
                  ) : (
                    <VideocamOff />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title={mediaStatus.audio ? t('room.controls.disableAudio') : t('room.controls.enableAudio')}>
                <IconButton
                  onClick={toggleAudio}
                  disabled={mediaStatus.audioLoading}
                  color={mediaStatus.audio ? 'primary' : 'default'}
                >
                  {mediaStatus.audioLoading ? (
                    <CircularProgress size={24} />
                  ) : mediaStatus.audio ? (
                    <Mic />
                  ) : (
                    <MicOff />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title={isScreenSharing ? t('room.controls.stopSharing') : t('room.controls.startSharing')}>
                <IconButton
                  onClick={toggleScreenShare}
                  color={isScreenSharing ? 'primary' : 'default'}
                >
                  {isScreenSharing ? (
                    <StopScreenShare />
                  ) : (
                    <ScreenShare />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title={t('room.controls.settings')}>
                <IconButton onClick={() => {/* Implementar configurações */}}>
                  <Settings />
                </IconButton>
              </Tooltip>

              <Box sx={{ borderLeft: 1, mx: 1, borderColor: 'rgba(255,255,255,0.3)' }} />

              <Tooltip title={t('room.leave')}>
                <IconButton
                  onClick={leaveRoom}
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.dark',
                      color: 'white'
                    }
                  }}
                >
                  <ExitToApp />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Indicadores de Erro */}
            {(mediaStatus.videoError || mediaStatus.audioError) && (
              <Tooltip title={mediaStatus.videoError || mediaStatus.audioError}>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.dark'
                    }
                  }}
                >
                  <Warning />
                </IconButton>
              </Tooltip>
            )}
          </Paper>
        </Grid>

        {/* Vídeos dos outros participantes */}
        {users.filter(user => user.id !== room?.userId).map((user) => (
          <Grid item xs={12} md={6} key={user.id}>
            <Paper
              elevation={3}
              sx={{
                position: 'relative',
                aspectRatio: '16/9',
                overflow: 'hidden',
                bgcolor: 'background.default'
              }}
            >
              <video
                ref={videoRefs.current[user.id]}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: user.hasVideo ? 'block' : 'none'
                }}
              />
              
              {!user.hasVideo && (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  <VideocamOff sx={{ fontSize: 48, opacity: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('room.video.noVideo')}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography variant="body2">
                  {user.name}
                  {user.id === admin?.id && (
                    <Chip
                      size="small"
                      label={t('room.admin')}
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {user.hasAudio && (
                  <Tooltip title={t('room.video.audioActive')}>
                    <Mic fontSize="small" />
                  </Tooltip>
                )}
                {isAdmin && user.id !== admin?.id && (
                  <Tooltip title={t('room.kickUser')}>
                    <IconButton
                      size="small"
                      onClick={() => kickUser(user.id)}
                      sx={{
                        color: 'error.main',
                        '&:hover': {
                          bgcolor: 'error.dark',
                          color: 'white'
                        }
                      }}
                    >
                      <PersonRemove fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default VideoPanel;
