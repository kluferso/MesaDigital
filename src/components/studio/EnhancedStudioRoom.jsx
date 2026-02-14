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
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link
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
  CloudSync as CloudSyncIcon,
  CenterFocusStrong,
  GridView as GridViewIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  FiberManualRecord as RecordIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  QueueMusic as SetlistIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTranslation } from 'react-i18next';
import ChatPanel from './ChatPanel';
import MixerPanel from './MixerPanel';
import SettingsPanel from './SettingsPanel';
import MusicPlayerPanel from './MusicPlayerPanel';
import SheetMusicPanel from './SheetMusicPanel';
import SetlistPanel from './SetlistPanel';
import ParticipantCard from './ParticipantCard';
import Metronome from './Metronome';
import StageView from './StageView';
import VideoGrid from './VideoGrid';
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
  const { t } = useTranslation();
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
    error: webrtcError,
    audioLevels,
    videoEnabled,
    toggleVideo,
    startRecording,
    stopRecording,
    isRecording,
    lastRecording,
    clearLastRecording
  } = useWebRTC();
  
  // Estado do Socket
  const { socket, connected: socketConnected } = useSocket();
  
  // Estado local da interface
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [reconnectingAlert, setReconnectingAlert] = useState(false);
  const [showReconnectingBackdrop, setShowReconnectingBackdrop] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [centerView, setCenterView] = useState('stage');

  // Estados para redimensionamento de painéis (Resizable Panels)
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('studio_leftPanelWidth');
    return saved ? parseInt(saved, 10) : 280;
  });
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    const saved = localStorage.getItem('studio_rightPanelWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);
  const leftWidthRef = useRef(leftPanelWidth);
  const rightWidthRef = useRef(rightPanelWidth);

  // Atualizar refs quando o estado muda
  useEffect(() => {
    leftWidthRef.current = leftPanelWidth;
  }, [leftPanelWidth]);

  useEffect(() => {
    rightWidthRef.current = rightPanelWidth;
  }, [rightPanelWidth]);

  // Handlers para redimensionamento
  const startResizingLeft = (e) => {
    isResizingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startResizingRight = (e) => {
    isResizingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isResizingLeft.current) {
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      setLeftPanelWidth(newWidth);
    } else if (isResizingRight.current) {
      const containerWidth = document.body.clientWidth;
      const newWidth = Math.max(200, Math.min(500, containerWidth - e.clientX));
      setRightPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    if (isResizingLeft.current || isResizingRight.current) {
      isResizingLeft.current = false;
      isResizingRight.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Persistir preferências
      localStorage.setItem('studio_leftPanelWidth', leftWidthRef.current.toString());
      localStorage.setItem('studio_rightPanelWidth', rightWidthRef.current.toString());
    }
  };

  // Limpar listeners ao desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Efeito para abrir diálogo de download quando a gravação terminar
  useEffect(() => {
    if (lastRecording) {
      setDownloadDialogOpen(true);
    }
  }, [lastRecording]);

  const handleDownloadClose = () => {
    setDownloadDialogOpen(false);
    clearLastRecording();
  };
  
  // Referências para elementos DOM
  const roomContainerRef = useRef(null);
  
  // Efeito para monitorar mudanças no estado de conexão
  useEffect(() => {
    const anyReconnecting = reconnectingUsers.length > 0;
    setReconnectingAlert(anyReconnecting);
    
    if (anyReconnecting) {
      showNotification(
        t('studio.reconnectingBanner', { count: reconnectingUsers.length }),
        'warning'
      );
    }
  }, [reconnectingUsers, t]);
  
  // Efeito para monitorar erros do WebRTC
  useEffect(() => {
    if (webrtcError) {
      showNotification(`${t('errors.connectionError')}: ${webrtcError}`, 'error');
    }
  }, [webrtcError, t]);
  
  // Efeito para monitorar a conexão do socket
  useEffect(() => {
    if (!socketConnected) {
      setShowReconnectingBackdrop(true);
      showNotification(
        t('studio.serverLost'),
        'warning'
      );
    } else {
      setShowReconnectingBackdrop(false);
    }
  }, [socketConnected, t]);
  
  // Efeito para cancelar o backdrop após um tempo máximo (failsafe)
  useEffect(() => {
    let timeoutId;
    
    if (showReconnectingBackdrop) {
      timeoutId = setTimeout(() => {
        setShowReconnectingBackdrop(false);
        showNotification(
          t('studio.reconnectFailed'),
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
        title: t('studio.shareTitle'),
        text: t('studio.shareText', { roomId }),
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
        showNotification(t('studio.linkCopied'), 'success');
      },
      (err) => {
        console.error('Erro ao copiar:', err);
        showNotification(t('studio.linkCopyFailed'), 'error');
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
          {t('studio.enteringTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('studio.enteringSubtitle')}
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
          {t('studio.backToHome')}
        </Button>
      </Box>
    );
  }
  
  // Renderização do layout "Rehearsal First"
  // Divide a tela em: Esquerda (Mixer/Participantes), Centro (Palco/Video), Direita (Chat/Info)
  const renderRehearsalLayout = () => {
    return (
      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', gap: 0 }}>
        {/* COLUNA ESQUERDA: Participantes e Mixer Compacto */}
        <Box sx={{ width: leftPanelWidth, minWidth: 200, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 0 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon fontSize="small" /> {t('studio.participants')}
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              {/* Card do usuário local */}
              <Box sx={{ mb: 2 }}>
                <ParticipantCard
                   user={localUser}
                   isLocal={true}
                   audioEnabled={audioEnabled}
                   videoEnabled={videoEnabled}
                   onToggleAudio={toggleAudio}
                   onToggleVideo={() => toggleVideo(!videoEnabled)}
                   instrument={localUser?.instrument}
                   connectionQuality={{ score: 1 }}
                   connectionState="connected"
                   compact={true}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              {/* Lista de outros usuários */}
              {users.filter(u => u.id !== localUser?.id).map(user => (
                <Box key={user.id} sx={{ mb: 1 }}>
                  <ParticipantCard
                    user={user}
                    volume={userVolumes[user.id] || 1}
                    isMuted={userVolumes[user.id] === 0}
                    onVolumeChange={(vol) => setUserVolume(user.id, vol)}
                    connectionQuality={{ score: getConnectionQualityScore(user.id) }}
                    connectionState={connectionStates[user.id] || 'connected'}
                    instrument={user.instrument}
                    audioLevel={audioLevels[user.id]?.level || 0}
                    audioStatus={audioLevels[user.id]?.status || 'normal'}
                    compact={true}
                  />
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
               <Typography variant="caption" color="text.secondary">{t('studio.quickMixer')}</Typography>
               {/* Mini mixer controls could go here */}
            </Box>
          </Paper>
        </Box>

        {/* Resizer Esquerdo */}
        <Box
          onMouseDown={startResizingLeft}
          sx={{
            width: '6px',
            cursor: 'col-resize',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px solid',
            borderRight: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'primary.main', opacity: 0.5 },
            transition: 'all 0.2s',
            zIndex: 10
          }}
        >
            <Box sx={{ width: '2px', height: '20px', bgcolor: 'text.disabled', borderRadius: 1 }} />
        </Box>

        {/* COLUNA CENTRAL: Palco e Vídeo (Spotlight) */}
        <Box sx={{ flexGrow: 1, height: '100%', minWidth: 300, display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ height: '100%', position: 'relative', overflow: 'hidden', bgcolor: '#000', display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
            {/* Toolbar do palco */}
            <Box sx={{ 
              p: 1, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
              zIndex: 10
            }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                 <Typography variant="subtitle1" sx={{ color: 'white' }}>{t('studio.stageTitle')}</Typography>
                 
                 {/* Alternar Visualização Central */}
                 <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, p: 0.5 }}>
                   <Tooltip title={t('studio.stageView', 'Palco Virtual')}>
                      <IconButton 
                        size="small" 
                        onClick={() => setCenterView('stage')}
                        sx={{ color: centerView === 'stage' ? 'primary.main' : 'rgba(255,255,255,0.7)' }}
                      >
                        <CenterFocusStrong fontSize="small" />
                      </IconButton>
                   </Tooltip>
                   <Tooltip title={t('studio.gridView', 'Grade de Vídeo')}>
                      <IconButton 
                        size="small" 
                        onClick={() => setCenterView('grid')}
                        sx={{ color: centerView === 'grid' ? 'primary.main' : 'rgba(255,255,255,0.7)' }}
                      >
                        <GridViewIcon fontSize="small" />
                      </IconButton>
                   </Tooltip>
                   <Tooltip title={t('sheetMusic.title', 'Partituras')}>
                      <IconButton 
                        size="small" 
                        onClick={() => setCenterView('sheet')}
                        sx={{ color: centerView === 'sheet' ? 'primary.main' : 'rgba(255,255,255,0.7)' }}
                      >
                        <PdfIcon fontSize="small" />
                      </IconButton>
                   </Tooltip>
                 </Box>
               </Box>

               <Box sx={{ display: 'flex', gap: 1 }}>
                 {/* Botão de Gravação */}
                 <Tooltip title={isRecording ? t('studio.stopRecording') : t('studio.startRecording')}>
                    <IconButton 
                      size="small" 
                      onClick={isRecording ? stopRecording : startRecording}
                      sx={{ 
                        color: isRecording ? 'error.main' : 'white',
                        bgcolor: isRecording ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
                        '&:hover': { bgcolor: isRecording ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      {isRecording ? <StopIcon /> : <RecordIcon />}
                    </IconButton>
                 </Tooltip>
                 
                 <IconButton size="small" sx={{ color: 'white' }} onClick={() => toggleVideo(!videoEnabled)}>
                   {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                 </IconButton>
               </Box>
            </Box>

            {/* Visualização Principal */}
            <Box sx={{ flexGrow: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
               {centerView === 'stage' ? (
                 <>
                   {/* Camada do Palco Virtual (Posicionamento) */}
                   <StageView roomId={roomId} />
                   
                   {/* Camada de Vídeo (Overlay ou Grid - Implementação futura mais robusta) */}
                   {videoEnabled && (
                     <Box sx={{ 
                       position: 'absolute', 
                       bottom: 20, 
                       right: 20, 
                       width: 160, 
                       height: 120, 
                       bgcolor: '#222', 
                       borderRadius: 2, 
                       border: '1px solid #444',
                       overflow: 'hidden',
                       boxShadow: 3
                     }}>
                       {/* Local Video Preview */}
                       <video 
                         ref={ref => {
                           if (ref && localUser?.stream) ref.srcObject = localUser.stream;
                         }}
                         autoPlay 
                         muted 
                         playsInline 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                       />
                       <Typography variant="caption" sx={{ position: 'absolute', bottom: 2, left: 5, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', px: 0.5, borderRadius: 0.5 }}>
                         {t('studio.you')}
                       </Typography>
                     </Box>
                   )}
                 </>
               ) : centerView === 'grid' ? (
                 <VideoGrid />
               ) : (
                 <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
                   <SheetMusicPanel />
                 </Box>
               )}
            </Box>
          </Paper>
        </Box>

        {/* Resizer Direito */}
        <Box
          onMouseDown={startResizingRight}
          sx={{
            width: '6px',
            cursor: 'col-resize',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px solid',
            borderRight: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'primary.main', opacity: 0.5 },
            transition: 'all 0.2s',
            zIndex: 10
          }}
        >
            <Box sx={{ width: '2px', height: '20px', bgcolor: 'text.disabled', borderRadius: 1 }} />
        </Box>

        {/* COLUNA DIREITA: Chat, Setlist e Ferramentas */}
        <Box sx={{ width: rightPanelWidth, minWidth: 200, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab === 1 ? 0 : (activeTab === 6 ? 1 : (activeTab === 4 ? 2 : 0))} 
                onChange={(_, v) => {
                  if (v === 0) setActiveTab(1);
                  else if (v === 1) setActiveTab(6);
                  else if (v === 2) setActiveTab(4);
                }} 
                variant="fullWidth"
                size="small"
                sx={{ minHeight: 48 }}
              >
                <Tab icon={<ChatIcon fontSize="small" />} aria-label={t('studio.tabChat')} />
                <Tab icon={<SetlistIcon fontSize="small" />} aria-label={t('setlist.title', 'Repertório')} />
                <Tab icon={<SettingsIcon fontSize="small" />} aria-label={t('studio.tabSettings')} />
              </Tabs>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
               {activeTab === 1 && <ChatPanel />}
               {activeTab === 6 && <SetlistPanel />}
               {activeTab === 4 && <SettingsPanel />}
               {/* Fallback for desktop initial state if needed */}
               {![1, 4, 6].includes(activeTab) && isMobile === false && <ChatPanel />}
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  };

  // Conteúdo principal da sala (Legacy Mode - mantido para fallback ou mobile específico)
  const renderMainContent = () => {
    // Se não for mobile, usa o novo layout
    if (!isMobile) {
      return renderRehearsalLayout();
    }
    
    // Mobile continua com abas
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
                      audioLevel={audioLevels[user.id]?.level || 0}
                      audioStatus={audioLevels[user.id]?.status || 'normal'}
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

      case 3: // Palco (Stage View)
        return (
            <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center' 
            }}>
                <Typography variant="h5" sx={{ mb: 3, color: 'text.secondary' }}>
                    {t('studio.stageTitle')}
                </Typography>
                <StageView roomId={roomId} />
            </Box>
        );
        
      case 4: // Configurações
        return <SettingsPanel />;
        
      case 5: // Music Player
        return <MusicPlayerPanel roomId={roomId} />;

      case 6: // Setlist
        return <SetlistPanel />;
        
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
            {t('studio.headerTitle', { roomId })}
          </Typography>
          
          <Chip
            label={t('studio.participantsCount', { count: users.length })}
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
        {/* Metrônomo Compartilhado */}
        <Metronome roomId={roomId} />
        
        {/* Indicador de conexão de socket */}
        <Tooltip title={socketConnected ? t('studio.serverConnected') : t('studio.serverReconnecting')}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {socketConnected ? (
              <Chip 
                icon={<CloudSyncIcon />} 
                label={t('studio.online')}
                size="small" 
                color="success" 
                variant="outlined"
              />
            ) : (
              <Chip 
                icon={<ReconnectingIcon size={16} />}
                label={t('studio.reconnecting')}
                size="small" 
                color="warning" 
                variant="outlined"
                sx={{ animation: 'pulse 1.5s infinite' }}
              />
            )}
          </Box>
        </Tooltip>
        
        {/* Controle de volume principal */}
        <Tooltip title={t('studio.masterVolumeTooltip', { percent: Math.round(masterVolume * 100) })}>
          <IconButton 
            color={masterVolume === 0 ? 'error' : 'primary'}
            onClick={() => setMasterVolume(masterVolume === 0 ? 1 : 0)}
          >
            {masterVolume === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Botão de compartilhar */}
        <Tooltip title={t('studio.shareRoom')}>
          <IconButton color="primary" onClick={handleShareRoom}>
            <ShareIcon />
          </IconButton>
        </Tooltip>
        
        {/* Botão de tela cheia */}
        <Tooltip title={fullscreenMode ? t('studio.exitFullscreen') : t('studio.fullscreen')}>
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
  
  // Componente de navegação em abas (Apenas mobile/tablet ou quando não estiver no modo estúdio completo)
  const NavigationTabs = () => (
    <Paper
      elevation={1}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        display: { xs: 'block', md: 'none' } // Esconder em telas maiores onde o layout de 3 colunas é usado
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab icon={<GroupIcon />} label={t('studio.tabParticipants')} />
        <Tab icon={<ChatIcon />} label={t('studio.tabChat')} />
        <Tab icon={<VolumeUpIcon />} label={t('studio.tabMixer')} />
          <Tab icon={<CenterFocusStrong />} label={t('studio.tabStage')} />
          <Tab icon={<SettingsIcon />} label={t('studio.tabSettings')} />
        <Tab icon={<MusicNoteIcon />} label={t('studio.tabPlayer')} />
        <Tab icon={<SetlistIcon />} label={t('setlist.title', 'Repertório')} />
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
          <Typography variant="h6">{t('studio.menu')}</Typography>
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
          <Tab icon={<GroupIcon />} label={t('studio.tabParticipants')} />
          <Tab icon={<ChatIcon />} label={t('studio.tabChat')} />
          <Tab icon={<VolumeUpIcon />} label={t('studio.tabMixer')} />
          <Tab icon={<CenterFocusStrong />} label={t('studio.tabStage')} />
          <Tab icon={<SettingsIcon />} label={t('studio.tabSettings')} />
          <Tab icon={<MusicNoteIcon />} label={t('studio.tabPlayer')} />
          <Tab icon={<SetlistIcon />} label={t('setlist.title', 'Repertório')} />
        </Tabs>
      </Box>
    </Drawer>
  );
  
  // Renderização do componente principal
  return (
    <Box
      ref={roomContainerRef}
      sx={{
        height: '100vh', // Fixar altura para evitar scroll da página
        backgroundColor: theme.palette.background.default,
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(50, 172, 109, 0.05) 0%, rgba(209, 251, 155, 0.05) 100%)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Container maxWidth={false} sx={{ py: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', px: { xs: 2, md: 3 } }}>
        <RoomHeader />
        
        {/* Navegação mobile apenas */}
        {isMobile && <NavigationTabs />}
        
        {/* Navegação mobile via drawer */}
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
              <Tab icon={<CenterFocusStrong />} />
              <Tab icon={<SettingsIcon />} />
              <Tab icon={<MusicNoteIcon />} />
              <Tab icon={<SetlistIcon />} />
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
          {t('studio.restoringConnections')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowReconnectingBackdrop(false)}
        >
          {t('studio.continueAnyway')}
        </Button>
      </Backdrop>
      
      {/* Diálogo de Download da Gravação */}
      <Dialog open={downloadDialogOpen} onClose={handleDownloadClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('studio.recordingFinished', 'Gravação Finalizada')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 2 }}>
            <Typography variant="body1">
              {t('studio.recordingReadyText', 'Sua gravação do ensaio está pronta para download.')}
            </Typography>
            {lastRecording && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                href={lastRecording.url}
                download={lastRecording.filename}
                size="large"
              >
                {t('studio.downloadRecording', 'Baixar Gravação')}
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">
              {t('studio.recordingDisclaimer', 'A gravação foi processada localmente no seu navegador.')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownloadClose} color="inherit">
            {t('common.close', 'Fechar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navegação mobile via drawer */}
      <MobileNavDrawer />
    </Box>
  );
};

export default EnhancedStudioRoom;
