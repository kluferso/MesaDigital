import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  Badge
} from '@mui/material';
import {
  MusicNote as MusicIcon,
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
  LockOpen as UnlockIcon
} from '@mui/icons-material';
import { useSocket } from '../hooks/useSocket';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const instruments = [
  { id: 'violao', name: 'Violão', icon: '/images/instruments/guitar.svg', color: '#8B4513' },
  { id: 'guitarra', name: 'Guitarra', icon: '/images/instruments/guitar.svg', color: '#DC143C' },
  { id: 'baixo', name: 'Baixo', icon: '/images/instruments/guitar.svg', color: '#4169E1' },
  { id: 'bateria', name: 'Bateria', icon: '/images/instruments/drums.svg', color: '#FF8C00' },
  { id: 'teclado', name: 'Teclado', icon: '/images/instruments/keyboard.svg', color: '#4B0082' },
  { id: 'voz', name: 'Voz', icon: '/images/instruments/vocal.svg', color: '#800080' },
  { id: 'violino', name: 'Violino', icon: '/images/instruments/guitar.svg', color: '#B8860B' },
  { id: 'saxofone', name: 'Saxofone', icon: '/images/instruments/guitar.svg', color: '#CD853F' },
  { id: 'trompete', name: 'Trompete', icon: '/images/instruments/guitar.svg', color: '#FFD700' },
  { id: 'outro', name: 'Outro', icon: '/images/instruments/guitar.svg', color: '#708090' }
];

