import React, { useState, useEffect } from 'react';
import { Box, Typography, Slider, IconButton, Paper, Grid, Divider } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { styled } from '@mui/material/styles';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useTranslation } from 'react-i18next';
import UserVolumeControl from './UserVolumeControl';
import ConnectionQualityIndicator from './ConnectionQualityIndicator';

// Estilização para canais de mixer
const MixerChannel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100%',
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)'
  }
}));

// Estilização para o canal master
const MasterChannel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[5]
  }
}));

/**
 * Componente de mesa de mixagem de áudio
 */
const MixerBoard = () => {
  const { 
    users, 
    localUser, 
    userVolumes, 
    masterVolume, 
    setUserVolume, 
    setMasterVolume, 
    audioEnabled, 
    toggleAudio,
    userQualities
  } = useWebRTC();
  const { t } = useTranslation();
  
  // Estado para volume master
  const [masterVolumeState, setMasterVolumeState] = useState(100);
  
  // Atualizar quando o volume master mudar no contexto
  useEffect(() => {
    setMasterVolumeState(masterVolume * 100);
  }, [masterVolume]);
  
  // Lidar com mudança de volume master
  const handleMasterVolumeChange = (event, newValue) => {
    setMasterVolumeState(newValue);
  };
  
  // Atualizar volume master quando o slider for liberado
  const handleMasterVolumeCommitted = (event, newValue) => {
    setMasterVolume(newValue / 100);
  };
  
  // Silenciar/ativar áudio local
  const handleToggleMic = () => {
    toggleAudio(!audioEnabled);
  };
  
  return (
    <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t('mixer.title')}
      </Typography>
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Canais de usuários */}
        {users.map(user => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={user.id}>
            <MixerChannel>
              {/* Cabeçalho do canal */}
              <Box sx={{ mb: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" noWrap sx={{ textAlign: 'center', maxWidth: '80%' }}>
                  {user.name}
                </Typography>
                <ConnectionQualityIndicator userId={user.id} size="small" />
              </Box>
              
              {/* Instrumento */}
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                {user.instrument}
              </Typography>
              
              {/* Controle de volume */}
              <UserVolumeControl
                userId={user.id}
                userName={user.name}
                showLabel={false}
              />
              
              {/* Status do usuário */}
              <Box sx={{ mt: 'auto', pt: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
                {user.id === localUser?.id ? (
                  <IconButton 
                    onClick={handleToggleMic} 
                    color={audioEnabled ? 'primary' : 'error'}
                    size="small"
                  >
                    {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                  </IconButton>
                ) : (
                  <Box sx={{ height: 32 }} /> // Espaçador para manter o alinhamento
                )}
              </Box>
            </MixerChannel>
          </Grid>
        ))}
        
        {/* Canal Master */}
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <MasterChannel>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('mixer.master')}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              width: '100%'
            }}>
              <Box sx={{ mb: 1, mt: 2 }}>
                <IconButton 
                  onClick={() => handleMasterVolumeCommitted(null, masterVolumeState > 0 ? 0 : 100)} 
                  color={masterVolumeState === 0 ? 'error' : 'primary'}
                >
                  {masterVolumeState === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}
                </IconButton>
              </Box>
              
              <Slider
                orientation="vertical"
                value={masterVolumeState}
                onChange={handleMasterVolumeChange}
                onChangeCommitted={handleMasterVolumeCommitted}
                aria-label={t('mixer.masterVolume')}
                valueLabelDisplay="auto"
                step={1}
                min={0}
                max={100}
                sx={{ height: 150, mb: 2 }}
              />
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                {Math.round(masterVolumeState)}%
              </Typography>
            </Box>
          </MasterChannel>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.secondary">
          {t('mixer.poweredBy')} WebRTC P2P
        </Typography>
      </Box>
    </Box>
  );
};

export default MixerBoard;
