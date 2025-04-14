import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Slider, 
  IconButton, 
  Paper,
  Grid,
  Divider,
  Avatar,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  VolumeUp as VolumeUpIcon, 
  VolumeMute as VolumeMuteIcon,
  OpenInNew as OpenInNewIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon
} from '@mui/icons-material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useTranslation } from 'react-i18next';
import ConnectionQualityIndicator from '../audio/ConnectionQualityIndicator';

// Componente estilizado para canal de mixer
const MixerChannel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4]
  }
}));

// Componente estilizado para canal master
const MasterChannel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  position: 'relative'
}));

/**
 * Componente resumido de mesa de mixagem para o painel lateral
 */
const MixerPanel = ({ onShowFullMixer }) => {
  const { 
    users, 
    localUser, 
    audioEnabled, 
    toggleAudio, 
    userVolumes, 
    setUserVolume, 
    masterVolume, 
    setMasterVolume 
  } = useWebRTC();
  const { t } = useTranslation();

  // Função para alternar mudo/som para um usuário
  const handleToggleUserMute = (userId) => {
    const currentVolume = userVolumes[userId] || 1;
    setUserVolume(userId, currentVolume === 0 ? 1 : 0);
  };

  // Função para alternar mudo/som master
  const handleToggleMasterMute = () => {
    setMasterVolume(masterVolume === 0 ? 1 : 0);
  };
  
  // Ordenar usuários (usuário local primeiro)
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === localUser?.id) return -1;
    if (b.id === localUser?.id) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {t('mixer.compactTitle')}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<OpenInNewIcon />}
          onClick={onShowFullMixer}
        >
          {t('mixer.openFull')}
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('mixer.masterVolume')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            color={masterVolume === 0 ? 'error' : 'primary'}
            onClick={handleToggleMasterMute}
            size="small"
          >
            {masterVolume === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}
          </IconButton>
          
          <Slider
            value={masterVolume * 100}
            onChange={(e, newValue) => setMasterVolume(newValue / 100)}
            aria-labelledby="master-volume-slider"
            size="small"
            sx={{ flexGrow: 1 }}
          />
          
          <Typography variant="body2" sx={{ minWidth: 36, textAlign: 'right' }}>
            {Math.round(masterVolume * 100)}%
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        {t('mixer.channels')}
      </Typography>
      
      <Grid container spacing={2}>
        {sortedUsers.map(user => {
          const isLocalUser = user.id === localUser?.id;
          const userVolume = userVolumes[user.id] || 1;
          
          return (
            <Grid item xs={12} key={user.id}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderColor: isLocalUser ? 'primary.main' : 'divider'
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: isLocalUser ? 'primary.main' : 'secondary.main',
                      fontSize: '1rem'
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <Box sx={{ position: 'absolute', top: -4, right: -4 }}>
                    <ConnectionQualityIndicator userId={user.id} size="small" />
                  </Box>
                </Box>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 'medium' }}>
                    {user.name} {isLocalUser && `(${t('mixer.you')})`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {user.instrument}
                  </Typography>
                </Box>
                
                {isLocalUser ? (
                  <Tooltip title={audioEnabled ? t('audio.micOn') : t('audio.micOff')}>
                    <IconButton
                      size="small"
                      color={audioEnabled ? 'primary' : 'error'}
                      onClick={() => toggleAudio(!audioEnabled)}
                    >
                      {audioEnabled ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                    <IconButton
                      size="small"
                      color={userVolume === 0 ? 'error' : 'default'}
                      onClick={() => handleToggleUserMute(user.id)}
                    >
                      {userVolume === 0 ? <VolumeMuteIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                    </IconButton>
                    
                    <Slider
                      value={userVolume * 100}
                      onChange={(e, newValue) => setUserVolume(user.id, newValue / 100)}
                      aria-labelledby={`${user.id}-volume-slider`}
                      size="small"
                      sx={{ flexGrow: 1 }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onShowFullMixer}
          startIcon={<OpenInNewIcon />}
        >
          {t('mixer.openFullMixer')}
        </Button>
      </Box>
    </Box>
  );
};

export default MixerPanel;
