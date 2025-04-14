import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  IconButton,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Equalizer as EqualizerIcon,
  ArrowBack as ArrowBackIcon,
  NotificationsActive as NotificationsIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import MixerPanel from './MixerPanel';
import ParticipantsPanel from './ParticipantsPanel';
import ChatPanel from './ChatPanel';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';

/**
 * Painel de controle lateral com múltiplas abas
 */
const ControlPanel = ({ 
  open, 
  onClose, 
  roomId, 
  socket, 
  onShowFullMixer, 
  onShowSettings,
  newMessages = 0
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const { t } = useTranslation();
  const { users, localUser, connectionQualities, connectingUsers } = useWebRTC();
  
  // Referência para o fim do chat
  const chatEndRef = React.useRef(null);
  
  // Função para lidar com mudança de aba
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Função para lidar com nova mensagem
  const handleNewMessage = () => {
    // Rolar para o fim do chat se já estiver na aba de chat
    if (activeTab === 2) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: open ? 320 : 0,
        position: 'relative',
        overflow: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        borderLeft: `1px solid ${theme.palette.divider}`
      }}
    >
      {/* Cabeçalho */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {t('controlPanel.title')}
        </Typography>
        <Tooltip title={t('controlPanel.close')}>
          <IconButton onClick={onClose} edge="end">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navegação por abas */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tab 
          icon={<EqualizerIcon />} 
          label={t('controlPanel.tabs.mixer')} 
          id="control-tab-0"
          aria-controls="control-tabpanel-0"
        />
        <Tab 
          icon={<PeopleIcon />} 
          label={t('controlPanel.tabs.participants')} 
          id="control-tab-1"
          aria-controls="control-tabpanel-1"
        />
        <Tab 
          icon={
            <Badge color="error" badgeContent={newMessages} invisible={newMessages === 0}>
              <ChatIcon />
            </Badge>
          } 
          label={t('controlPanel.tabs.chat')} 
          id="control-tab-2"
          aria-controls="control-tabpanel-2"
        />
      </Tabs>

      {/* Conteúdo das abas */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {/* Mixer */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 0}
          id="control-tabpanel-0"
          aria-labelledby="control-tab-0"
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            p: 2,
            display: activeTab === 0 ? 'block' : 'none'
          }}
        >
          <MixerPanel onShowFullMixer={onShowFullMixer} />
        </Box>

        {/* Participantes */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 1}
          id="control-tabpanel-1"
          aria-labelledby="control-tab-1"
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            p: 2,
            display: activeTab === 1 ? 'block' : 'none'
          }}
        >
          <ParticipantsPanel 
            participants={users} 
            localUserId={localUser?.id} 
            connectingUsers={connectingUsers}
            qualities={connectionQualities}
          />
        </Box>

        {/* Chat */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 2}
          id="control-tabpanel-2"
          aria-labelledby="control-tab-2"
          sx={{ 
            flexGrow: 1, 
            overflow: 'hidden',
            display: activeTab === 2 ? 'flex' : 'none',
            flexDirection: 'column'
          }}
        >
          <ChatPanel 
            roomId={roomId} 
            socket={socket} 
            onNewMessage={handleNewMessage}
            chatEndRef={chatEndRef}
          />
        </Box>
      </Box>

      {/* Rodapé com botões adicionais */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<BarChartIcon />}
        >
          {t('controlPanel.stats')}
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SettingsIcon />}
          onClick={onShowSettings}
        >
          {t('controlPanel.settings')}
        </Button>
      </Box>
    </Paper>
  );
};

export default ControlPanel;
