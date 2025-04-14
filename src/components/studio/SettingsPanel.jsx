import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Alert,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Mic as MicIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useTranslation } from 'react-i18next';

/**
 * Painel de configurações da sala
 */
const SettingsPanel = () => {
  const { t } = useTranslation();
  const { audioEnabled, toggleAudio } = useWebRTC();
  
  // Estados locais
  const [bufferSize, setBufferSize] = useState(512);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [latencyHint, setLatencyHint] = useState('interactive');
  const [bitrate, setBitrate] = useState(96);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Manipulador de salvamento
  const handleSaveSettings = () => {
    // Simulação de salvamento (aqui implementaríamos a lógica real)
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };
  
  // Manipulador de redefinição
  const handleResetSettings = () => {
    setBufferSize(512);
    setNoiseSuppression(true);
    setEchoCancellation(true);
    setAutoGainControl(true);
    setLatencyHint('interactive');
    setBitrate(96);
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">{t('settings.audioSettings')}</Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {showSuccessMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {t('settings.saved')}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Configurações do microfone */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MicIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">{t('settings.microphone')}</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={audioEnabled} 
                    onChange={() => toggleAudio(!audioEnabled)}
                    color="primary"
                  />
                }
                label={t('settings.enableMicrophone')}
                sx={{ mb: 2, display: 'block' }}
              />
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={noiseSuppression} 
                      onChange={() => setNoiseSuppression(!noiseSuppression)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {t('settings.noiseSuppression')}
                      <Tooltip title={t('settings.noiseSuppressionTooltip')} arrow>
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={echoCancellation} 
                      onChange={() => setEchoCancellation(!echoCancellation)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {t('settings.echoCancellation')}
                      <Tooltip title={t('settings.echoCancellationTooltip')} arrow>
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={autoGainControl} 
                      onChange={() => setAutoGainControl(!autoGainControl)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {t('settings.autoGainControl')}
                      <Tooltip title={t('settings.autoGainControlTooltip')} arrow>
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* Configurações avançadas */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">{t('settings.advanced')}</Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>{t('settings.bufferSize')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Slider
                    value={bufferSize}
                    onChange={(_, newValue) => setBufferSize(newValue)}
                    step={null}
                    marks={[
                      { value: 256, label: '256' },
                      { value: 512, label: '512' },
                      { value: 1024, label: '1024' },
                      { value: 2048, label: '2048' },
                      { value: 4096, label: '4096' }
                    ]}
                    min={256}
                    max={4096}
                    valueLabelDisplay="auto"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {t('settings.bufferSizeDescription')}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="latency-hint-label">{t('settings.latencyHint')}</InputLabel>
                  <Select
                    labelId="latency-hint-label"
                    value={latencyHint}
                    onChange={(e) => setLatencyHint(e.target.value)}
                    label={t('settings.latencyHint')}
                  >
                    <MenuItem value="balanced">{t('settings.balanced')}</MenuItem>
                    <MenuItem value="interactive">{t('settings.interactive')}</MenuItem>
                    <MenuItem value="playback">{t('settings.playback')}</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  {t('settings.latencyHintDescription')}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>{t('settings.bitrate')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Slider
                    value={bitrate}
                    onChange={(_, newValue) => setBitrate(newValue)}
                    step={8}
                    marks={[
                      { value: 32, label: '32' },
                      { value: 64, label: '64' },
                      { value: 96, label: '96' },
                      { value: 128, label: '128' },
                      { value: 256, label: '256' }
                    ]}
                    min={32}
                    max={256}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value} kbps`}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {t('settings.bitrateDescription')}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={<ResetIcon />}
            onClick={handleResetSettings}
          >
            {t('settings.reset')}
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
          >
            {t('settings.save')}
          </Button>
        </Box>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('settings.connectionInfo')}
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('settings.connectionInfoDescription')}
        </Alert>
        
        <Typography variant="body2" gutterBottom>
          <strong>{t('settings.webRTCVersion')}:</strong> 1.0 (RTCPeerConnection)
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>{t('settings.serverRegion')}:</strong> Auto (Nearest)
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>{t('settings.iceServers')}:</strong> 2 STUN, 0 TURN
        </Typography>
        
        <Typography variant="body2">
          <strong>{t('settings.audioContext')}:</strong> 48000 Hz, {bufferSize} samples
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPanel;
