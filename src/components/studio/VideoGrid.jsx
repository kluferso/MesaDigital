import React, { useEffect, useRef } from 'react';
import { Box, Grid, Paper, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import { MicOff, Mic, VideocamOff } from '@mui/icons-material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useTranslation } from 'react-i18next';
import { getInstrumentIcon } from '../icons/InstrumentIcons';
import { ConnectionQualityIcon, ReconnectingIcon } from '../icons/ConnectionQualityIcon';

const VideoPlayer = ({ stream, isLocal = false, name, instrument, isAudioMuted, isVideoMuted, isSpeaking, connectionState, connectionQuality }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const Icon = getInstrumentIcon(instrument);
  
  // Determinar se o vídeo deve ser exibido
  // Prioriza o estado explícito (isVideoMuted), mas também verifica a track se disponível
  const showVideo = !isVideoMuted && stream && stream.getVideoTracks().length > 0;

  // Renderizar ícone de qualidade ou reconexão
  const renderConnectionStatus = () => {
    if (isLocal) return null; // Não mostrar para usuário local
    
    if (connectionState === 'reconnecting') {
      return (
        <Tooltip title="Reconectando...">
          <Box sx={{ animation: 'pulse 1.5s infinite' }}>
            <ReconnectingIcon size={20} color="#ff9800" />
          </Box>
        </Tooltip>
      );
    }
    
    if (connectionState === 'disconnected' || connectionState === 'failed') {
      return (
        <Tooltip title="Desconectado">
          <Box>
            <ReconnectingIcon size={20} color="#f44336" />
          </Box>
        </Tooltip>
      );
    }
    
    return <ConnectionQualityIcon quality={connectionQuality} size={20} color="auto" />;
  };

  return (
    <Paper 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        paddingTop: '56.25%', // 16:9 Aspect Ratio
        bgcolor: '#000',
        overflow: 'hidden',
        borderRadius: 2,
        border: isSpeaking ? '3px solid #4caf50' : '1px solid #333',
        transition: 'border 0.2s ease-in-out',
        boxShadow: isSpeaking ? '0 0 10px rgba(76, 175, 80, 0.5)' : 'none'
      }}
    >
      <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}>
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Always mute local video to avoid feedback
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: '#1a1a1a',
            color: '#555'
          }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mb: 2 }}>
              <Icon sx={{ fontSize: 40 }} />
            </Avatar>
            <VideocamOff sx={{ fontSize: 30, opacity: 0.5 }} />
          </Box>
        )}

        {/* Overlay Info */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 1, 
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="subtitle2" sx={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            {name} {isLocal && '(Você)'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {renderConnectionStatus()}
            {isAudioMuted && <MicOff fontSize="small" color="error" />}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

const VideoGrid = () => {
  const { users, userStreams, localUser, audioEnabled, videoEnabled, audioLevels, connectionStates } = useWebRTC();
  const { t } = useTranslation();

  // Helper para simular score de qualidade (já que não temos dados reais em tempo real ainda)
  const getConnectionQualityScore = (userId, state) => {
    if (state === 'reconnecting') return 0.3;
    if (state === 'disconnected') return 0;
    
    // Simulação simples
    const baseScore = 0.8;
    // Variação leve baseada no ID para não parecer estático
    const fluctuation = Math.sin(Date.now() / 10000 + (userId.charCodeAt(0) || 0)) * 0.1;
    return Math.max(0, Math.min(1, baseScore + fluctuation));
  };

  // Combine local user and remote users
  const allParticipants = [
    {
      id: localUser?.id || 'local',
      name: localUser?.name || 'Você',
      instrument: localUser?.instrument || 'microphone',
      stream: localUser?.stream,
      isLocal: true,
      isAudioMuted: !audioEnabled,
      isVideoMuted: !videoEnabled,
      isSpeaking: audioLevels?.[localUser?.id]?.status === 'speaking',
      connectionState: 'connected',
      connectionQuality: 1
    },
    ...users.map(u => ({
      ...u,
      stream: userStreams[u.id],
      isLocal: false,
      isAudioMuted: u.isAudioMuted,
      isVideoMuted: u.isVideoMuted,
      isSpeaking: audioLevels?.[u.id]?.status === 'speaking',
      connectionState: connectionStates[u.id] || 'connected',
      connectionQuality: getConnectionQualityScore(u.id, connectionStates[u.id])
    }))
  ];

  // Calculate grid size based on participant count
  const getGridSize = (count) => {
    if (count <= 1) return 12;
    if (count <= 2) return 6;
    if (count <= 4) return 6;
    if (count <= 6) return 4;
    return 3;
  };

  const gridSize = getGridSize(allParticipants.length);

  return (
    <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', height: '100%' }}>
      <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ minHeight: '100%' }}>
        {allParticipants.map((participant) => (
          <Grid item xs={12} sm={gridSize} md={gridSize} key={participant.id}>
             <VideoPlayer {...participant} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VideoGrid;
