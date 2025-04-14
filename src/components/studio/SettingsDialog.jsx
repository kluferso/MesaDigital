import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Mic as MicIcon,
  Headset as HeadsetIcon,
  VolumeUp as VolumeUpIcon,
  Info as InfoIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';

/**
 * Dialog para configurações de áudio, dispositivos e preferências
 */
const SettingsDialog = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { 
    audioInputDevices, 
    audioOutputDevices,
    currentInputDevice,
    currentOutputDevice,
    setAudioInputDevice,
    setAudioOutputDevice,
    setBufferSize,
    bufferSize,
    enableEchoCancellation,
    setEnableEchoCancellation,
    enableNoiseReduction,
    setEnableNoiseReduction,
    enableAutoGainControl,
    setEnableAutoGainControl
  } = useWebRTC();
  
  const [activeTab, setActiveTab] = useState(0);
  const [testingAudio, setTestingAudio] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [instrument, setInstrument] = useState(localStorage.getItem('instrument') || '');
  const [language, setLanguage] = useState(i18n.language || 'en');
  
  // Lista de instrumentos
  const instruments = [
    'Guitar', 'Bass', 'Drums', 'Keyboard', 'Piano', 'Vocals',
    'Saxophone', 'Trumpet', 'Violin', 'Cello', 'Flute', 'Other'
  ];
  
  // Lista de idiomas
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ];
  
  // Tamanhos de buffer disponíveis
  const bufferSizes = [128, 256, 512, 1024, 2048, 4096];
  
  // Mudança de aba
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Simular teste de áudio
  const handleAudioTest = () => {
    setTestingAudio(true);
    // Em uma implementação real, isso tocaria um som de teste
    setTimeout(() => {
      setTestingAudio(false);
    }, 3000);
  };
  
  // Salvar configurações
  const handleSaveSettings = () => {
    // Salvar nome de usuário e instrumento no localStorage
    localStorage.setItem('username', username);
    localStorage.setItem('instrument', instrument);
    
    // Alterar idioma
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    
    onClose();
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: { sm: 'auto', md: '80vh' }, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">{t('settings.title')}</Typography>
        </Box>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<MicIcon />} label={t('settings.tabs.devices')} id="settings-tab-0" />
          <Tab icon={<VolumeUpIcon />} label={t('settings.tabs.audio')} id="settings-tab-1" />
          <Tab icon={<LanguageIcon />} label={t('settings.tabs.preferences')} id="settings-tab-2" />
        </Tabs>
      </Box>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Aba de Dispositivos */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 0}
          id="settings-tabpanel-0"
          sx={{ p: 3, display: activeTab === 0 ? 'block' : 'none' }}
        >
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('settings.devices.info')}
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <MicIcon fontSize="small" sx={{ mr: 1 }} />
                {t('settings.devices.inputDevice')}
              </Typography>
              
              <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                <TextField
                  select
                  label={t('settings.devices.selectInput')}
                  value={currentInputDevice || ''}
                  onChange={(e) => setAudioInputDevice(e.target.value)}
                  variant="outlined"
                  size="small"
                >
                  {audioInputDevices.map((device) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `${t('settings.devices.microphone')} ${device.deviceId.slice(0, 5)}`}
                    </MenuItem>
                  ))}
                  {audioInputDevices.length === 0 && (
                    <MenuItem disabled value="">
                      {t('settings.devices.noInputDevices')}
                    </MenuItem>
                  )}
                </TextField>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <HeadsetIcon fontSize="small" sx={{ mr: 1 }} />
                {t('settings.devices.outputDevice')}
              </Typography>
              
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <TextField
                  select
                  label={t('settings.devices.selectOutput')}
                  value={currentOutputDevice || ''}
                  onChange={(e) => setAudioOutputDevice(e.target.value)}
                  variant="outlined"
                  size="small"
                >
                  {audioOutputDevices.map((device) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `${t('settings.devices.speaker')} ${device.deviceId.slice(0, 5)}`}
                    </MenuItem>
                  ))}
                  {audioOutputDevices.length === 0 && (
                    <MenuItem disabled value="">
                      {t('settings.devices.noOutputDevices')}
                    </MenuItem>
                  )}
                </TextField>
              </FormControl>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleAudioTest}
                  disabled={testingAudio}
                  startIcon={<VolumeUpIcon />}
                >
                  {testingAudio 
                    ? t('settings.devices.testingAudio') 
                    : t('settings.devices.testAudio')}
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('settings.devices.audioTestInfo')}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Aba de Configurações de Áudio */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 1}
          id="settings-tabpanel-1"
          sx={{ p: 3, display: activeTab === 1 ? 'block' : 'none' }}
        >
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('settings.audio.processing')}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableEchoCancellation}
                      onChange={(e) => setEnableEchoCancellation(e.target.checked)}
                    />
                  }
                  label={t('settings.audio.echoCancellation')}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {t('settings.audio.echoCancellationInfo')}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableNoiseReduction}
                      onChange={(e) => setEnableNoiseReduction(e.target.checked)}
                    />
                  }
                  label={t('settings.audio.noiseReduction')}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {t('settings.audio.noiseReductionInfo')}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableAutoGainControl}
                      onChange={(e) => setEnableAutoGainControl(e.target.checked)}
                    />
                  }
                  label={t('settings.audio.autoGainControl')}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {t('settings.audio.autoGainControlInfo')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('settings.audio.advanced')}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                {t('settings.audio.bufferSize')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {bufferSizes.map((size) => (
                  <Button
                    key={size}
                    variant={bufferSize === size ? 'contained' : 'outlined'}
                    color={bufferSize === size ? 'primary' : 'inherit'}
                    onClick={() => setBufferSize(size)}
                    size="small"
                  >
                    {size}
                  </Button>
                ))}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('settings.audio.bufferSizeInfo')}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <InfoIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {t('settings.audio.bufferAdvice')}
              </Typography>
            </Box>
          </Paper>
        </Box>
        
        {/* Aba de Preferências */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 2}
          id="settings-tabpanel-2"
          sx={{ p: 3, display: activeTab === 2 ? 'block' : 'none' }}
        >
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('settings.preferences.profile')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('settings.preferences.username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText={t('settings.preferences.usernameInfo')}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={t('settings.preferences.instrument')}
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  variant="outlined"
                  size="small"
                  helperText={t('settings.preferences.instrumentInfo')}
                >
                  {instruments.map((instr) => (
                    <MenuItem key={instr} value={instr}>
                      {instr}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('settings.preferences.language')}
            </Typography>
            
            <TextField
              select
              fullWidth
              label={t('settings.preferences.selectLanguage')}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </TextField>
            
            <Typography variant="body2" color="text.secondary">
              {t('settings.preferences.languageInfo')}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSaveSettings} 
          color="primary" 
          variant="contained"
          disabled={!username.trim()}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
