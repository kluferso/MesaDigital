import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Tooltip,
  InputAdornment,
  Backdrop,
} from '@mui/material';
import {
  MusicNote,
  Room,
  Add,
  Login as LoginIcon,
  Refresh,
  Settings,
  QueueMusic as LogoIcon,
  ContentCopy,
  Share,
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { useRoom } from '../contexts/RoomContext';
import { useTranslation } from 'react-i18next';

const instruments = [
  'Violão',
  'Guitarra',
  'Baixo',
  'Bateria',
  'Teclado',
  'Voz',
  'Outro',
];

export default function Login() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { socket, isConnected, error: socketError } = useSocket();
  const { joinRoom, error: roomError } = useRoom();

  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [instrument, setInstrument] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaConfig, setMediaConfig] = useState({
    audio: true,
    video: true,
  });
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [initialConnecting, setInitialConnecting] = useState(true);

  // Gerar ID de sala aleatório
  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  // Carregar salas ativas
  const fetchActiveRooms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/active-rooms');
      const data = await response.json();
      setActiveRooms(data.rooms || []);
    } catch (err) {
      console.error('Error fetching active rooms:', err);
      setError(t('login.errorFetchingRooms'));
    }
  };

  useEffect(() => {
    fetchActiveRooms();
    generateRoomId();
    const interval = setInterval(fetchActiveRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // Verificar conexão inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected) {
        setInitialConnecting(false);
      } else {
        setInitialConnecting(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isConnected]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleCreateRoomError = (data) => {
      setLoading(false);
      setError(data.message);
    };

    const handleCreateRoomSuccess = (data) => {
      setLoading(false);
      joinRoom(data.room.id, name, instrument);
    };

    socket.on('create_room_error', handleCreateRoomError);
    socket.on('create_room_success', handleCreateRoomSuccess);

    return () => {
      socket.off('create_room_error', handleCreateRoomError);
      socket.off('create_room_success', handleCreateRoomSuccess);
    };
  }, [socket, name, instrument, joinRoom]);

  if (initialConnecting) {
    return (
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={true}
      >
        <LogoIcon sx={{ fontSize: 60, mb: 2 }} />
        <CircularProgress color="inherit" />
        <Typography variant="h6">
          Conectando ao servidor...
        </Typography>
      </Backdrop>
    );
  }

  if (!isConnected) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <LogoIcon sx={{ fontSize: 80, color: theme.palette.error.main }} />
          <Alert 
            severity="error" 
            variant="filled"
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            }
          >
            {socketError || 'Não foi possível conectar ao servidor. Verifique sua conexão.'}
          </Alert>
        </Box>
      </Container>
    );
  }

  const handleCreateRoom = () => {
    if (!name || !roomId || !instrument) {
      setError(t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    setError('');

    console.log('Emitting create_room event:', {
      name,
      roomId,
      instrument,
      mediaConfig,
    });

    socket?.emit('create_room', {
      name,
      roomId,
      instrument,
      mediaConfig,
    });
  };

  const handleJoinRoom = () => {
    if (!name || !roomId || !instrument) {
      setError(t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    setError('');

    joinRoom(roomId, name, instrument);
  };

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy room ID:', err);
    }
  };

  const handleShareRoom = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mesa Digital',
          text: `Entre na minha sala na Mesa Digital! ID: ${roomId}`,
          url: window.location.href,
        });
      } else {
        handleCopyRoomId();
      }
    } catch (err) {
      console.error('Failed to share room:', err);
    }
  };

  // Verifica se os campos obrigatórios estão preenchidos
  const isFormValid = name && roomId && instrument;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <LogoIcon
          sx={{
            fontSize: 80,
            color: theme.palette.primary.main,
            mb: 2
          }}
        />

        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom color="primary">
            Mesa Digital
          </Typography>

          {(error || roomError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || roomError}
            </Alert>
          )}

          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label={t('login.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="outlined"
              required
            />

            <TextField
              fullWidth
              label={t('login.roomId')}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              variant="outlined"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copiedToClipboard ? "Copiado!" : "Copiar ID"}>
                      <IconButton onClick={handleCopyRoomId}>
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Compartilhar sala">
                      <IconButton onClick={handleShareRoom}>
                        <Share />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Gerar novo ID">
                      <IconButton onClick={generateRoomId}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>{t('login.instrument')}</InputLabel>
              <Select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                label={t('login.instrument')}
              >
                {instruments.map((inst) => (
                  <MenuItem key={inst} value={inst}>
                    {inst}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={mediaConfig.audio}
                    onChange={(e) =>
                      setMediaConfig((prev) => ({
                        ...prev,
                        audio: e.target.checked,
                      }))
                    }
                  />
                }
                label={t('login.enableAudio')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={mediaConfig.video}
                    onChange={(e) =>
                      setMediaConfig((prev) => ({
                        ...prev,
                        video: e.target.checked,
                      }))
                    }
                  />
                }
                label={t('login.enableVideo')}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCreateRoom}
                disabled={loading || !isConnected || !isFormValid}
                startIcon={loading ? <CircularProgress size={20} /> : <Add />}
              >
                {t('login.createRoom')}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleJoinRoom}
                disabled={loading || !isConnected || !isFormValid || activeRooms.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              >
                {t('login.joinRoom')}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tooltip title={t('login.refreshRooms')}>
            <IconButton onClick={fetchActiveRooms} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>

          {activeRooms.length > 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('login.activeRooms', { count: activeRooms.length })}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nenhuma sala disponível
            </Typography>
          )}

          <Tooltip title={t('login.connectionStatus')}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: isConnected ? 'success.main' : 'error.main',
              }}
            />
          </Tooltip>
        </Box>
      </Box>
    </Container>
  );
}
