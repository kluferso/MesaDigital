import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Drawer,
  useMediaQuery,
  Avatar,
  Fade,
  CircularProgress,
  Backdrop,
  Tooltip,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import {
  Chat as ChatIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  MusicNote as MusicNoteIcon,
  VolumeUp as VolumeUpIcon,
  VolumeMute as VolumeMuteIcon,
  Menu as MenuIcon,
  CloseFullscreen as MinimizeIcon,
  OpenInFull as ExpandIcon,
  ArrowBack as BackIcon,
  Share as ShareIcon,
  CloudSync as CloudSyncIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useSocket } from '../../contexts/SocketContext';
import ChatPanel from './ChatPanel';
import MixerPanel from './MixerPanel';
import SettingsPanel from './SettingsPanel';
import ParticipantCard from './ParticipantCard';
import { INSTRUMENTS, getInstrumentIcon } from '../icons/InstrumentIcons';
import { ConnectionQualityIcon, ReconnectingIcon } from '../icons/ConnectionQualityIcon';
import { motion } from 'framer-motion';

// Constantes para animação
const ANIMATION_DURATION = 0.5;

/**
 * Componente da sala de estúdio aprimorada
 */
const EnhancedStudioRoom = () => {
  const theme = useTheme();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Estado do WebRTC
  const {
    users,
    localUser,
    audioEnabled,
    toggleAudio,
    userVolumes,
    setUserVolume,
    masterVolume,
    setMasterVolume,
    inRoom,
    leaveRoom,
    connectionStates,
    reconnectingUsers,
    error: webrtcError
  } = useWebRTC();
  
  // Estado do Socket
  const { connected: socketConnected } = useSocket();
  
  // Estado local da interface
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [reconnectingAlert, setReconnectingAlert] = useState(false);
  const [showReconnectingBackdrop, setShowReconnectingBackdrop] = useState(false);
  
  // Referências para elementos DOM
  const roomContainerRef = useRef(null);
  
  // Efeito para monitorar mudanças no estado de conexão
  useEffect(() => {
    const anyReconnecting = reconnectingUsers.length > 0;
    setReconnectingAlert(anyReconnecting);
    
    if (anyReconnecting) {
      showNotification(
        `Reconectando com ${reconnectingUsers.length} participante(s)...`,
        'warning'
      );
    }
  }, [reconnectingUsers]);
  
  // Efeito para monitorar erros do WebRTC
  useEffect(() => {
    if (webrtcError) {
      showNotification(`Erro de conexão: ${webrtcError}`, 'error');
    }
  }, [webrtcError]);
  
  // Efeito para monitorar a conexão do socket
  useEffect(() => {
    if (!socketConnected) {
      setShowReconnectingBackdrop(true);
      showNotification(
        'Conexão com o servidor perdida. Tentando reconectar...',
        'warning'
      );
    } else {
      setShowReconnectingBackdrop(false);
    }
  }, [socketConnected]);
  
  // Efeito para cancelar o backdrop após um tempo máximo (failsafe)
  useEffect(() => {
    let timeoutId;
    
    if (showReconnectingBackdrop) {
      timeoutId = setTimeout(() => {
        setShowReconnectingBackdrop(false);
        showNotification(
          'Não foi possível restabelecer todas as conexões, mas você pode continuar usando a sala',
          'warning'
        );
      }, 15000); // 15 segundos
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showReconnectingBackdrop]);
  
  // Função para alternar modo de tela cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (roomContainerRef.current.requestFullscreen) {
        roomContainerRef.current.requestFullscreen();
        setFullscreenMode(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreenMode(false);
      }
    }
  };
  
  // Efeito para detectar saída do fullscreen via ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenMode(false);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Manipulador para voltar à tela de login
  const handleBack = () => {
    leaveRoom();
    navigate('/');
  };
  
  // Manipulador para compartilhar sala
  const handleShareRoom = () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mesa Digital - Sala de Estúdio',
        text: `Junte-se a mim na sala de estúdio: ${roomId}`,
        url: shareUrl
      })
      .catch((error) => {
        console.error('Erro ao compartilhar:', error);
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };
  
  // Função auxiliar para copiar para área de transferência
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        showNotification('Link copiado para a área de transferência!', 'success');
      },
      (err) => {
        console.error('Erro ao copiar:', err);
        showNotification('Não foi possível copiar o link', 'error');
      }
    );
  };
  
  // Função para exibir notificações
  const showNotification = (message, severity = 'info') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
  };
  
  // Renderização condicional baseada no estado da sala
  if (!inRoom) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 3,
          background: theme.palette.background.default,
        }}
      >
        <CircularProgress color="primary" size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Entrando na sala de estúdio...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Estabelecendo conexões com outros músicos
        </Typography>
        
        {webrtcError && (
          <Alert severity="error" sx={{ mt: 2, maxWidth: 500 }}>
            {webrtcError}
          </Alert>
        )}
        
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleBack}
          sx={{ mt: 3 }}
        >
          Voltar para a tela inicial
        </Button>
      </Box>
    );
  }
  
  // Conteúdo principal da sala
  const renderMainContent = () => {
    switch (activeTab) {
      case 0: // Participantes
        return (
          <Grid container spacing={3} sx={{ mb: 2 }}>
            {/* Participante local */}
            <Grid item xs={12} sm={6} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_DURATION, delay: 0 }}
              >
                <ParticipantCard
                  user={localUser}
                  isLocal={true}
                  audioEnabled={audioEnabled}
                  videoEnabled={false}
                  onToggleAudio={toggleAudio}
                  onToggleVideo={() => {}}
                  instrument={localUser?.instrument}
                  connectionQuality={{ score: 1 }}
                  connectionState="connected"
                />
              </motion.div>
            </Grid>
            
            {/* Outros participantes */}
            {users
              .filter(user => user.id !== localUser?.id)
              .map((user, index) => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: ANIMATION_DURATION, 
                      delay: 0.1 * (index + 1)
                    }}
                  >
                    <ParticipantCard
                      user={user}
                      volume={userVolumes[user.id] || 1}
                      isMuted={userVolumes[user.id] === 0}
                      onVolumeChange={(vol) => setUserVolume(user.id, vol)}
                      onReconnect={() => {
                        // Lógica para força reconexão
                        showNotification(`Tentando reconectar com ${user.name}...`, 'info');
                      }}
                      connectionQuality={{ score: getConnectionQualityScore(user.id) }}
                      connectionState={connectionStates[user.id] || 'connected'}
                      instrument={user.instrument}
                    />
                  </motion.div>
                </Grid>
              ))}
          </Grid>
        );
        
      case 1: // Chat
        return <ChatPanel />;
        
      case 2: // Mixer
        return <MixerPanel users={users} />;
        
      case 3: // Configurações
        return <SettingsPanel />;
        
      default:
        return null;
    }
  };
  
  // Função para obter a pontuação de qualidade de conexão
  const getConnectionQualityScore = (userId) => {
    // Aqui usaríamos dados reais do ConnectionMonitor
    // Por enquanto, vamos simular diferentes qualidades
    const state = connectionStates[userId];
    
    if (state === 'reconnecting') return 0.3;
    if (state === 'disconnected') return 0;
    
    // Simulação simples para efeito de demonstração
    const baseScore = 0.7;
    const fluctuation = Math.sin(Date.now() / 10000 + userId.charCodeAt(0)) * 0.2;
    return Math.max(0, Math.min(1, baseScore + fluctuation));
  };
  
  // Componente de cabeçalho da sala
  const RoomHeader = () => (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 2,
        background: theme.palette.background.paper,
      }}
    >
      {/* Área esquerda: botão de retorno e título */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={handleBack} color="primary">
          <BackIcon />
        </IconButton>
        
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MusicNoteIcon color="primary" />
            Estúdio: {roomId}
          </Typography>
          
          <Chip
            label={`${users.length} participante(s)`}
            size="small"
            color="primary"
            variant="outlined"
            icon={<GroupIcon fontSize="small" />}
            sx={{ mt: 0.5 }}
          />
        </Box>
      </Box>
      
      {/* Área direita: indicadores e controles */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Indicador de conexão de socket */}
        <Tooltip title={socketConnected ? 'Conectado ao servidor' : 'Reconectando ao servidor'}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {socketConnected ? (
              <Chip 
                icon={<CloudSyncIcon />} 
                label="Online" 
                size="small" 
                color="success" 
                variant="outlined"
              />
            ) : (
              <Chip 
                icon={<ReconnectingIcon size={16} />}
                label="Reconectando" 
                size="small" 
                color="warning" 
                variant="outlined"
                sx={{ animation: 'pulse 1.5s infinite' }}
              />
            )}
          </Box>
        </Tooltip>
        
        {/* Controle de volume principal */}
        <Tooltip title={`Volume principal: ${Math.round(masterVolume * 100)}%`}>
          <IconButton 
            color={masterVolume === 0 ? 'error' : 'primary'}
            onClick={() => setMasterVolume(masterVolume === 0 ? 1 : 0)}
          >
            {masterVolume === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Botão de compartilhar */}
        <Tooltip title="Compartilhar link da sala">
          <IconButton color="primary" onClick={handleShareRoom}>
            <ShareIcon />
          </IconButton>
        </Tooltip>
        
        {/* Botão de tela cheia */}
        <Tooltip title={fullscreenMode ? "Sair da tela cheia" : "Tela cheia"}>
          <IconButton color="primary" onClick={toggleFullscreen}>
            {fullscreenMode ? <MinimizeIcon /> : <ExpandIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Menu móvel */}
        {isMobile && (
          <IconButton 
            edge="end" 
            color="primary" 
            onClick={() => setMobileMenuOpen(true)}
            sx={{ ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
  
  // Componente de navegação em abas
  const NavigationTabs = () => (
    <Paper
      elevation={1}
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden',
        display: { xs: 'none', md: 'block' }
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab icon={<GroupIcon />} label="Participantes" />
        <Tab icon={<ChatIcon />} label="Chat" />
        <Tab icon={<VolumeUpIcon />} label="Mixer" />
        <Tab icon={<SettingsIcon />} label="Configurações" />
      </Tabs>
    </Paper>
  );
  
  // Drawer para navegação móvel
  const MobileNavDrawer = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    >
      <Box sx={{ width: 250, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Menu</Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <BackIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setMobileMenuOpen(false);
          }}
          orientation="vertical"
          variant="scrollable"
        >
          <Tab icon={<GroupIcon />} label="Participantes" />
          <Tab icon={<ChatIcon />} label="Chat" />
          <Tab icon={<VolumeUpIcon />} label="Mixer" />
          <Tab icon={<SettingsIcon />} label="Configurações" />
        </Tabs>
      </Box>
    </Drawer>
  );
  
  // Renderização do componente principal
  return (
    <Box
      ref={roomContainerRef}
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(50, 172, 109, 0.05) 0%, rgba(209, 251, 155, 0.05) 100%)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <RoomHeader />
        <NavigationTabs />
        
        {/* Navegação mobile */}
        {isMobile && (
          <Paper
            elevation={1}
            sx={{
              mb: 3,
              borderRadius: 2,
              overflow: 'hidden',
              display: { xs: 'block', md: 'none' }
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab icon={<GroupIcon />} />
              <Tab icon={<ChatIcon />} />
              <Tab icon={<VolumeUpIcon />} />
              <Tab icon={<SettingsIcon />} />
            </Tabs>
          </Paper>
        )}
        
        {/* Conteúdo principal */}
        <Box sx={{ flexGrow: 1 }}>
          {renderMainContent()}
        </Box>
      </Container>
      
      {/* Notificações */}
      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowAlert(false)}
          severity={alertSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
      
      {/* Backdrop para reconexão */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={showReconnectingBackdrop}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">
          Restabelecendo conexões...
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowReconnectingBackdrop(false)}
        >
          Continuar mesmo assim
        </Button>
      </Backdrop>
      
      {/* Navegação mobile via drawer */}
      <MobileNavDrawer />
    </Box>
  );
};

export default EnhancedStudioRoom;
