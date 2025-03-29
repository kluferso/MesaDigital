import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  IconButton,
  Typography,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Tooltip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  ExitToApp,
  Menu as MenuIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { useRoom } from '../contexts/RoomContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useTranslation } from 'react-i18next';
import VideoCard from './VideoCard';
import Chat from './Chat';

function Room() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [chatOpen, setChatOpen] = useState(false);
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, users, admin } = useRoom();
  const { socket, connected } = useSocket();
  const { localStream, remoteStreams, initializeMedia } = useWebRTC();
  const { t } = useTranslation();

  useEffect(() => {
    if (!socket || !connected || !room) {
      navigate('/login');
      return;
    }

    const setupMedia = async () => {
      try {
        await initializeMedia({
          audio: true,
          video: true
        });
      } catch (error) {
        console.error('[Room] Erro ao inicializar mídia:', error);
      }
    };

    setupMedia();
  }, [socket, connected, room]);

  const handleLeaveRoom = () => {
    if (socket && room) {
      socket.emit('leave_room', { roomId: room.id });
    }
    navigate('/login');
  };

  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <img 
              src="/logo.png" 
              alt="Mesa Digital" 
              style={{ 
                height: '40px',
                marginRight: '16px',
                filter: 'brightness(0) invert(1)'
              }} 
            />
            <Typography variant="h6" noWrap component="div">
              {room?.name || t('room.title')} - {roomId}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={t('room.toggleChat')}>
              <IconButton color="inherit" onClick={() => setChatOpen(!chatOpen)}>
                <ChatIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('room.leaveRoom')}>
              <IconButton color="inherit" onClick={handleLeaveRoom}>
                <ExitToApp />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: theme.palette.background.default,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('room.participants')}
          </Typography>
          <List>
            {users.map((user) => (
              <ListItem key={user.id}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {user.name[0].toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText 
                  primary={user.name} 
                  secondary={user.instrument || t('room.noInstrument')}
                />
                {user.id === admin?.id && (
                  <Typography variant="caption" color="primary">
                    ({t('room.admin')})
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: '64px',
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          bgcolor: theme.palette.background.default,
        }}
      >
        <Grid container spacing={2}>
          {/* Local video */}
          {localStream && (
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <VideoCard
                key="local-video"
                user={users.find(u => u.id === socket?.id)}
                stream={localStream}
                isLocal={true}
              />
            </Grid>
          )}

          {/* Remote videos */}
          {users
            .filter(user => user.id !== socket?.id)
            .map(user => {
              const remoteStream = remoteStreams[user.id];
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                  <VideoCard
                    user={user}
                    stream={remoteStream}
                    isLocal={false}
                  />
                </Grid>
              );
            })}
        </Grid>
      </Box>

      {/* Chat */}
      {chatOpen && <Chat />}
    </Box>
  );
}

export default Room;
