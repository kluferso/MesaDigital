import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Button,
  Stack,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Drawer,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ExitToApp as ExitIcon,
  Refresh as RefreshIcon,
  VolumeUp as VolumeUpIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
  ScreenShare as ScreenShareIcon,
  Chat as ChatIcon,
  GraphicEq as GraphicEqIcon
} from '@mui/icons-material';

import { useSocket } from '../hooks/useSocket';
import useWebRTC from '../hooks/useWebRTC';
import AudioMixer from './AudioMixer';
import VideoGrid from './VideoGrid';
import ChatBox from './ChatBox';

const RoomScreen = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected, error: socketError, reconnect } = useSocket();

  // Estado local
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [initAttempts, setInitAttempts] = useState(0);
  const [initializationStep, setInitializationStep] = useState(0); // 0: Connect, 1: Media, 2: Join Room
  const [isInitializing, setIsInitializing] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [localUserData] = useState(() => {
    const state = location.state || {};
    return {
      name: state.name || '',
      instrument: state.instrument || '',
      isAdmin: false
    };
  });

  // WebRTC hook
  const {
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
    mediaError,
    mediaStatus,
    initializeLocalMedia
  } = useWebRTC(roomId);

  const MAX_INIT_ATTEMPTS = 3;

  // Definição dos passos de inicialização
  const steps = [
    {
      label: 'Conectar ao servidor',
      description: 'Estabelecendo conexão segura...',
      icon: <PendingIcon />,
      errorIcon: <ErrorIcon />,
      successIcon: <CheckCircleIcon />
    },
    {
      label: 'Acessar Microfone/Câmera',
      description: 'Solicitando permissão de acesso aos dispositivos.',
      icon: <PendingIcon />,
      errorIcon: <ErrorIcon />,
      successIcon: <CheckCircleIcon />
    },
    {
      label: 'Entrar na Sala de Colaboração',
      description: 'Verificando detalhes e conectando à sala...',
      icon: <PendingIcon />,
      errorIcon: <ErrorIcon />,
      successIcon: <CheckCircleIcon />
    }
  ];

  // Handler para atualizar lista de participantes
  const updateParticipantList = useCallback((users) => {
    if (!socket) return;
    
    const participantList = users.map(user => ({
      ...user,
      isLocal: user.id === socket.id,
      stream: user.id === socket.id ? localStream : remoteStreams[user.id],
      audioEnabled: user.id === socket.id ? audioEnabled : true, // Assumir true para remotos inicialmente
      videoEnabled: user.id === socket.id ? videoEnabled : true  // Assumir true para remotos inicialmente
    }));

    setParticipants(participantList);
  }, [socket, localStream, remoteStreams, audioEnabled, videoEnabled]);

  // Lógica de inicialização passo a passo
  useEffect(() => {
    // Validar dados iniciais
    if (!roomId || !localUserData.name || !localUserData.instrument) {
      setError('Dados de entrada inválidos. Volte e tente novamente.');
      setInitializationStep(steps.length); // Ir para estado de erro
      return;
    }

    // 1. Conectar Socket
    if (initializationStep === 0) {
      if (connected) {
        console.log('Passo 1: Socket conectado.');
        setInitializationStep(1);
      } else if (socketError) {
        console.error('Passo 1: Erro de conexão com socket:', socketError);
        setError(`Falha ao conectar ao servidor: ${socketError}. Tente recarregar a página.`);
        setInitializationStep(steps.length); // Erro
      }
      // Aguardar conexão ou erro do useSocket
    }

    // 2. Inicializar Mídia
    else if (initializationStep === 1) {
      if (mediaStatus === 'idle') {
        console.log('Passo 2: Iniciando solicitação de mídia...');
        initializeLocalMedia();
      } else if (mediaStatus === 'success') {
        console.log('Passo 2: Mídia inicializada com sucesso.');
        setInitializationStep(2);
      } else if (mediaStatus === 'error') {
        console.warn('Passo 2: Erro ao inicializar mídia, continuando sem ela...');
        // Permitir continuar mesmo com erro de mídia, mas notificar
        setInitializationStep(2); 
      }
      // Aguardar status do useWebRTC
    }

    // 3. Entrar na Sala
    else if (initializationStep === 2) {
      if (!socket || !connected) {
        setError('Conexão perdida antes de entrar na sala.');
        setInitializationStep(steps.length); // Erro
        return;
      }
      
      console.log(`Passo 3: Tentando entrar na sala (tentativa ${initAttempts + 1})...`);

      const handleJoinSuccess = ({ room: newRoom, users: initialUsers }) => {
        console.log('Passo 3: Entrada na sala bem sucedida!', newRoom);
        setRoom(newRoom);
        updateParticipantList(initialUsers || newRoom.users || []);
        setIsInitializing(false); // Sai da tela de inicialização
        setError(null);
        setInitializationStep(3); // Sucesso final
      };

      const handleJoinError = ({ message }) => {
        console.error(`Passo 3: Erro ao entrar na sala (tentativa ${initAttempts + 1}):`, message);
        if (initAttempts + 1 < MAX_INIT_ATTEMPTS) {
          console.log('Tentando entrar novamente...');
          setInitAttempts(prev => prev + 1);
          // Voltar para o início do passo 3 para retentar
          socket.emit('join_room', {
            roomId,
            name: localUserData.name,
            instrument: localUserData.instrument,
            hasMedia: !!localStream && mediaStatus === 'success' // Enviar status correto da mídia
          });
        } else {
          setError(`Falha ao entrar na sala após ${MAX_INIT_ATTEMPTS} tentativas: ${message}`);
          setInitializationStep(steps.length); // Erro final
        }
      };

      // Listeners específicos para este passo
      socket.on('join_room_success', handleJoinSuccess);
      socket.on('join_room_error', handleJoinError);

      // Emitir o evento para entrar na sala
      socket.emit('join_room', {
        roomId,
        name: localUserData.name,
        instrument: localUserData.instrument,
        hasMedia: !!localStream && mediaStatus === 'success' // Enviar status correto da mídia
      });
      
      // Cleanup para este passo
      return () => {
        socket.off('join_room_success', handleJoinSuccess);
        socket.off('join_room_error', handleJoinError);
      };
    }

  }, [initializationStep, connected, socketError, mediaStatus, initializeLocalMedia, socket, roomId, localUserData, initAttempts, updateParticipantList, localStream, steps.length]);

  // Efeito para listeners gerais da sala (após inicialização)
  useEffect(() => {
    if (!socket || !connected || initializationStep !== 3) return;

    const handleUserJoined = ({ user }) => {
      console.log('Outro usuário entrou:', user);
      setParticipants(prev => {
        const exists = prev.some(p => p.id === user.id);
        if (exists) return prev;
        return [...prev, {
          ...user,
          isLocal: false,
          stream: remoteStreams[user.id], // Stream virá via WebRTC
          audioEnabled: true, // Assumir true inicialmente
          videoEnabled: true
        }];
      });
      // Lógica WebRTC para conectar ao novo usuário seria iniciada aqui
    };

    const handleUserLeft = ({ userId }) => {
      console.log('Usuário saiu:', userId);
      setParticipants(prev => Array.isArray(prev) ? prev.filter(p => p && p.id !== userId) : []);
      // Lógica WebRTC para desconectar do usuário seria feita aqui
    };

    const handleUserList = ({ users }) => {
      console.log('Lista de usuários atualizada pelo servidor:', users);
      updateParticipantList(users);
    };
    
    // Registrar listeners gerais
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('user_list', handleUserList);
    // TODO: Adicionar listeners para WebRTC (offer, answer, candidate)

    return () => {
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('user_list', handleUserList);
      // TODO: Remover listeners WebRTC
      
      // Sair da sala ao desmontar o componente
      console.log('Saindo da sala ao desmontar...');
      socket.emit('leave_room');
    };

  }, [socket, connected, initializationStep, updateParticipantList, remoteStreams]);

  // Configurar listener de mensagens do chat
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = (message) => {
      if (!isChatOpen) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    socket.on('chat_message', handleNewMessage);

    return () => {
      socket.off('chat_message', handleNewMessage);
    };
  }, [socket, connected, isChatOpen]);

  // Resetar contador de mensagens não lidas quando o chat é aberto
  useEffect(() => {
    if (isChatOpen) {
      setUnreadMessages(0);
    }
  }, [isChatOpen]);

  // Handler para tentar novamente em caso de erro
  const handleRetry = useCallback(() => {
    setError(null);
    setInitAttempts(0);
    setInitializationStep(0); // Reinicia todo o processo
    if (!connected) {
      reconnect(); // Tenta reconectar o socket se necessário
    }
    // A lógica no useEffect cuidará dos próximos passos
  }, [connected, reconnect]);

  // --- Renderização ---

  // Tela de Inicialização com Stepper
  if (initializationStep < steps.length) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 3 
        }}>
          <Typography variant="h4" gutterBottom>Entrando na Sala...</Typography>
          <Stepper activeStep={initializationStep} orientation="vertical" sx={{ width: '100%' }}>
            {steps.map((step, index) => (
              <Step key={step.label} completed={initializationStep > index} expanded>
                <StepLabel
                  icon={
                    initializationStep > index ? step.successIcon :
                    initializationStep === index ? step.icon :
                    null // Não mostra ícone para passos futuros
                  }
                  error={initializationStep === steps.length && index === error?.stepIndex} // Marcar erro no passo específico se houver
                >
                  {step.label}
                  {initializationStep === index && index === 2 && initAttempts > 0 &&
                    ` (Tentativa ${initAttempts + 1}/${MAX_INIT_ATTEMPTS})`
                  }
                </StepLabel>
                <StepContent>
                  <Typography variant="body2">{step.description}</Typography>
                  {/* Mostrar erro específico do passo, se houver */} 
                  {index === 1 && mediaStatus === 'success' && mediaError && 
                    <Alert severity="warning" sx={{ mt: 1 }}>{mediaError}</Alert>
                  }
                </StepContent>
              </Step>
            ))}
          </Stepper>
          
          {/* Mensagem de Erro Geral */} 
          {error && initializationStep === steps.length && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mt: 2 }}
              action={
                 <IconButton
                    color="inherit"
                    size="small"
                    onClick={handleRetry}
                  >
                    <RefreshIcon />
                  </IconButton>
              }
            >
              {error}
            </Alert>
          )}

          {/* Botão Voltar em caso de erro final */} 
          {error && initializationStep === steps.length && (
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                startIcon={<ExitIcon />}
              >
                Voltar para Início
              </Button>
              <Button
                variant="contained"
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
              >
                Tentar Novamente
              </Button>
            </Stack>
          )}

          {/* Indicador de progresso enquanto inicializa */} 
          {initializationStep < steps.length && !error && (
             <CircularProgress sx={{ mt: 2 }} />
          )}

        </Box>
      </Container>
    );
  }

  // --- Tela Principal da Sala (após inicialização bem-sucedida) ---
  if (!room || !participants) {
    // Segurança: Se chegou aqui sem sala ou participantes, mostrar erro
    return (
      <Container>
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <Alert severity="error">Erro inesperado: Não foi possível carregar os dados da sala.</Alert>
        </Box>
      </Container>
    );
  }

  // Encontrar o usuário local na lista de participantes
  const localParticipant = participants.find(p => p.isLocal);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'black',
      overflow: 'hidden'
    }}>
      {/* Cabeçalho simples */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: { xs: 1, sm: 1.5 },
        bgcolor: '#1e1e1e',
        zIndex: 5
      }}>
        <Typography variant="h6" sx={{ color: 'white', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Sala: {room.id}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" sx={{ color: 'white' }}>
            <FullscreenIcon />
          </IconButton>
          <IconButton size="small" sx={{ color: 'white' }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Área principal com vídeos em grade */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        overflow: 'hidden',
        bgcolor: '#121212',
        position: 'relative'
      }}>
        {/* Grade de vídeos */}
        <Box sx={{ 
          width: '100%',
          height: '100%',
          p: 1
        }}>
          <VideoGrid 
            participants={participants}
            localParticipantId={socket?.id}
          />
        </Box>

        {/* Drawer de chat */}
        <Drawer
          anchor="right"
          open={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          variant="persistent"
          sx={{
            width: isChatOpen ? 320 : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 320,
              boxSizing: 'border-box',
              bgcolor: '#1e1e1e',
              color: 'white',
              border: 'none',
              top: '64px', // Altura do header
              height: 'calc(100% - 64px - 56px)', // Menos o header e o footer
            },
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            p: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
              <Typography variant="h6">Chat da Sala</Typography>
              <IconButton size="small" onClick={() => setIsChatOpen(false)} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <ChatBox
                roomId={roomId}
                participants={participants}
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
                embedded={true} // Novo modo incorporado
              />
            </Box>
          </Box>
        </Drawer>
      </Box>

      {/* Barra de controles inferior */}
      <Paper
        elevation={3} 
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 0.5, sm: 1 },
          borderRadius: 0,
          bgcolor: '#1e1e1e'
        }}
      >
        <Stack 
          direction="row" 
          spacing={{ xs: 0.5, sm: 1 }}
          alignItems="center"
          justifyContent="center"
          sx={{ 
            flexGrow: 1,
            maxWidth: 600
          }}
        >
          {/* Controle de microfone */}
          <Tooltip title={audioEnabled ? "Desativar microfone" : "Ativar microfone"}>
            <IconButton
              onClick={toggleAudio}
              color={audioEnabled ? "primary" : "default"}
              sx={{ 
                color: audioEnabled ? 'white' : 'grey.500', 
                bgcolor: audioEnabled ? 'transparent' : 'rgba(255,255,255,0.1)',
                p: { xs: 1, sm: 1.5 }
              }}
            >
              {audioEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </Tooltip>

          {/* Controle de vídeo */}
          <Tooltip title={videoEnabled ? "Desativar câmera" : "Ativar câmera"}>
            <IconButton
              onClick={toggleVideo}
              color={videoEnabled ? "primary" : "default"}
              sx={{ 
                color: videoEnabled ? 'white' : 'grey.500', 
                bgcolor: videoEnabled ? 'transparent' : 'rgba(255,255,255,0.1)',
                p: { xs: 1, sm: 1.5 }
              }}
            >
              {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
          </Tooltip>

          {/* Botão de compartilhamento de tela */}
          <Tooltip title="Compartilhar tela">
            <IconButton
              color="default"
              sx={{ 
                color: 'white', 
                p: { xs: 1, sm: 1.5 },
                display: { xs: 'none', sm: 'flex' } 
              }}
            >
              <ScreenShareIcon />
            </IconButton>
          </Tooltip>

          {/* Botão de chat */}
          <Tooltip title="Chat">
            <IconButton
              onClick={() => setIsChatOpen(!isChatOpen)}
              color={isChatOpen ? "primary" : "default"}
              sx={{ 
                color: isChatOpen ? 'white' : 'grey.500',
                bgcolor: isChatOpen ? 'rgba(144, 202, 249, 0.2)' : 'transparent',
                p: { xs: 1, sm: 1.5 }
              }}
            >
              <Badge badgeContent={!isChatOpen && unreadMessages} color="error">
                <ChatIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Botão de mixer */}
          <Tooltip title="Mixer de Áudio">
            <IconButton
              onClick={() => setIsMixerOpen(!isMixerOpen)}
              color="default"
              sx={{ color: isMixerOpen ? 'white' : 'grey.500', p: { xs: 1, sm: 1.5 } }}
            >
              <GraphicEqIcon />
            </IconButton>
          </Tooltip>

          {/* Botão de sair */}
          <Tooltip title="Sair da sala">
            <IconButton
              onClick={() => navigate('/')}
              color="error"
              sx={{ p: { xs: 1, sm: 1.5 } }}
            >
              <ExitIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Drawer de Mixer */}
      <Drawer
        anchor="right"
        open={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '100%', // Ocupando toda a largura
            height: '100%', // Ocupando toda a altura
            maxWidth: '100%',
            boxSizing: 'border-box',
            bgcolor: '#1e1e1e',
            color: 'white',
            overflowY: 'auto'
          },
        }}
      >
        <Box sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Mixer de Áudio</Typography>
            <IconButton onClick={() => setIsMixerOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ height: 'calc(100% - 60px)', overflowY: 'auto' }}>
            <AudioMixer 
              participants={participants} 
              localParticipant={localParticipant}
              toggleAudio={toggleAudio}
              toggleVideo={toggleVideo}
              fullWidth={true} // Nova prop para indicar modo tela cheia
            />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default RoomScreen;
