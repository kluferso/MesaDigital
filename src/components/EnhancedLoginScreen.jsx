import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Stack,
  Snackbar,
  Avatar,
  Grid,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Fade,
  Zoom
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  MicNone as MicIcon,
  VideocamOutlined as CameraIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Check as CheckIcon,
  Lock as LockIcon,
  MeetingRoom as RoomIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { useWebRTC } from '../contexts/webrtc/WebRTCContext';

// Importar os ícones de instrumentos modernos
import {
  GuitarIcon,
  BassIcon,
  PianoIcon,
  DrumIcon,
  ViolinIcon,
  VocalIcon,
  SaxophoneIcon,
  TrumpetIcon,
  OtherInstrumentIcon
} from './icons/InstrumentIcons';

// Componente de painel de tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Lista de instrumentos com os novos ícones
const instruments = [
  { id: 'violao', name: 'Violão', icon: GuitarIcon, color: '#8B4513' },
  { id: 'guitarra', name: 'Guitarra', icon: GuitarIcon, color: '#DC143C' },
  { id: 'baixo', name: 'Baixo', icon: BassIcon, color: '#4169E1' },
  { id: 'bateria', name: 'Bateria', icon: DrumIcon, color: '#8B4513' },
  { id: 'piano', name: 'Piano/Teclado', icon: PianoIcon, color: '#1E1E1E' },
  { id: 'voz', name: 'Vocal', icon: VocalIcon, color: '#FF6347' },
  { id: 'violino', name: 'Violino', icon: ViolinIcon, color: '#8B008B' },
  { id: 'saxofone', name: 'Saxofone', icon: SaxophoneIcon, color: '#FFD700' },
  { id: 'trompete', name: 'Trompete', icon: TrumpetIcon, color: '#B8860B' },
  { id: 'outro', name: 'Outro', icon: OtherInstrumentIcon, color: '#696969' }
];

