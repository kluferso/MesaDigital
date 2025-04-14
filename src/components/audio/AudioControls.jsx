import React, { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Card, CardContent, Grid, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import SettingsIcon from '@mui/icons-material/Settings';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useTranslation } from 'react-i18next';
import ConnectionQualityIndicator from './ConnectionQualityIndicator';

/**
 * Controles de áudio principais
 */
const AudioControls = ({ onOpenMixer }) => {
  const { audioEnabled, toggleAudio, masterVolume, setMasterVolume, localUser, userQualities } = useWebRTC();
  const { t } = useTranslation();
  
  // Estado para volume master
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1.0);
  
  // Alternar entre mudo e volume normal
  const toggleMute = () => {
    if (!isMuted) {
      // Salvar volume atual e mutar
      setPreviousVolume(masterVolume);
      setMasterVolume(0);
      setIsMuted(true);
    } else {
      // Restaurar volume anterior
      setMasterVolume(previousVolume);
      setIsMuted(false);
    }
  };
  
  // Atualizar estado quando o volume master mudar
  useEffect(() => {
    setIsMuted(masterVolume === 0);
  }, [masterVolume]);
  
  // Qualidade da própria conexão
  const myQuality = localUser ? userQualities[localUser.id] : null;
  
  return (
    <Card sx={{ width: '100%', mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={() => toggleAudio(!audioEnabled)}
                color={audioEnabled ? 'primary' : 'error'}
                size="large"
                sx={{ boxShadow: 1 }}
              >
                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
              
              <Box>
                <Typography variant="subtitle2">
                  {audioEnabled ? t('audio.micOn') : t('audio.micOff')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('audio.clickToToggle')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={toggleMute}
                color={isMuted ? 'error' : 'primary'}
                size="large"
                sx={{ boxShadow: 1 }}
              >
                {isMuted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
              </IconButton>
              
              <Box>
                <Typography variant="subtitle2">
                  {isMuted ? t('audio.soundOff') : t('audio.soundOn')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('audio.clickToToggleSound')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConnectionQualityIndicator 
                userId={localUser?.id || ''}
                showText
                size="large"
              />
              
              <Box>
                <Typography variant="subtitle2">
                  {t('audio.connectionQuality')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {myQuality ? `${Math.round(myQuality.score * 100)}%` : t('audio.checking')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title={t('audio.openMixer')}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={onOpenMixer}
                  startIcon={<SettingsIcon />}
                >
                  {t('audio.mixer')}
                </Button>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AudioControls;
