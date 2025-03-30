import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Slider,
  IconButton,
  Tooltip,
  useTheme,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Avatar,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  Divider,
  ButtonGroup,
  Button,
  Paper,
  Stack
} from '@mui/material';
import {
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideoIcon,
  VideocamOff as VideoOffIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Settings as SettingsIcon,
  Equalizer as EqualizerIcon,
  HighQuality as QualityIcon,
  Tune as TuneIcon,
  SpatialAudio as SpatialAudioIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  GraphicEq as GraphicEqIcon,
  Delete as DeleteIcon,
  Headphones as HeadphonesIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Star as StarIcon,
  MusicNote as MusicNoteIcon,
} from '@mui/icons-material';
import { isValidArray, safeFilter, ensureArray, safe, processParticipants } from '../utils/safeUtils';

// Componente de configurações avançadas com novo design visual
const AdvancedSettings = ({ participant, onClose }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [userVolume, setUserVolume] = useState(80);
  const [effectsSettings, setEffectsSettings] = useState({
    reverb: 30,
    echo: 10,
    bass: 50,
    treble: 60,
    spatialWidth: 70,
  });
  
  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleEffectChange = (effect, value) => {
    setEffectsSettings(prev => ({
      ...prev,
      [effect]: value
    }));
  };
  
  const handleSavePreset = () => {
    console.log('Salvando preset para', participant.name);
    // Implementar salvamento de preset
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
        p: 1,
        bgcolor: '#1e1e1e'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{ 
              bgcolor: participant.isLocal ? 'primary.main' : 'secondary.main',
              width: 32, 
              height: 32 
            }}
          >
            {participant.isLocal ? "Eu" : participant.name?.charAt(0).toUpperCase() || "?"}
          </Avatar>
          <Typography variant="subtitle1" sx={{ color: 'white' }}>
            {participant.name} {participant.isLocal && '(Você)'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={handleChangeTab} 
        variant="fullWidth"
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: '#2a2a2a',
          '& .MuiTab-root': {
            minHeight: '48px',
            fontSize: '0.8rem',
            color: 'white'
          },
          '& .Mui-selected': {
            color: '#90caf9'
          }
        }}
      >
        <Tab icon={<TuneIcon fontSize="small" />} label="Básico" />
        <Tab icon={<EqualizerIcon fontSize="small" />} label="Equalizador" />
        <Tab icon={<SpatialAudioIcon fontSize="small" />} label="Espacial" />
      </Tabs>
      
      <Box sx={{ p: 2, height: '280px', overflowY: 'auto', bgcolor: '#2a2a2a', color: 'white' }}>
        {/* Configurações Básicas */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Volume
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" sx={{ color: 'white' }}>
                  <VolumeIcon fontSize="small" />
                </IconButton>
                <Slider
                  value={userVolume}
                  onChange={(e, newValue) => setUserVolume(newValue)}
                  aria-label="Volume"
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
            
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Redução de ruído"
              sx={{ color: 'white' }}
            />
            
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Cancelamento de eco"
              sx={{ color: 'white' }}
            />
            
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Auto ajuste de ganho"
              sx={{ color: 'white' }}
            />
            
            <FormControlLabel
              control={<Switch color="primary" />}
              label="Priorizar voz"
              sx={{ color: 'white' }}
            />
          </Stack>
        )}
        
        {/* Equalizador */}
        {activeTab === 1 && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Graves
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GraphicEqIcon sx={{ mr: 1, transform: 'rotate(180deg)', opacity: 0.7, color: 'white' }} />
                <Slider
                  value={effectsSettings.bass}
                  onChange={(e, value) => handleEffectChange('bass', value)}
                  aria-label="Graves"
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Médios
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GraphicEqIcon sx={{ mr: 1, opacity: 0.7, color: 'white' }} />
                <Slider
                  defaultValue={50}
                  aria-label="Médios"
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Agudos
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GraphicEqIcon sx={{ mr: 1, transform: 'scaleY(0.7)', opacity: 0.7, color: 'white' }} />
                <Slider
                  value={effectsSettings.treble}
                  onChange={(e, value) => handleEffectChange('treble', value)}
                  aria-label="Agudos"
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 1, bgcolor: 'grey.700' }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                size="small"
              >
                Resetar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                size="small"
                onClick={handleSavePreset}
              >
                Salvar preset
              </Button>
            </Box>
          </Stack>
        )}
        
        {/* Efeitos Espaciais */}
        {activeTab === 2 && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Reverberação
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpatialAudioIcon sx={{ mr: 1, opacity: 0.7, color: 'white' }} />
                <Slider
                  value={effectsSettings.reverb}
                  onChange={(e, value) => handleEffectChange('reverb', value)}
                  aria-label="Reverberação"
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Eco
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpatialAudioIcon sx={{ mr: 1, opacity: 0.7, color: 'white' }} />
                <Slider
                  value={effectsSettings.echo}
                  onChange={(e, value) => handleEffectChange('echo', value)}
                  aria-label="Eco"
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Largura espacial
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpatialAudioIcon sx={{ mr: 1, opacity: 0.7, color: 'white' }} />
                <Slider
                  value={effectsSettings.spatialWidth}
                  onChange={(e, value) => handleEffectChange('spatialWidth', value)}
                  aria-label="Largura espacial"
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
            
            <FormControlLabel
              control={<Switch color="primary" />}
              label="Áudio 3D"
              sx={{ color: 'white' }}
            />
            
            <FormControlLabel
              control={<Switch color="secondary" />}
              label="Modo sala de concerto"
              sx={{ color: 'white' }}
            />
          </Stack>
        )}
      </Box>
      
      <Box sx={{ 
        p: 1, 
        borderTop: `1px solid grey`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1,
        bgcolor: '#1e1e1e'
      }}>
        <Typography variant="caption" sx={{ flexGrow: 1, alignSelf: 'center', color: 'grey.400' }}>
          {participant.isLocal ? 'Configurações do seu áudio' : `Configurações para ${participant.name}`}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onClose}
          sx={{ color: 'white', borderColor: 'grey.700' }}
        >
          Fechar
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<CheckIcon />}
          onClick={onClose}
        >
          Aplicar
        </Button>
      </Box>
    </Box>
  );
};