export default function EnhancedLoginScreen() {
  const navigate = useNavigate();
  const { socket, connected, error: socketError } = useSocket();
  const { createRoom, joinRoom, error: webRTCError, isInitialized } = useWebRTC();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Estados
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [instrument, setInstrument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [selectedInstrumentObj, setSelectedInstrumentObj] = useState(null);
  const [activeRooms, setActiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const [usingSimulatedAudio, setUsingSimulatedAudio] = useState(false);

  // Efeitos
  useEffect(() => {
    if (connected && socketError) {
      setError(null);
    } else if (socketError) {
      setError(`Erro de conexão com o servidor: ${socketError}`);
      
      // Se houver múltiplas tentativas de conexão sem sucesso, mostrar opção de P2P direto
      if (connectionAttempts > 2) {
        setShowRetryPrompt(true);
      }
    }
  }, [connected, socketError, connectionAttempts]);

  useEffect(() => {
    if (webRTCError) {
      setError(`Erro WebRTC: ${webRTCError}`);
    }
  }, [webRTCError]);

  useEffect(() => {
    const handleWebRTCWarning = (event) => {
      if (event.detail?.type === 'using_simulated_audio') {
        setWarning(event.detail.message);
        setUsingSimulatedAudio(true);
      }
    };

    // Registrar um event listener para o evento warning
    window.addEventListener('webrtc_warning', handleWebRTCWarning);

    return () => {
      window.removeEventListener('webrtc_warning', handleWebRTCWarning);
    };
  }, []);

  useEffect(() => {
    generateRoomId();
    
    // Configurar os ouvintes para as salas ativas quando o socket estiver conectado
    if (socket && connected) {
      fetchActiveRooms();
      
      // Adicionar event listener para atualizações de salas ativas
      socket.on('active_rooms_update', (rooms) => {
        setActiveRooms(rooms);
        setLoadingRooms(false);
      });
      
      return () => {
        socket.off('active_rooms_update');
      };
    } else if (socket && !connected) {
      // Incrementar tentativas de conexão quando há socket mas não está conectado
      setConnectionAttempts(prev => prev + 1);
    }
  }, [socket, connected]);

  useEffect(() => {
    if (instrument) {
      const selected = instruments.find(inst => inst.id === instrument);
      setSelectedInstrumentObj(selected);
    } else {
      setSelectedInstrumentObj(null);
    }
  }, [instrument]);

  // Funções
  const fetchActiveRooms = () => {
    if (!socket || !connected) return;
    
    setLoadingRooms(true);
    socket.emit('get_active_rooms');
  };

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoom(randomId);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(room);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRoomSelection = (roomId) => {
    setRoom(roomId);
    setTabValue(0); // Voltar para a primeira aba
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Por favor, digite seu nome');
      return false;
    }
    
    if (!room.trim()) {
      setError('Por favor, informe o ID da sala');
      return false;
    }
    
    if (!instrument) {
      setError('Por favor, selecione um instrumento');
      return false;
    }
    
    return true;
  };

  // Função de entrada na sala com bypass emergencial
  const handleEnterRoom = async (createNewRoom = false) => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Armazenar dados da sala na localStorage para uso de emergência
    localStorage.setItem('mesaDigital_roomId', room);
    localStorage.setItem('mesaDigital_userName', name);
    localStorage.setItem('mesaDigital_instrument', instrument);
    localStorage.setItem('mesaDigital_isAdmin', createNewRoom ? 'true' : 'false');
    
    try {
      // Modo debug - contador de tentativas
      let attemptCount = 0;
      const maxAttempts = 2;
      
      // Primeira tentativa - caminho normal
      try {
        attemptCount++;
        console.log(`Tentativa ${attemptCount} de entrar na sala...`);
        
        let success;
        if (createNewRoom) {
          success = await createRoom(name, instrument);
        } else {
          success = await joinRoom(room, name, instrument);
        }
        
        if (success) {
          navigate(`/room/${room}`);
          return;
        } else {
          console.warn("Resposta de sucesso, mas retorno indefinido. Tentando método alternativo...");
        }
      } catch (primaryError) {
        console.error("Erro na tentativa principal:", primaryError);
        // Continuar para o fallback
      }
      
      // Segunda tentativa - modo emergencial
      if (attemptCount < maxAttempts) {
        attemptCount++;
        console.log(`Tentativa ${attemptCount} - usando modo emergencial`);
        
        // Entrar na sala diretamente sem esperar confirmação do WebRTC
        // (Conexão ocorrerá no componente da sala)
        navigate(`/room/${room}?emergencyMode=true`);
        return;
      }
      
      throw new Error("Todas as tentativas de entrar na sala falharam");
    } catch (err) {
      console.error('Erro ao entrar na sala:', err);
      setError(`Erro ao entrar na sala: ${err.message || 'Falha de conexão'}`);
      
      // Adicionar botão de entrada emergencial
      setShowRetryPrompt(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para entrar na sala em modo de emergência
  const handleEmergencyEnter = () => {
    if (!validateForm()) return;
    
    // Armazenar dados da sala na localStorage
    localStorage.setItem('mesaDigital_roomId', room);
    localStorage.setItem('mesaDigital_userName', name);
    localStorage.setItem('mesaDigital_instrument', instrument);
    localStorage.setItem('mesaDigital_isAdmin', 'false');
    
    // Entrar diretamente, sem depender de socket/WebRTC
    navigate(`/room/${room}?emergencyMode=true`);
  };

  // Renderização da interface
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 4
        }}
      >
        {/* Novo Logo Musical */}
        <Zoom in={true} style={{ transitionDelay: '300ms' }}>
          <Box
            component="img"
            src="/logo-musical.svg"
            alt="Mesa Digital"
            sx={{
              width: isMobile ? 100 : 150,
              height: isMobile ? 100 : 150,
              mb: 2
            }}
          />
        </Zoom>
        
        <Fade in={true} style={{ transitionDelay: '500ms' }}>
          <Typography variant="h3" component="h1" align="center" gutterBottom sx={{ fontWeight: 700 }}>
            Mesa Digital
          </Typography>
        </Fade>
        
        <Fade in={true} style={{ transitionDelay: '700ms' }}>
          <Typography variant="h5" color="text.secondary" align="center" paragraph>
            Colaboração musical em tempo real
          </Typography>
        </Fade>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 0,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Tab label="Entrar em Estúdio" icon={<RoomIcon />} />
          <Tab label="Estúdios Ativos" icon={<GroupIcon />} />
        </Tabs>

        {/* Alerta de erro */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mx: 3, mt: 3, mb: 0 }}
            action={
              showRetryPrompt ? (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleEmergencyEnter}
                >
                  Entrar Emergencial
                </Button>
              ) : null
            }
          >
            {error}
          </Alert>
        )}

        {/* Alerta de aviso */}
        {warning && (
          <Alert 
            severity="warning" 
            sx={{ mx: 3, mt: error ? 1 : 3, mb: 0 }}
          >
            {warning}
          </Alert>
        )}

        {/* Painel de Login */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Seu Nome"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
              InputProps={{
                startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
              }}
            />

            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="ID do Estúdio"
                variant="outlined"
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
                disabled={isLoading}
                InputProps={{
                  startAdornment: <RoomIcon color="action" sx={{ mr: 1 }} />,
                  endAdornment: (
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Gerar novo ID">
                        <IconButton onClick={generateRoomId} disabled={isLoading}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={copiedToClipboard ? "Copiado!" : "Copiar ID"}>
                        <IconButton onClick={handleCopyRoomId} disabled={isLoading}>
                          {copiedToClipboard ? <CheckIcon /> : <CopyIcon />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )
                }}
              />
            </Box>

            <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>
              Escolha seu instrumento
            </Typography>

            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {instruments.map((inst) => {
                  const Icon = inst.icon;
                  const isSelected = instrument === inst.id;
                  
                  return (
                    <Grid item xs={6} sm={4} md={3} key={inst.id}>
                      <Card 
                        raised={isSelected}
                        sx={{
                          borderRadius: 2,
                          transition: 'all 0.3s',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          border: isSelected ? `2px solid ${inst.color}` : 'none',
                          bgcolor: isSelected ? `${inst.color}10` : 'background.paper'
                        }}
                      >
                        <CardActionArea
                          onClick={() => setInstrument(inst.id)}
                          sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                          <Icon color={inst.color} size={48} />
                          <Typography variant="subtitle1" align="center" sx={{ mt: 1 }}>
                            {inst.name}
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={audioEnabled}
                    onChange={(e) => setAudioEnabled(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MicIcon sx={{ mr: 0.5 }} />
                    <Typography variant="body2">Áudio</Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={videoEnabled}
                    onChange={(e) => setVideoEnabled(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CameraIcon sx={{ mr: 0.5 }} />
                    <Typography variant="body2">Vídeo</Typography>
                  </Box>
                }
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={() => handleEnterRoom(false)}
                disabled={isLoading}
                startIcon={<GroupIcon />}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Entrar no Estúdio"}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => handleEnterRoom(true)}
                disabled={isLoading}
                startIcon={<AddIcon />}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Criar Estúdio"}
              </Button>
            </Box>
          </Stack>
        </TabPanel>

        {/* Painel de Salas Ativas */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Estúdios Ativos
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchActiveRooms}
              disabled={loadingRooms || !connected}
            >
              {loadingRooms ? <CircularProgress size={24} /> : "Atualizar"}
            </Button>
          </Box>

          {loadingRooms ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : activeRooms.length > 0 ? (
            <Stack spacing={2}>
              {activeRooms.map((activeRoom) => (
                <Card 
                  key={activeRoom.id} 
                  sx={{ 
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 6
                    }
                  }}
                >
                  <CardActionArea onClick={() => handleRoomSelection(activeRoom.id)}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" component="div">
                            Estúdio {activeRoom.id}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                            <Chip 
                              icon={<GroupIcon />} 
                              label={`${activeRoom.userCount} participante${activeRoom.userCount !== 1 ? 's' : ''}`} 
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            
                            <Chip 
                              icon={<TimeIcon />} 
                              label={`Criado há ${activeRoom.timeAgo}`} 
                              size="small"
                              variant="outlined"
                            />
                            
                            {activeRoom.isPrivate && (
                              <Chip 
                                icon={<LockIcon />} 
                                label="Privado" 
                                size="small"
                                color="error"
                              />
                            )}
                          </Box>
                        </Box>
                        
                        <IconButton color="primary">
                          <VisibilityIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nenhum estúdio ativo encontrado
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setTabValue(0)}
                sx={{ mt: 2 }}
              >
                Criar um Estúdio
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Snackbar para notificações */}
      <Snackbar
        open={copiedToClipboard}
        autoHideDuration={2000}
        message="ID copiado para a área de transferência"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
