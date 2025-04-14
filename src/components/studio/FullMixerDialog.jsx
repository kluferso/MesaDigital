import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  Slider,
  IconButton,
  Paper,
  Divider,
  Tabs,
  Tab,
  Avatar,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  VolumeUp as VolumeUpIcon,
  VolumeMute as VolumeMuteIcon,
  EqualizerOutlined as EqualizerIcon,
  GraphicEq as GraphicEqIcon,
  Memory as MemoryIcon,
  SignalCellularAlt as SignalIcon,
  Close as CloseIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  TuneOutlined as TuneIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import ConnectionQualityIndicator from '../audio/ConnectionQualityIndicator';

// Estilos para o canal de mixer
const MixerChannel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100%',
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.2s',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)'
  }
}));

// Slider de volume vertical
const VerticalSlider = styled(Slider)(({ theme }) => ({
  height: 200,
  '& .MuiSlider-thumb': {
    width: 24,
    height: 24,
  },
  '& .MuiSlider-track': {
    width: 8,
  },
  '& .MuiSlider-rail': {
    width: 8,
  }
}));

/**
 * Dialog que exibe o mixer completo com controles avançados
 */
const FullMixerDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const {
    users,
    localUser,
    userVolumes,
    setUserVolume,
    masterVolume,
    setMasterVolume,
    audioEnabled,
    toggleAudio
  } = useWebRTC();
  
  const [activeTab, setActiveTab] = useState(0);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [automaticGain, setAutomaticGain] = useState(true);
  
  // Ordenar usuários (usuário local primeiro)
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === localUser?.id) return -1;
    if (b.id === localUser?.id) return 1;
    return a.name.localeCompare(b.name);
  });
  
  // Função para alternar mudo/som para um usuário
  const handleToggleUserMute = (userId) => {
    const currentVolume = userVolumes[userId] || 1;
    setUserVolume(userId, currentVolume === 0 ? 1 : 0);
  };
  
  // Função para alternar mudo/som master
  const handleToggleMasterMute = () => {
    setMasterVolume(masterVolume === 0 ? 1 : 0);
  };
  
  // Mudança de aba
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Simulação para bandas de equalização (normalmente seria parte do contexto WebRTC)
  const [equalizerBands] = useState([
    { frequency: '60Hz', value: 0 },
    { frequency: '150Hz', value: 0 },
    { frequency: '400Hz', value: 0 },
    { frequency: '1kHz', value: 0 },
    { frequency: '2.5kHz', value: 0 },
    { frequency: '6kHz', value: 0 },
    { frequency: '12kHz', value: 0 }
  ]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: { sm: 'auto', md: '80vh' },
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: theme => `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EqualizerIcon sx={{ mr: 1 }} />
          <Typography variant="h6">{t('mixer.fullMixerTitle')}</Typography>
        </Box>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab icon={<GraphicEqIcon />} label={t('mixer.tabs.channels')} />
            <Tab icon={<TuneIcon />} label={t('mixer.tabs.settings')} />
            <Tab icon={<SignalIcon />} label={t('mixer.tabs.stats')} />
          </Tabs>
        </Box>
        
        {/* Aba de canais */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 0}
          id="mixer-tabpanel-0"
          sx={{ p: 3, height: '100%', display: activeTab === 0 ? 'block' : 'none' }}
        >
          <Grid container spacing={3}>
            {/* Canais para cada usuário */}
            {sortedUsers.map(user => {
              const isLocalUser = user.id === localUser?.id;
              const userVolume = userVolumes[user.id] || 1;
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                  <MixerChannel elevation={3}>
                    {/* Cabeçalho do canal */}
                    <Box sx={{ 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2, 
                      justifyContent: 'space-between' 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: isLocalUser ? 'primary.main' : 'secondary.main',
                            mr: 1
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                            {user.name}
                            {isLocalUser && ` (${t('mixer.you')})`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {user.instrument}
                          </Typography>
                        </Box>
                      </Box>
                      <ConnectionQualityIndicator userId={user.id} size="small" />
                    </Box>
                    
                    {/* Controles do canal */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: 250
                    }}>
                      {isLocalUser ? (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          mb: 2 
                        }}>
                          <IconButton
                            color={audioEnabled ? 'primary' : 'error'}
                            size="large"
                            onClick={() => toggleAudio(!audioEnabled)}
                            sx={{ mb: 1 }}
                          >
                            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                          </IconButton>
                          <Typography variant="body2" color={audioEnabled ? 'primary' : 'error'}>
                            {audioEnabled ? t('audio.micOn') : t('audio.micOff')}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          width: '100%' 
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            mb: 2 
                          }}>
                            <Typography 
                              variant="h6" 
                              color={userVolume === 0 ? 'error.main' : 'text.primary'}
                            >
                              {userVolume === 0 ? "MUTED" : `${Math.round(userVolume * 100)}%`}
                            </Typography>
                            
                            <IconButton
                              onClick={() => handleToggleUserMute(user.id)}
                              color={userVolume === 0 ? 'error' : 'primary'}
                              size="large"
                            >
                              {userVolume === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}
                            </IconButton>
                          </Box>
                          
                          <VerticalSlider
                            orientation="vertical"
                            value={userVolume * 100}
                            onChange={(e, newValue) => setUserVolume(user.id, newValue / 100)}
                            aria-label="Volume"
                            valueLabelDisplay="auto"
                            valueLabelFormat={value => `${value}%`}
                            sx={{ mb: 2 }}
                          />
                        </Box>
                      )}
                    </Box>
                    
                    {/* Botão de equalização */}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EqualizerIcon />}
                      sx={{ mt: 2 }}
                      onClick={() => setShowEqualizer(!showEqualizer)}
                      disabled={isLocalUser}
                    >
                      {t('mixer.equalizer')}
                    </Button>
                  </MixerChannel>
                </Grid>
              );
            })}
            
            {/* Canal master */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <MixerChannel 
                elevation={3} 
                sx={{ 
                  bgcolor: 'background.paper', 
                  borderLeft: theme => `4px solid ${theme.palette.primary.main}`
                }}
              >
                <Box sx={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2, 
                  justifyContent: 'space-between' 
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {t('mixer.master')}
                  </Typography>
                  <Tooltip title={t('mixer.masterTooltip')}>
                    <MemoryIcon color="primary" />
                  </Tooltip>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: 250
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    mb: 2 
                  }}>
                    <Typography 
                      variant="h6" 
                      color={masterVolume === 0 ? 'error.main' : 'text.primary'}
                    >
                      {masterVolume === 0 ? "MUTED" : `${Math.round(masterVolume * 100)}%`}
                    </Typography>
                    
                    <IconButton
                      onClick={handleToggleMasterMute}
                      color={masterVolume === 0 ? 'error' : 'primary'}
                      size="large"
                    >
                      {masterVolume === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}
                    </IconButton>
                  </Box>
                  
                  <VerticalSlider
                    orientation="vertical"
                    value={masterVolume * 100}
                    onChange={(e, newValue) => setMasterVolume(newValue / 100)}
                    aria-label="Master Volume"
                    valueLabelDisplay="auto"
                    valueLabelFormat={value => `${value}%`}
                    color="primary"
                    sx={{ mb: 2 }}
                  />
                </Box>
                
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<SaveIcon />}
                  sx={{ mt: 2 }}
                >
                  {t('mixer.saveSettings')}
                </Button>
              </MixerChannel>
            </Grid>
          </Grid>
        </Box>
        
        {/* Aba de configurações */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 1}
          id="mixer-tabpanel-1"
          sx={{ p: 3, display: activeTab === 1 ? 'block' : 'none' }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('mixer.settings.audioProcessing')}
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={automaticGain}
                        onChange={(e) => setAutomaticGain(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={t('mixer.settings.automaticGain')}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('mixer.settings.automaticGainDescription')}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  {t('mixer.settings.bufferSize')}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="outlined" size="small">128</Button>
                  <Button variant="contained" color="primary" size="small">256</Button>
                  <Button variant="outlined" size="small">512</Button>
                  <Button variant="outlined" size="small">1024</Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('mixer.settings.bufferSizeDescription')}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('mixer.settings.equalizer')}
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  {equalizerBands.map((band, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" sx={{ minWidth: 60 }}>
                        {band.frequency}
                      </Typography>
                      <Slider
                        size="small"
                        value={band.value}
                        step={1}
                        min={-12}
                        max={12}
                        valueLabelDisplay="auto"
                        valueLabelFormat={value => `${value > 0 ? '+' : ''}${value} dB`}
                        sx={{ mx: 2 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 45, textAlign: 'right' }}>
                        {band.value > 0 ? '+' : ''}{band.value} dB
                      </Typography>
                    </Box>
                  ))}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      size="small"
                    >
                      {t('mixer.settings.reset')}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      size="small"
                    >
                      {t('mixer.settings.apply')}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* Aba de estatísticas */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 2}
          id="mixer-tabpanel-2"
          sx={{ p: 3, display: activeTab === 2 ? 'block' : 'none' }}
        >
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('mixer.stats.title')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('mixer.stats.description')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('mixer.stats.network')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {t('mixer.stats.latency')}
                      </Typography>
                      <Typography variant="body2">43 ms</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {t('mixer.stats.jitter')}
                      </Typography>
                      <Typography variant="body2">5.2 ms</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {t('mixer.stats.packetLoss')}
                      </Typography>
                      <Typography variant="body2">0.3%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {t('mixer.stats.bandwidth')}
                      </Typography>
                      <Typography variant="body2">128 kbps</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('mixer.stats.audio')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {t('mixer.stats.sampleRate')}
                      </Typography>
                      <Typography variant="body2">48 kHz</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {t('mixer.stats.bufferSize')}
                      </Typography>
                      <Typography variant="body2">256 samples</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {t('mixer.stats.audioLatency')}
                      </Typography>
                      <Typography variant="body2">13.4 ms</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {t('mixer.stats.codec')}
                      </Typography>
                      <Typography variant="body2">Opus</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ borderTop: theme => `1px solid ${theme.palette.divider}`, p: 2 }}>
        <Button onClick={onClose} color="primary">{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FullMixerDialog;