export default function LoginScreen() {
  const navigate = useNavigate();
  const { socket, connected, error: socketError } = useSocket();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [instrument, setInstrument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [selectedInstrumentObj, setSelectedInstrumentObj] = useState(null);
  const [activeRooms, setActiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (connected && socketError) {
      setError(null);
    } else if (socketError) {
      setError(`Erro de conexão com o servidor: ${socketError}`);
    }
  }, [connected, socketError]);

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

  const fetchActiveRooms = () => {
    if (!socket || !connected) return;
    
    setLoadingRooms(true);
    socket.emit('get_active_rooms');
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoom(id);
  };

  const handleCreateRoom = useCallback(() => {
    if (!name || !instrument) {
      setError('Por favor, preencha seu nome e instrumento');
      return;
    }
    if (!socket || !connected) {
      setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!socket) {
        throw new Error('Não foi possível conectar ao servidor');
      }

      socket.once('create_room_success', ({ room: createdRoom }) => {
        console.log('create_room_success recebido:', createdRoom);
        setIsLoading(false);
        navigate(`/room/${createdRoom.id}`, {
          replace: true,
          state: {
            name,
            instrument,
            isAdmin: true,
            initialAudioEnabled: audioEnabled,
            initialVideoEnabled: videoEnabled
          }
        });
      });

      socket.once('create_room_error', ({ message }) => {
        console.error('create_room_error recebido:', message);
        setError(`Erro ao criar sala: ${message}`);
        setIsLoading(false);
      });

      socket.emit('create_room', { 
        name, 
        instrument, 
        noMedia: !audioEnabled && !videoEnabled
      });

    } catch (err) {
      setIsLoading(false);
      setError('Erro ao conectar com o servidor');
    }
  }, [name, instrument, audioEnabled, videoEnabled, socket, connected, navigate, isLoading]);

  const handleJoinRoom = useCallback(() => {
    if (!name || !room || !instrument) {
      setError('Por favor, preencha todos os campos para entrar na sala');
      return;
    }
    if (!socket || !connected) {
      setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!socket) {
        throw new Error('Não foi possível conectar ao servidor');
      }

      socket.once('join_room_success', ({ room: joinedRoom }) => {
        console.log('join_room_success recebido:', joinedRoom);
        setIsLoading(false);
        navigate(`/room/${joinedRoom.id}`, {
          replace: true,
          state: {
            name,
            instrument,
            isAdmin: false,
            initialAudioEnabled: audioEnabled,
            initialVideoEnabled: videoEnabled
          }
        });
      });

      socket.once('join_room_error', ({ message }) => {
        console.error('join_room_error recebido:', message);
        setError(`Erro ao entrar na sala: ${message}`);
        setIsLoading(false);
      });

      socket.emit('join_room', { 
        roomId: room, 
        name, 
        instrument, 
        hasMedia: audioEnabled || videoEnabled
      });

    } catch (err) {
      setIsLoading(false);
      setError('Erro ao conectar com o servidor');
    }
  }, [name, room, instrument, audioEnabled, videoEnabled, socket, connected, navigate, isLoading]);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(room);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      generateRoomId();
    } else if (newValue === 1) {
      fetchActiveRooms();
    }
  };

  const handleSelectRoom = (roomId) => {
    setRoom(roomId);
    setTabValue(2); // Mudar para a aba "Entrar em Sala"
  };

  const handleToggleAudio = async () => {
    try {
      if (!audioEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false 
        });
        stream.getTracks().forEach(track => track.stop());
      }
      setAudioEnabled(!audioEnabled);
      setError(null);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      setError('Não foi possível acessar o microfone. Verifique suas permissões.');
      setAudioEnabled(false);
    }
  };

  const handleToggleVideo = async () => {
    try {
      if (!videoEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: false,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        stream.getTracks().forEach(track => track.stop());
      }
      setVideoEnabled(!videoEnabled);
      setError(null);
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera. Verifique suas permissões.');
      setVideoEnabled(false);
    }
  };

  // Função para formatar a duração da sala
  const formatRoomDuration = (createdAt) => {
    if (!createdAt) return 'N/A';
    
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}min`;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
        {/* Logo e Título */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <Box 
            component="img"
            src="/logo.svg"
            alt="Mesa Digital"
            sx={{ 
              width: 120, 
              height: 120, 
              mb: 2,
              filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              color: theme.palette.primary.main,
              textAlign: 'center' 
            }}
          >
            Mesa Digital
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary" 
            sx={{ mt: 1, textAlign: 'center' }}
          >
            Colaboração musical em tempo real
          </Typography>
        </Box>

        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            required
            label="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />

          {/* Seleção de Instrumento com novo design */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Selecione seu instrumento:
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'auto', maxHeight: '200px' }}>
            <List sx={{ py: 0 }}>
              {instruments.map((inst, index) => (
                <React.Fragment key={inst.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItemButton 
                    selected={instrument === inst.id}
                    onClick={() => setInstrument(inst.id)}
                    sx={{ 
                      py: 1,
                      px: 2,
                      transition: 'all 0.2s',
                      '&.Mui-selected': {
                        bgcolor: `${inst.color}20`,
                        '&:hover': {
                          bgcolor: `${inst.color}30`,
                        }
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={inst.icon}
                        alt={inst.name}
                        sx={{ 
                          bgcolor: instrument === inst.id ? inst.color : 'rgba(0,0,0,0.1)',
                          transition: 'all 0.3s'
                        }}
                      >
                        <MusicIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={inst.name}
                      primaryTypographyProps={{
                        fontWeight: instrument === inst.id ? 'bold' : 'regular'
                      }}
                    />
                    {instrument === inst.id && (
                      <CheckIcon color="primary" />
                    )}
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          </Card>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              sx={{ 
                '& .MuiTab-root': { 
                  fontWeight: 'medium',
                  borderRadius: '8px 8px 0 0',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                  },
                }
              }}
            >
              <Tab 
                label="Criar Nova Sala" 
                icon={<AddIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Salas Ativas" 
                icon={<GroupIcon />}
                iconPosition="start" 
              />
              <Tab 
                label="Entrar em Sala" 
                icon={<MusicIcon />}
                iconPosition="start" 
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ 
              bgcolor: 'background.paper', 
              p: 2, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  ID da Sala:
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    bgcolor: 'action.hover', 
                    px: 2, 
                    py: 1, 
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    letterSpacing: 1,
                    flexGrow: 1,
                    textAlign: 'center'
                  }}
                >
                  {room}
                </Typography>
                <Tooltip title="Copiar ID da Sala">
                  <IconButton onClick={handleCopyRoomId} color="primary">
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={audioEnabled}
                      onChange={handleToggleAudio}
                      color="primary"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MicIcon color={audioEnabled ? "primary" : "disabled"} />
                      <Typography variant="body2">
                        {audioEnabled ? "Microfone ativado" : "Microfone desativado"}
                      </Typography>
                    </Stack>
                  }
                />
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={videoEnabled}
                      onChange={handleToggleVideo}
                      color="primary"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CameraIcon color={videoEnabled ? "primary" : "disabled"} />
                      <Typography variant="body2">
                        {videoEnabled ? "Câmera ativada" : "Câmera desativada"}
                      </Typography>
                    </Stack>
                  }
                />
              </Stack>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleCreateRoom}
              disabled={isLoading || !name || !instrument}
              sx={{ 
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 5,
                },
              }}
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : null}
            >
              {isLoading ? 'Criando Sala...' : 'Criar e Entrar'}
            </Button>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="h6">
                  Salas Disponíveis
                </Typography>
                <Tooltip title="Atualizar lista de salas">
                  <IconButton onClick={fetchActiveRooms} disabled={loadingRooms}>
                    {loadingRooms ? (
                      <CircularProgress size={24} />
                    ) : (
                      <RefreshIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>

              {activeRooms.length === 0 ? (
                <Box sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}>
                  <Typography color="text.secondary">
                    {loadingRooms ? 'Carregando salas...' : 'Nenhuma sala ativa no momento'}
                  </Typography>
                  {!loadingRooms && (
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />} 
                      sx={{ mt: 2 }}
                      onClick={() => setTabValue(0)}
                    >
                      Criar uma sala
                    </Button>
                  )}
                </Box>
              ) : (
                <Box sx={{ 
                  maxHeight: 300, 
                  overflowY: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}>
                  <List sx={{ p: 0 }}>
                    {activeRooms.map((activeRoom, index) => (
                      <React.Fragment key={activeRoom.id}>
                        {index > 0 && <Divider />}
                        <ListItemButton
                          onClick={() => handleSelectRoom(activeRoom.id)}
                          sx={{ 
                            py: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Badge
                              badgeContent={activeRoom.users.length}
                              color="primary"
                              overlap="circular"
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                              }}
                            >
                              <Avatar sx={{ bgcolor: activeRoom.private ? 'warning.main' : 'success.main' }}>
                                {activeRoom.private ? <LockIcon /> : <GroupIcon />}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                  Sala {activeRoom.id}
                                </Typography>
                                {activeRoom.private && (
                                  <Chip 
                                    label="Privada" 
                                    size="small"
                                    icon={<LockIcon fontSize="small" />}
                                    color="warning"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PersonIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {activeRoom.users.length} participante{activeRoom.users.length !== 1 ? 's' : ''}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <TimeIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    Ativa há {formatRoomDuration(activeRoom.createdAt)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRoom(activeRoom.id);
                            }}
                            sx={{ minWidth: '100px' }}
                          >
                            Entrar
                          </Button>
                        </ListItemButton>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ 
              bgcolor: 'background.paper', 
              p: 2, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <TextField
                fullWidth
                required
                label="ID da Sala"
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
                margin="normal"
                placeholder="Digite o ID da sala"
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />

              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={audioEnabled}
                      onChange={handleToggleAudio}
                      color="primary"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MicIcon color={audioEnabled ? "primary" : "disabled"} />
                      <Typography variant="body2">
                        {audioEnabled ? "Microfone ativado" : "Microfone desativado"}
                      </Typography>
                    </Stack>
                  }
                />
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={videoEnabled}
                      onChange={handleToggleVideo}
                      color="primary"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CameraIcon color={videoEnabled ? "primary" : "disabled"} />
                      <Typography variant="body2">
                        {videoEnabled ? "Câmera ativada" : "Câmera desativada"}
                      </Typography>
                    </Stack>
                  }
                />
              </Stack>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleJoinRoom}
              disabled={isLoading || !name || !instrument || !room}
              sx={{ 
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 5,
                },
              }}
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : null}
            >
              {isLoading ? 'Entrando...' : 'Entrar na Sala'}
            </Button>
          </TabPanel>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {socketError && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            {socketError}
          </Alert>
        )}
      </Paper>

      <Snackbar
        open={copiedToClipboard}
        autoHideDuration={2000}
        message="ID da sala copiado para a área de transferência"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
