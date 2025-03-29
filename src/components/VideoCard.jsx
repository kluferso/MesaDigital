import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
} from '@mui/icons-material';
import { useWebRTC } from '../hooks/useWebRTC';
import { useTranslation } from 'react-i18next';

function VideoCard({ user, stream, isLocal }) {
  const theme = useTheme();
  const videoRef = useRef(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const { toggleTrack, startScreenShare, stopScreenShare } = useWebRTC();
  const { t } = useTranslation();

  // Verificar disponibilidade da câmera
  useEffect(() => {
    if (isLocal) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
          setHasCamera(hasVideoDevice);
        })
        .catch(err => {
          console.error('Erro ao verificar dispositivos:', err);
          setHasCamera(false);
        });
    }
  }, [isLocal]);

  // Configurar vídeo e estado inicial
  useEffect(() => {
    if (!stream) return;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('[VideoCard] Erro ao reproduzir vídeo:', err);
      });
    }

    // Configurar estado inicial dos tracks
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    if (videoTrack) {
      setVideoEnabled(videoTrack.enabled);
    }
    if (audioTrack) {
      setAudioEnabled(audioTrack.enabled);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  const handleAudioToggle = () => {
    if (!stream || !isLocal) return;
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    toggleTrack('audio', newState);
  };

  const handleVideoToggle = () => {
    if (!stream || !isLocal) return;
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    toggleTrack('video', newState);
  };

  const handleScreenShare = async () => {
    if (!isLocal) return;
    
    try {
      if (!isScreenSharing) {
        await startScreenShare();
        setIsScreenSharing(true);
      } else {
        await stopScreenShare();
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Erro ao compartilhar tela:', error);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        position: 'relative',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
    >
      {/* Container do vídeo */}
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isLocal ? 'scaleX(-1)' : 'none',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              color: 'text.secondary',
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" gutterBottom>
              {isLocal && !hasCamera
                ? t('room.noCameraFound')
                : t('room.videoDisabled')}
            </Typography>
            {isLocal && !hasCamera && (
              <Typography variant="caption" color="text.secondary">
                {t('room.enableCameraInstructions')}
              </Typography>
            )}
          </Box>
        )}

        {/* Overlay quando vídeo está desabilitado */}
        {stream && !videoEnabled && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
            }}
          >
            <Typography>{t('room.videoDisabled')}</Typography>
          </Box>
        )}

        {/* Nome do usuário */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            color: 'white',
          }}
        >
          <Typography variant="subtitle1">
            {user?.name || t('room.unknownUser')}
            {isLocal && ` (${t('room.you')})`}
          </Typography>
          {user?.instrument && (
            <Typography variant="caption">
              {user.instrument}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Controles de mídia */}
      {isLocal && (
        <Box
          sx={{
            p: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Tooltip title={audioEnabled ? t('room.muteAudio') : t('room.unmuteAudio')}>
            <IconButton
              size="small"
              onClick={handleAudioToggle}
              color={audioEnabled ? 'primary' : 'error'}
            >
              {audioEnabled ? <Mic /> : <MicOff />}
            </IconButton>
          </Tooltip>

          <Tooltip title={videoEnabled ? t('room.disableVideo') : t('room.enableVideo')}>
            <IconButton
              size="small"
              onClick={handleVideoToggle}
              color={videoEnabled ? 'primary' : 'error'}
            >
              {videoEnabled ? <Videocam /> : <VideocamOff />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isScreenSharing ? t('room.stopSharing') : t('room.startSharing')}>
            <IconButton
              size="small"
              onClick={handleScreenShare}
              color={isScreenSharing ? 'primary' : 'inherit'}
            >
              {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Paper>
  );
}

export default VideoCard;
