import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Avatar,
  Chip,
  Button,
  Slide,
  Fade,
  useMediaQuery,
  Tooltip,
  Badge,
  Backdrop,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar
} from '@mui/material';

// Icons
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Chat as ChatIcon,
  Equalizer as EqualizerIcon,
  ExitToApp as ExitIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  VolumeUp as VolumeUpIcon,
  VolumeMute as VolumeMuteIcon,
  Info as InfoIcon,
  Favorite as FavoriteIcon,
  ContentCopy as CopyIcon,
  Help as HelpIcon
} from '@mui/icons-material';

// Context
import { useSocket } from '../../contexts/SocketContext';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';

// Components
import AudioControls from '../audio/AudioControls';
import MixerBoard from '../audio/MixerBoard';
import ConnectionQualityIndicator from '../audio/ConnectionQualityIndicator';
import ChatPanel from './ChatPanel';
import MixerPanel from './MixerPanel';
import ParticipantsPanel from './ParticipantsPanel';
import InitializingScreen from './InitializingScreen';
import FullMixerView from './FullMixerView';
import RoomHeader from './RoomHeader';

// Hooks
import { useTranslation } from 'react-i18next';

// Constantes
const DRAWER_WIDTH = 360;

/**
 * Tela principal da sala de estúdio com mesa de mixagem digital
 */
const StudioRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  
  // Socket e WebRTC
  const { socket, connected, error: socketError } = useSocket();
  const {
    isInitialized: webrtcInitialized,
    inRoom: webrtcInRoom,
    users: webrtcUsers,
    localUser,
    audioEnabled,
    userVolumes,
    masterVolume,
    userQualities,
    connectingUsers,
    error: webrtcError,
    joinRoom: joinWebRTCRoom,
    leaveRoom: leaveWebRTCRoom,
    toggleAudio,
    setUserVolume,
    setMasterVolume,
    sendChatMessage
  } = useWebRTC();

  // Estados
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [showMixerFullscreen, setShowMixerFullscreen] = useState(false);
  const [roomLink, setRoomLink] = useState('');
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [helpAnchorEl, setHelpAnchorEl] = useState(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyUsers, setEmergencyUsers] = useState([]);
  const [localUserInfo, setLocalUserInfo] = useState(null);
  const [emergencyInfo, setEmergencyInfo] = useState({
    active: false,
    message: ''
  });

  // Effect para inicializar
  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Verificar se estamos em modo de emergência pela URL
    const queryParams = new URLSearchParams(location.search);
    const emergencyMode = queryParams.get('emergencyMode') === 'true';
    
    if (emergencyMode) {
      setIsEmergencyMode(true);
      setEmergencyInfo({
        active: true,
        message: 'Modo de emergência ativado. Algumas funcionalidades podem estar limitadas.'
      });
      
      // Recuperar dados do localStorage
      const storedName = localStorage.getItem('mesaDigital_userName');
      const storedInstrument = localStorage.getItem('mesaDigital_instrument');
      const storedIsAdmin = localStorage.getItem('mesaDigital_isAdmin') === 'true';
      
      if (storedName && storedInstrument) {
        // Criar usuário local simulado
        const simulatedLocalUser = {
          id: 'local-emergency-' + Date.now(),
          name: storedName,
          instrument: storedInstrument,
          isAdmin: storedIsAdmin,
          emergencyMode: true
        };
        
        setLocalUserInfo(simulatedLocalUser);
        
        // Criar lista simulada com apenas o usuário local
        setEmergencyUsers([simulatedLocalUser]);
      } else {
        // Dados insuficientes, voltar para a tela de login
        setError('Dados insuficientes para modo de emergência');
        setTimeout(() => navigate('/'), 3000);
      }
      
      return;
    }

    // Se não for modo de emergência, tentar conectar normalmente
    if (!connected) {
      setError('Conectando ao servidor...');
    } else if (!webrtcInitialized) {
      setError('Inicializando WebRTC...');
    } else if (!webrtcInRoom) {
      setError('Entrando na sala...');
      
      // Tentar entrar na sala
      const savedName = localStorage.getItem('mesaDigital_userName');
      const savedInstrument = localStorage.getItem('mesaDigital_instrument');
      
      if (savedName && savedInstrument) {
        joinWebRTCRoom(roomId, savedName, savedInstrument)
          .catch(err => {
            console.error('Erro ao entrar na sala:', err);
            setError(`Erro ao entrar na sala: ${err.message}`);
          });
      } else {
        setError('Informações de usuário não disponíveis');
        setTimeout(() => navigate('/'), 3000);
      }
    } else {
      setError(null);
      
      // Gerar link da sala
      const roomLink = window.location.origin + '/room/' + roomId;
      setRoomLink(roomLink);
    }
  }, [roomId, connected, webrtcInitialized, webrtcInRoom, navigate, joinWebRTCRoom, location.search]);

  // Verificar se podemos mostrar o conteúdo da sala
  const canShowRoom = (webrtcInRoom || isEmergencyMode) && (localUser || localUserInfo);
  
  // Usuários a serem exibidos (normal ou emergência)
  const displayUsers = isEmergencyMode ? emergencyUsers : webrtcUsers;
  
  // Usuário local a ser exibido (normal ou emergência)
  const displayLocalUser = isEmergencyMode ? localUserInfo : localUser;

  // Sair da sala
  const handleLeaveRoom = () => {
    if (!isEmergencyMode && webrtcInRoom) {
      leaveWebRTCRoom();
    }
    
    // Limpar localStorage
    localStorage.removeItem('mesaDigital_roomId');
    localStorage.removeItem('mesaDigital_userName');
    localStorage.removeItem('mesaDigital_instrument');
    localStorage.removeItem('mesaDigital_isAdmin');
    
    navigate('/');
  };

  // Manipuladores
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMobileMenuOpen = (event) => {
    setHelpAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setHelpAnchorEl(null);
  };

  const handleNewMessage = () => {
    if (activeTab !== 0) {
      setUnreadMessages(prev => prev + 1);
    }
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setNotification({
        show: true,
        message: t('notification.roomIdCopied')
      });
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, show: false });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      overflow: 'hidden', 
      bgcolor: 'background.default'
    }}>
      {/* Tela de inicialização */}
      {!canShowRoom && (
        <InitializingScreen 
          loading={!error} 
          error={error} 
          onRetry={() => window.location.reload()}
          onExit={() => navigate('/')}
        />
      )}
      
      {/* Alerta de Modo Emergencial */}
      {isEmergencyMode && emergencyInfo.active && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="warning" variant="filled">
            {emergencyInfo.message}
          </Alert>
        </Snackbar>
      )}

      {/* Conteúdo da sala quando carregada */}
      {canShowRoom && (
        <Box sx={{ 
          display: 'flex',
          height: '100vh',
          backgroundColor: theme.palette.background.default,
          overflow: 'hidden'
        }}>
          {/* AppBar principal */}
          <AppBar 
            position="fixed" 
            elevation={0}
            sx={{ 
              zIndex: theme.zIndex.drawer + 1,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { xs: 'block', md: drawerOpen ? 'none' : 'block' } }}
              >
                <MenuIcon />
              </IconButton>
              
              <RoomHeader 
                roomId={roomId} 
                onInfoClick={() => setShowRoomInfo(true)}
                onShareClick={handleCopyRoomId}
              />
              
              <Box sx={{ flexGrow: 1 }} />
              
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                <ConnectionQualityIndicator 
                  userId={displayLocalUser?.id} 
                  showText 
                  size="small" 
                />
                
                <AudioControls 
                  compact
                  onMixerClick={() => setShowMixerFullscreen(true)}
                />
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ExitIcon />}
                  size="small"
                  onClick={handleLeaveRoom}
                  sx={{ ml: 1 }}
                >
                  {t('room.leave')}
                </Button>
              </Box>
              
              {/* Menu móvel */}
              <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                  color="inherit"
                  onClick={handleMobileMenuOpen}
                >
                  <Badge badgeContent={activeTab !== 0 ? unreadMessages : 0} color="error">
                    <SettingsIcon />
                  </Badge>
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>
          
          {/* Menu móvel */}
          <Menu
            anchorEl={helpAnchorEl}
            open={Boolean(helpAnchorEl)}
            onClose={handleMobileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              sx: { width: 220, mt: 1 }
            }}
          >
            <MenuItem onClick={() => {
              setActiveTab(0);
              handleDrawerToggle();
              handleMobileMenuClose();
            }}>
              <ListItemIcon>
                <Badge badgeContent={unreadMessages} color="error">
                  <ChatIcon fontSize="small" />
                </Badge>
              </ListItemIcon>
              <ListItemText primary={t('tabs.chat')} />
            </MenuItem>
            
            <MenuItem onClick={() => {
              setShowMixerFullscreen(true);
              handleMobileMenuClose();
            }}>
              <ListItemIcon>
                <EqualizerIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('tabs.mixer')} />
            </MenuItem>
            
            <MenuItem onClick={() => {
              setActiveTab(2);
              handleDrawerToggle();
              handleMobileMenuClose();
            }}>
              <ListItemIcon>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('tabs.participants')} />
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={() => {
              toggleAudio(!audioEnabled);
              handleMobileMenuClose();
            }}>
              <ListItemIcon>
                {audioEnabled ? <MicIcon fontSize="small" color="primary" /> : <MicOffIcon fontSize="small" color="error" />}
              </ListItemIcon>
              <ListItemText primary={audioEnabled ? t('audio.micOn') : t('audio.micOff')} />
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={() => {
              handleLeaveRoom();
              handleMobileMenuClose();
            }}>
              <ListItemIcon>
                <ExitIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary={t('room.leave')} />
            </MenuItem>
          </Menu>
          
          {/* Drawer lateral */}
          <Drawer
            variant={isMobile ? "temporary" : "persistent"}
            open={drawerOpen}
            onClose={handleDrawerToggle}
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                border: 'none',
                borderRight: `1px solid ${theme.palette.divider}`,
                boxShadow: isMobile ? theme.shadows[8] : 'none',
              },
            }}
            ModalProps={{ keepMounted: true }}
          >
            <Toolbar />
            
            <Box sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100% - 64px)' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab 
                  icon={
                    <Badge badgeContent={activeTab !== 0 ? unreadMessages : 0} color="error">
                      <ChatIcon />
                    </Badge>
                  } 
                  label={t('tabs.chat')}
                  id="tab-0"
                  aria-controls="tabpanel-0"
                />
                <Tab 
                  icon={<EqualizerIcon />} 
                  label={t('tabs.mixer')}
                  id="tab-1"
                  aria-controls="tabpanel-1"
                />
                <Tab 
                  icon={<PeopleIcon />} 
                  label={t('tabs.participants')}
                  id="tab-2"
                  aria-controls="tabpanel-2"
                />
              </Tabs>
              
              <Box 
                role="tabpanel"
                hidden={activeTab !== 0}
                id="tabpanel-0"
                aria-labelledby="tab-0"
                sx={{ flexGrow: 1, overflow: 'hidden', display: activeTab === 0 ? 'flex' : 'none' }}
              >
                <ChatPanel 
                  roomId={roomId} 
                  socket={socket} 
                  onNewMessage={handleNewMessage}
                  chatEndRef={chatEndRef}
                />
              </Box>
              
              <Box 
                role="tabpanel"
                hidden={activeTab !== 1}
                id="tabpanel-1"
                aria-labelledby="tab-1"
                sx={{ flexGrow: 1, overflow: 'auto', display: activeTab === 1 ? 'block' : 'none', p: 2 }}
              >
                <MixerPanel 
                  onShowFullMixer={() => setShowMixerFullscreen(true)}
                />
              </Box>
              
              <Box 
                role="tabpanel"
                hidden={activeTab !== 2}
                id="tabpanel-2"
                aria-labelledby="tab-2"
                sx={{ flexGrow: 1, overflow: 'auto', display: activeTab === 2 ? 'block' : 'none', p: 2 }}
              >
                <ParticipantsPanel 
                  participants={displayUsers}
                  localUserId={displayLocalUser?.id}
                  connectingUsers={connectingUsers}
                  qualities={userQualities}
                />
              </Box>
            </Box>
          </Drawer>
          
          {/* Conteúdo principal */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 1, sm: 2, md: 3 },
              width: { xs: '100%', sm: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
              height: '100vh',
              pt: '64px', // Altura da AppBar
              overflow: 'auto',
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            {/* Mensagem de erro */}
            {error && (
              <Alert 
                severity="error" 
                variant="filled"
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            
            {/* Área dos participantes */}
            <Grid container spacing={2}>
              {displayUsers.map(user => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      borderRadius: 2,
                      border: user.id === displayLocalUser?.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[6]
                      }
                    }}
                  >
                    {/* Indicador de qualidade */}
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <ConnectionQualityIndicator userId={user.id} size="small" />
                    </Box>
                    
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        backgroundColor: user.id === displayLocalUser?.id 
                          ? theme.palette.primary.main 
                          : theme.palette.secondary.main,
                        mb: 1,
                        fontSize: '2rem'
                      }}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                    
                    <Typography variant="h6" gutterBottom noWrap sx={{ maxWidth: '100%' }}>
                      {user.name}
                    </Typography>
                    
                    <Chip
                      label={user.instrument}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    
                    {user.id === displayLocalUser?.id ? (
                      <IconButton
                        color={audioEnabled ? 'primary' : 'error'}
                        onClick={() => toggleAudio(!audioEnabled)}
                        sx={{ mt: 'auto' }}
                      >
                        {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                      </IconButton>
                    ) : (
                      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          {t('volume.label')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              const currentVolume = userVolumes[user.id] || 1;
                              setUserVolume(user.id, currentVolume === 0 ? 1 : 0);
                            }}
                          >
                            {(userVolumes[user.id] === 0) ? <VolumeMuteIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Modal de Mixer Completo */}
          <Backdrop
            sx={{ 
              color: '#fff', 
              zIndex: theme.zIndex.drawer + 2,
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }}
            open={showMixerFullscreen}
          >
            <Fade in={showMixerFullscreen}>
              <Box sx={{ 
                width: '95%', 
                maxWidth: 1200, 
                maxHeight: '90vh', 
                overflow: 'auto',
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[24],
                p: { xs: 2, sm: 3, md: 4 },
                position: 'relative'
              }}>
                <IconButton
                  aria-label="close"
                  onClick={() => setShowMixerFullscreen(false)}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                  }}
                >
                  <CloseIcon />
                </IconButton>
                
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
                  {t('mixer.title')}
                </Typography>
                
                <FullMixerView />
              </Box>
            </Fade>
          </Backdrop>
          
          {/* Modal de Informações da Sala */}
          <Backdrop
            sx={{ 
              color: '#fff', 
              zIndex: theme.zIndex.drawer + 2,
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }}
            open={showRoomInfo}
          >
            <Fade in={showRoomInfo}>
              <Box sx={{ 
                width: '95%', 
                maxWidth: 600,
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[24],
                p: { xs: 2, sm: 3, md: 4 },
                position: 'relative'
              }}>
                <IconButton
                  aria-label="close"
                  onClick={() => setShowRoomInfo(false)}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                  }}
                >
                  <CloseIcon />
                </IconButton>
                
                <Typography variant="h5" component="h2" gutterBottom>
                  {t('room.info.title')}
                </Typography>
                
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
                  {t('room.info.id')}
                </Typography>
                <Typography variant="body1" paragraph>
                  {roomId}
                  <IconButton size="small" onClick={handleCopyRoomId} sx={{ ml: 1 }}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Typography>
                
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
                  {t('room.info.participants')}
                </Typography>
                <Typography variant="body1" paragraph>
                  {displayUsers.length} {t('room.info.connectedUsers')}
                </Typography>
                
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
                  {t('room.info.technology')}
                </Typography>
                <Typography variant="body1" paragraph>
                  WebRTC P2P, {t('room.info.lowLatency')}
                </Typography>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={() => setShowRoomInfo(false)}
                    startIcon={<CloseIcon />}
                  >
                    {t('room.info.close')}
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Backdrop>
          
          {/* Notificação */}
          <Snackbar
            open={notification.show}
            autoHideDuration={5000}
            onClose={handleCloseNotification}
            message={notification.message}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default StudioRoom;