// Componente de card de participante com layout melhorado
const ParticipantCard = ({ participant, selectedInterface, onOpenSettings }) => {
  const theme = useTheme();
  const hasInterface = selectedInterface && selectedInterface.streams && selectedInterface.streams.some(s => s.active);
  const instrumentColors = {
    "Guitarra": "#e57373",
    "Baixo": "#64b5f6",
    "Bateria": "#ffb74d",
    "Teclado": "#4db6ac",
    "Violão": "#81c784",
    "Voz": "#9575cd",
    "Piano": "#4fc3f7",
    "Violino": "#ff8a65",
    "Violoncelo": "#a1887f",
    "Flauta": "#90a4ae",
    "Saxofone": "#f06292",
    "Trompete": "#ffd54f"
  };
  
  const instrumentColor = instrumentColors[participant.instrument] || '#4fc3f7';
  
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        bgcolor: '#2a2a2a',
        minHeight: '200px',
        width: '100%'
      }}
    >
      {/* Barra decorativa com a cor do instrumento */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          bgcolor: instrumentColor,
        }}
      />
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 2,
        width: '100%',
      }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            participant.isLocal && (
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  border: `2px solid #1e1e1e`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonIcon sx={{ fontSize: 8, color: 'white' }} />
              </Box>
            )
          }
        >
          <Avatar
            sx={{
              bgcolor: instrumentColor,
              width: 40,
              height: 40,
              flexShrink: 0,
            }}
          >
            <MusicNoteIcon />
          </Avatar>
        </Badge>
        
        <Box sx={{ 
          flexGrow: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              fontWeight: 'medium',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'white'
            }}
            title={`${participant.name}${participant.isLocal ? " (Você)" : ""}`}
          >
            {participant.name} {participant.isLocal && "(Você)"}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'grey.400'
            }}
            title={participant.instrument || 'Instrumento não definido'}
          >
            {participant.instrument || 'Instrumento não definido'}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 0.5
          }}>
            <Typography variant="body2" sx={{ color: 'grey.400' }}>
              Volume
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, color: 'grey.300' }}>
              80%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolumeIcon fontSize="small" sx={{ color: 'grey.400' }} />
            <Slider
              size="small"
              defaultValue={80}
              aria-label="Volume"
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Box>
      
      {/* Controles no rodapé do card */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ 
          mt: 'auto',
          pt: 2,
          justifyContent: 'center',
          flexWrap: 'nowrap'
        }}
      >
        {participant.isLocal && (
          <>
            <Tooltip title={participant.audioEnabled ? "Desativar microfone" : "Ativar microfone"}>
              <IconButton
                size="medium"
                color={participant.audioEnabled ? "primary" : "default"}
                sx={{ 
                  bgcolor: '#1e1e1e',
                  color: participant.audioEnabled ? '#90caf9' : 'grey.500'
                }}
              >
                {participant.audioEnabled ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={participant.videoEnabled ? "Desativar câmera" : "Ativar câmera"}>
              <IconButton
                size="medium"
                color={participant.videoEnabled ? "primary" : "default"}
                sx={{ 
                  bgcolor: '#1e1e1e',
                  color: participant.videoEnabled ? '#90caf9' : 'grey.500'
                }}
              >
                {participant.videoEnabled ? <VideoIcon /> : <VideoOffIcon />}
              </IconButton>
            </Tooltip>
          </>
        )}
        
        <Tooltip title="Configurações avançadas">
          <IconButton
            size="medium"
            onClick={() => onOpenSettings(participant)}
            sx={{ 
              bgcolor: '#1e1e1e',
              color: 'grey.300'
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

const AudioMixer = ({ participants, localParticipant, toggleAudio, toggleVideo, fullWidth = false }) => {
  // Garantindo valores padrão seguros
  const safeParticipants = processParticipants(participants || []);
  const safeLocalParticipant = localParticipant || null;
  
  const theme = useTheme();
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [audioInterfaces, setAudioInterfaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Simula a obtenção de interfaces de áudio
    setAudioInterfaces([
      {
        id: 'default',
        name: 'Interface padrão',
        streams: [
          { id: 'ch1', name: 'Canal 1', active: true },
          { id: 'ch2', name: 'Canal 2', active: true }
        ]
      }
    ]);
  }, []);

  const handleInterfaceChange = (e) => {
    const interfaceId = e.target.value;
    const selectedInterface = audioInterfaces.find(i => i.id === interfaceId) || null;
    setSelectedInterface(selectedInterface);
  };

  const handleOpenSettings = (participant) => {
    setSelectedParticipant(participant);
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  // Verifica se há participantes válidos
  if (!isValidArray(safeParticipants)) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="grey.300">
          Nenhum participante na sala
        </Typography>
      </Box>
    );
  }

  // Função segura para alternar áudio
  const safeToggleAudio = () => {
    if (typeof toggleAudio === 'function') {
      try {
        toggleAudio();
      } catch (e) {
        console.error('Erro ao alternar áudio:', e);
      }
    }
  };

  // Função segura para alternar vídeo
  const safeToggleVideo = () => {
    if (typeof toggleVideo === 'function') {
      try {
        toggleVideo();
      } catch (e) {
        console.error('Erro ao alternar vídeo:', e);
      }
    }
  };
  
  // Ajustar tamanho dos cards com base no modo fullWidth
  const cardsPerRow = fullWidth ? { xs: 2, sm: 3, md: 4, lg: 5 } : { xs: 12, sm: 6, md: 4, lg: 3 };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', maxWidth: fullWidth ? '90%' : '100%', mx: 'auto' }}>
      {/* Interface Selection */}
      <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#2a2a2a' }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: 'white' }}>Interface de Áudio</InputLabel>
          <Select
            value={safe(selectedInterface, 'id', '')}
            label="Interface de Áudio"
            onChange={handleInterfaceChange}
            sx={{ 
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'grey.700'
              }
            }}
          >
            <MenuItem value="">
              <em>Nenhuma</em>
            </MenuItem>
            {ensureArray(audioInterfaces).map(interface_ => (
              <MenuItem key={interface_.id} value={interface_.id}>
                {interface_.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Stream Indicators */}
        {selectedInterface && (
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                Canais ativos:
              </Typography>
              {ensureArray(safe(selectedInterface, 'streams', [])).map((stream, index) => (
                <Tooltip key={stream.id} title={stream.name || `Canal ${index + 1}`}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: stream.active ? 'success.main' : 'action.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: stream.active ? '0 0 6px rgba(0,200,50,0.5)' : 'none'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '10px', color: 'white' }}>
                      {index + 1}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Participants Grid */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Grid container spacing={2} sx={{ p: 0.5 }}>
          {safeParticipants.map((participant) => (
            <Grid item xs={cardsPerRow.xs} sm={cardsPerRow.sm} md={cardsPerRow.md} lg={cardsPerRow.lg} key={participant.id}>
              <ParticipantCard 
                participant={participant} 
                selectedInterface={selectedInterface}
                onOpenSettings={handleOpenSettings}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Drawer de configurações avançadas */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={handleCloseSettings}
        sx={{
          '& .MuiDrawer-paper': {
            width: {
              xs: '100%',
              sm: 400,
            },
            bgcolor: '#1e1e1e',
          },
        }}
      >
        {selectedParticipant && (
          <AdvancedSettings
            participant={selectedParticipant}
            onClose={handleCloseSettings}
          />
        )}
      </Drawer>
    </Box>
  );
};

export default AudioMixer;
