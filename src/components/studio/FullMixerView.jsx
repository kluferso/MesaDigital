import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Slider,
  IconButton,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  Close,
  SettingsInputComponent,
  Equalizer,
  MusicNote
} from '@mui/icons-material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';

/**
 * Componente para visualização completa do mixer digital
 * Permite ajustar volumes individuais e configurações de áudio
 */
const FullMixerView = ({ onClose }) => {
  const theme = useTheme();
  const { users, setUserVolume, masterVolume, setMasterVolume } = useWebRTC();
  const [volumes, setVolumes] = useState({});
  const [muted, setMuted] = useState({});
  const [showEqualizer, setShowEqualizer] = useState(false);
  
  // Inicializar volumes
  useEffect(() => {
    const initialVolumes = {};
    const initialMuted = {};
    
    users.forEach(user => {
      initialVolumes[user.id] = user.volume || 1.0;
      initialMuted[user.id] = user.muted || false;
    });
    
    setVolumes(initialVolumes);
    setMuted(initialMuted);
  }, [users]);
  
  // Lidar com mudança de volume
  const handleVolumeChange = (userId, value) => {
    const newVolumes = { ...volumes, [userId]: value };
    setVolumes(newVolumes);
    setUserVolume(userId, value);
  };
  
  // Lidar com mute
  const handleToggleMute = (userId) => {
    const newMuted = { ...muted, [userId]: !muted[userId] };
    setMuted(newMuted);
    setUserVolume(userId, newMuted[userId] ? 0 : volumes[userId]);
  };
  
  // Lidar com mudança de volume master
  const handleMasterVolumeChange = (event, value) => {
    setMasterVolume(value);
  };
  
  // Obter cor do slider baseado no valor
  const getSliderColor = (value) => {
    if (value < 0.25) return theme.palette.info.main;
    if (value < 0.6) return theme.palette.success.main;
    if (value < 0.85) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Renderizar mixer
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 2,
        boxShadow: 3
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Mesa Digital
        </Typography>
        <IconButton onClick={onClose} size="large">
          <Close />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Volume Master */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 2, 
          borderRadius: 2, 
          bgcolor: 'background.default',
          boxShadow: 1
        }}
      >
        <Typography variant="h6" gutterBottom>
          Volume Master
        </Typography>
        
        <Box display="flex" alignItems="center">
          <IconButton sx={{ mr: 2 }}>
            <VolumeUp />
          </IconButton>
          
          <Slider
            value={masterVolume}
            onChange={handleMasterVolumeChange}
            aria-labelledby="master-volume-slider"
            min={0}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
            valueLabelFormat={(x) => `${Math.round(x * 100)}%`}
            sx={{
              color: getSliderColor(masterVolume),
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
              }
            }}
          />
        </Box>
      </Box>
      
      {/* Controles por usuário */}
      <Typography variant="h6" gutterBottom>
        Participantes
      </Typography>
      
      <Grid container spacing={2}>
        {users.map(user => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Box display="flex" alignItems="center" mb={1} width="100%">
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                    width: 40,
                    height: 40,
                    mr: 1
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : '?'}
                </Avatar>
                
                <Box flex={1}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="medium"
                    noWrap
                  >
                    {user.name}
                  </Typography>
                  
                  <Box display="flex" alignItems="center">
                    <MusicNote fontSize="small" sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                    >
                      {user.instrument || 'Sem instrumento'}
                    </Typography>
                  </Box>
                </Box>
                
                <IconButton
                  onClick={() => handleToggleMute(user.id)}
                  size="small"
                >
                  {muted[user.id] ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              </Box>
              
              <Box width="100%" px={1}>
                <Slider
                  value={volumes[user.id] || 0}
                  onChange={(e, value) => handleVolumeChange(user.id, value)}
                  aria-labelledby={`volume-slider-${user.id}`}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={muted[user.id]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(x) => `${Math.round(x * 100)}%`}
                  sx={{
                    color: muted[user.id] 
                      ? theme.palette.action.disabled 
                      : getSliderColor(volumes[user.id] || 0),
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                    }
                  }}
                />
              </Box>
              
              <Box 
                display="flex" 
                justifyContent="space-between" 
                width="100%"
                mt={1}
              >
                <Tooltip title="Configurações de áudio">
                  <IconButton 
                    size="small"
                    onClick={() => setShowEqualizer(true)}
                  >
                    <SettingsInputComponent fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Equalização">
                  <IconButton 
                    size="small"
                    onClick={() => setShowEqualizer(true)}
                  >
                    <Equalizer fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Diálogo de equalização */}
      <Dialog
        open={showEqualizer}
        onClose={() => setShowEqualizer(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Equalização Avançada</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Configurações avançadas de equalização e processamento de áudio estarão disponíveis em breve.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEqualizer(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FullMixerView;
