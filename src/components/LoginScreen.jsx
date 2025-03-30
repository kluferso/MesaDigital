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
  Snackbar
} from '@mui/material';
import {
  MusicNote as MusicIcon,
  ContentCopy as CopyIcon,
  MicNone as MicIcon,
  VideocamOutlined as CameraIcon
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
  'Violão',
  'Guitarra',
  'Baixo',
  'Bateria',
  'Teclado',
  'Voz',
  'Violino',
  'Saxofone',
  'Trompete',
  'Outro'
];

export default function LoginScreen() {
  const navigate = useNavigate();
  const { socket, connected, error: socketError } = useSocket();

  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [instrument, setInstrument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);

  useEffect(() => {
    if (connected && socketError) {
      setError(null);
    } else if (socketError) {
      setError(`Erro de conexão com o servidor: ${socketError}`);
    }
  }, [connected, socketError]);

  useEffect(() => {
    generateRoomId();
  }, []);

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
    }
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

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <MusicIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h5">
            Mesa Digital
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
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Instrumento</InputLabel>
            <Select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              label="Instrumento"
            >
              {instruments.map((inst) => (
                <MenuItem key={inst} value={inst}>
                  {inst}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Criar Nova Sala" />
              <Tab label="Entrar em Sala" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                fullWidth
                label="Código da sala"
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
              />
              <Tooltip title={copiedToClipboard ? "Copiado!" : "Copiar código"}>
                <IconButton 
                  onClick={handleCopyRoomId}
                  color={copiedToClipboard ? "success" : "default"}
                >
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.default', 
              borderRadius: 1,
              mb: 3
            }}>
              <Typography variant="subtitle2" gutterBottom>
                Dispositivos de Mídia
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={audioEnabled}
                      onChange={handleToggleAudio}
                      icon={<MicIcon />}
                      checkedIcon={<MicIcon />}
                    />
                  }
                  label="Microfone"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={videoEnabled}
                      onChange={handleToggleVideo}
                      icon={<CameraIcon />}
                      checkedIcon={<CameraIcon />}
                    />
                  }
                  label="Câmera"
                />
                <Typography variant="caption" color="text.secondary">
                  Você pode alterar essas configurações depois de entrar na sala
                </Typography>
              </Stack>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleCreateRoom}
              disabled={isLoading || !connected}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Criar Nova Sala'}
            </Button>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                fullWidth
                label="Código da sala"
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
              />
            </Box>

            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.default', 
              borderRadius: 1,
              mb: 3
            }}>
              <Typography variant="subtitle2" gutterBottom>
                Dispositivos de Mídia
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={audioEnabled}
                      onChange={handleToggleAudio}
                      icon={<MicIcon />}
                      checkedIcon={<MicIcon />}
                    />
                  }
                  label="Microfone"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={videoEnabled}
                      onChange={handleToggleVideo}
                      icon={<CameraIcon />}
                      checkedIcon={<CameraIcon />}
                    />
                  }
                  label="Câmera"
                />
                <Typography variant="caption" color="text.secondary">
                  Você pode alterar essas configurações depois de entrar na sala
                </Typography>
              </Stack>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleJoinRoom}
              disabled={isLoading || !connected}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Entrar na Sala'}
            </Button>
          </TabPanel>

          {error && (
            <Snackbar 
              open={!!error} 
              autoHideDuration={6000} 
              onClose={() => setError('')}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            </Snackbar>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
