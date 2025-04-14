import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
  Slider,
  Fade,
  Zoom,
  Badge,
  useTheme
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeMute as VolumeMuteIcon,
  VolumeUp as VolumeUpIcon,
  Refresh as RefreshIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon
} from '@mui/icons-material';
import { ConnectionQualityIcon, ReconnectingIcon } from '../icons/ConnectionQualityIcon';
import { useTranslation } from 'react-i18next';

/**
 * Cartão que exibe informações de um participante da sala
 */
const ParticipantCard = ({
  user,
  isLocal = false,
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onVolumeChange,
  volume = 1,
  isMuted = false,
  connectionQuality = { score: 1 },
  connectionState = 'connected',
  onReconnect,
  isVideoActive = false,
  videoRef = null,
  compact = false,
  instrument = null,
  colorAccent = null
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Usar cor do instrumento se disponível
  const avatarColor = colorAccent || 
    (isLocal ? theme.palette.primary.main : theme.palette.secondary.main);
  
  // Determinar ícone de estado de conexão
  const renderConnectionState = () => {
    if (connectionState === 'reconnecting') {
      return (
        <Tooltip title={t('connection.reconnecting')} arrow>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <ReconnectingIcon size={16} color={theme.palette.warning.main} />
            }
          >
            <ConnectionQualityIcon
              quality={connectionQuality.score || 0}
              color="auto"
              size={24}
              showTooltip
            />
          </Badge>
        </Tooltip>
      );
    } else if (connectionState === 'disconnected') {
      return (
        <Tooltip title={t('connection.disconnected')} arrow>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: theme.palette.error.main,
                  border: `2px solid ${theme.palette.background.paper}`
                }}
              />
            }
          >
            <ConnectionQualityIcon
              quality={0}
              color="#F44336"
              size={24}
              showTooltip
            />
          </Badge>
        </Tooltip>
      );
    }
    
    return (
      <ConnectionQualityIcon
        quality={connectionQuality.score || 1}
        color="auto"
        size={24}
        showTooltip
      />
    );
  };
  
  // Card compacto (para layout mobile)
  if (compact) {
    return (
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          gap: 1,
          borderRadius: 2,
          borderLeft: `3px solid ${avatarColor}`,
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[3]
          }
        }}
      >
        <Avatar
          sx={{
            bgcolor: avatarColor,
            width: 36,
            height: 36
          }}
        >
          {user?.name?.charAt(0).toUpperCase() || '?'}
        </Avatar>
        
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap fontWeight="medium">
            {user?.name || t('participant.unknown')}
          </Typography>
          <Chip
            label={user?.instrument || instrument || t('instrument.unknown')}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {isLocal ? (
            <IconButton
              size="small"
              color={audioEnabled ? 'primary' : 'error'}
              onClick={onToggleAudio}
            >
              {audioEnabled ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
            </IconButton>
          ) : (
            <IconButton
              size="small"
              color={isMuted ? 'error' : 'default'}
              onClick={() => onVolumeChange(isMuted ? 1 : 0)}
            >
              {isMuted ? <VolumeMuteIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
            </IconButton>
          )}
          
          {renderConnectionState()}
        </Box>
      </Paper>
    );
  }
  
  // Card normal
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        border: isLocal ? `2px solid ${theme.palette.primary.main}` : 'none',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[6]
        }
      }}
    >
      {/* Vídeo do participante (se ativo) */}
      {isVideoActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            '& video': {
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
          />
          
          {/* Overlay gradiente para melhorar legibilidade dos controles */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)'
            }}
          />
        </Box>
      )}
      
      {/* Indicador de qualidade de conexão */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        {renderConnectionState()}
      </Box>
      
      {/* Avatar e informações */}
      <Zoom in={true} style={{ transitionDelay: '150ms' }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            backgroundColor: avatarColor,
            mb: 1,
            fontSize: '2rem',
            zIndex: 1
          }}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
        </Avatar>
      </Zoom>
      
      <Typography
        variant="h6"
        gutterBottom
        noWrap
        sx={{
          maxWidth: '100%',
          color: isVideoActive ? 'white' : 'inherit',
          zIndex: 1,
          textShadow: isVideoActive ? '0 1px 3px rgba(0,0,0,0.8)' : 'none'
        }}
      >
        {user?.name || t('participant.unknown')}
      </Typography>
      
      <Fade in={true} style={{ transitionDelay: '300ms' }}>
        <Chip
          label={user?.instrument || instrument || t('instrument.unknown')}
          color="primary"
          variant="outlined"
          size="small"
          sx={{
            mb: 2,
            color: isVideoActive ? 'white' : 'inherit',
            borderColor: isVideoActive ? 'rgba(255,255,255,0.5)' : 'inherit',
            zIndex: 1
          }}
        />
      </Fade>
      
      {/* Controles de áudio/vídeo */}
      <Box
        sx={{
          mt: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          zIndex: 1
        }}
      >
        {!isLocal && (
          <Box 
            sx={{ 
              width: '80%', 
              display: showVolumeSlider ? 'block' : 'none',
              mb: 1
            }}
          >
            <Slider
              value={volume * 100}
              onChange={(_, newValue) => onVolumeChange(newValue / 100)}
              aria-labelledby="volume-slider"
              size="small"
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${value}%`}
            />
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isLocal ? (
            <>
              <IconButton
                color={audioEnabled ? 'primary' : 'error'}
                onClick={onToggleAudio}
              >
                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
              
              <IconButton
                color={videoEnabled ? 'primary' : 'error'}
                onClick={onToggleVideo}
              >
                {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                onClick={() => setShowVolumeSlider(prev => !prev)}
                color={isMuted ? 'error' : 'default'}
              >
                {isMuted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
              </IconButton>
              
              {connectionState !== 'connected' && (
                <IconButton
                  color="warning"
                  onClick={onReconnect}
                >
                  <RefreshIcon />
                </IconButton>
              )}
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ParticipantCard;
