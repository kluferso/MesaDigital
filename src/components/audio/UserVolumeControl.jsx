import React, { useState, useEffect } from 'react';
import { Box, Slider, Typography, IconButton, Tooltip } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useTranslation } from 'react-i18next';

/**
 * Componente de controle de volume para um usuário específico
 */
const UserVolumeControl = ({ userId, userName, orientation = 'vertical', showLabel = true, size = 'medium' }) => {
  const { userVolumes, setUserVolume } = useWebRTC();
  const { t } = useTranslation();
  
  // Volume atual (0-100)
  const [volume, setVolume] = useState(100);
  
  // Atualizar volume local quando o volume no contexto mudar
  useEffect(() => {
    if (userVolumes[userId] !== undefined) {
      setVolume(userVolumes[userId] * 100);
    }
  }, [userVolumes, userId]);
  
  // Lidar com mudança de volume
  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
  };
  
  // Atualizar volume quando o slider for liberado
  const handleChangeCommitted = (event, newValue) => {
    setUserVolume(userId, newValue / 100);
  };
  
  // Alternar entre mudo e volume anterior
  const [previousVolume, setPreviousVolume] = useState(100);
  
  const toggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      handleChangeCommitted(null, 0);
    } else {
      handleChangeCommitted(null, previousVolume);
    }
  };
  
  // Ícone baseado no nível de volume
  const getVolumeIcon = () => {
    if (volume === 0) {
      return <VolumeMuteIcon fontSize={size} />;
    } else if (volume <= 50) {
      return <VolumeDownIcon fontSize={size} />;
    } else {
      return <VolumeUpIcon fontSize={size} />;
    }
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: orientation === 'vertical' ? 'column' : 'row',
      alignItems: 'center',
      gap: 1
    }}>
      {showLabel && (
        <Typography variant="body2" color="text.secondary" noWrap 
          sx={{ 
            maxWidth: orientation === 'vertical' ? 100 : 'auto',
            textAlign: orientation === 'vertical' ? 'center' : 'left'
          }}
        >
          {userName || userId}
        </Typography>
      )}
      
      <IconButton 
        onClick={toggleMute} 
        size={size} 
        color={volume === 0 ? 'error' : 'default'}
        sx={{ 
          padding: size === 'small' ? 0.5 : 1 
        }}
      >
        <Tooltip title={volume === 0 ? t('volume.unmute') : t('volume.mute')}>
          {getVolumeIcon()}
        </Tooltip>
      </IconButton>
      
      <Slider
        orientation={orientation}
        value={volume}
        onChange={handleVolumeChange}
        onChangeCommitted={handleChangeCommitted}
        aria-label={t('volume.control', { user: userName || userId })}
        valueLabelDisplay="auto"
        step={1}
        min={0}
        max={100}
        size={size}
        sx={{
          height: orientation === 'vertical' ? 100 : 'auto',
          width: orientation === 'vertical' ? 'auto' : 100,
          '& .MuiSlider-thumb': {
            width: size === 'small' ? 12 : 16,
            height: size === 'small' ? 12 : 16,
          }
        }}
      />
    </Box>
  );
};

export default UserVolumeControl;
