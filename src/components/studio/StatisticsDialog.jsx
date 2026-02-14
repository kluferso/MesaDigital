import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  BarChart as BarChartIcon,
  NetworkCheck as NetworkCheckIcon,
  GraphicEq as GraphicEqIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';

/**
 * Dialog para exibir estatísticas de conexão e áudio em tempo real
 */
const StatisticsDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { users, localUser, connectionStatistics } = useWebRTC();
  
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({});
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Mudança de aba
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Simular estatísticas para demonstração
  // Em um caso real, essas estatísticas viriam do WebRTC
  useEffect(() => {
    if (open) {
      // Função para gerar estatísticas simuladas
      const generateStats = () => {
        const simulatedStats = {
          network: {
            bytesReceived: Math.floor(Math.random() * 5000000),
            bytesSent: Math.floor(Math.random() * 1000000),
            packetsReceived: Math.floor(Math.random() * 10000),
            packetsSent: Math.floor(Math.random() * 3000),
            packetsLost: Math.floor(Math.random() * 100),
            roundTripTime: Math.floor(Math.random() * 200) + 20,
            jitter: Math.random() * 10
          },
          audio: {
            inputLevel: Math.random(),
            outputLevel: Math.random(),
            sampleRate: 48000,
            bufferSize: 256,
            latency: Math.random() * 20 + 10,
            codec: 'opus'
          },
          connections: users.map(user => ({
            id: user.id,
            name: user.name,
            latency: Math.floor(Math.random() * 200) + 20,
            jitter: Math.random() * 10,
            packetsLost: Math.floor(Math.random() * 5),
            bandwidth: Math.floor(Math.random() * 100) + 50,
            audioLevel: Math.random()
          }))
        };
        
        // Em implementação real, use as estatísticas do WebRTC
        // const realStats = connectionStatistics || {};
        
        setStats(simulatedStats);
      };
      
      // Gerar estatísticas iniciais
      generateStats();
      
      // Configurar intervalo para atualizar
      const interval = setInterval(generateStats, 2000);
      setRefreshInterval(interval);
      
      return () => {
        clearInterval(interval);
        setRefreshInterval(null);
      };
    }
  }, [open, users, connectionStatistics]);
  
  // Formatar bytes para exibição
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calcular a cor baseada em um valor e limites
  const calculateColor = (value, good, warning, critical) => {
    if (value <= good) return theme.palette.success.main;
    if (value <= warning) return theme.palette.warning.light;
    if (value <= critical) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: { sm: 'auto', md: '80vh' }, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BarChartIcon sx={{ mr: 1 }} />
          <Typography variant="h6">{t('statistics.title')}</Typography>
        </Box>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<NetworkCheckIcon />} label={t('statistics.tabs.network')} id="stats-tab-0" />
          <Tab icon={<GraphicEqIcon />} label={t('statistics.tabs.audio')} id="stats-tab-1" />
          <Tab icon={<MemoryIcon />} label={t('statistics.tabs.connections')} id="stats-tab-2" />
        </Tabs>
      </Box>
      
      <DialogContent>
        {/* Aba de Rede */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 0}
          id="stats-tabpanel-0"
          sx={{ py: 2, display: activeTab === 0 ? 'block' : 'none' }}
        >
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('statistics.network.overview')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('statistics.network.dataReceived')}
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(stats.network?.bytesReceived || 0)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('statistics.network.dataSent')}
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(stats.network?.bytesSent || 0)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('statistics.network.packetsReceived')}
                  </Typography>
                  <Typography variant="h6">
                    {stats.network?.packetsReceived?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('statistics.network.packetsSent')}
                  </Typography>
                  <Typography variant="h6">
                    {stats.network?.packetsSent?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('statistics.network.quality')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('statistics.network.roundTripTime')}
                    </Typography>
                    <Typography variant="body2" 
                      sx={{ 
                        fontWeight: 'medium',
                        color: calculateColor(stats.network?.roundTripTime || 0, 50, 100, 200)
                      }}
                    >
                      {stats.network?.roundTripTime || 0}ms
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((stats.network?.roundTripTime || 0) / 3, 100)}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: calculateColor(stats.network?.roundTripTime || 0, 50, 100, 200)
                      }
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('statistics.network.jitter')}
                    </Typography>
                    <Typography variant="body2" 
                      sx={{ 
                        fontWeight: 'medium',
                        color: calculateColor(stats.network?.jitter || 0, 5, 10, 20)
                      }}
                    >
                      {stats.network?.jitter?.toFixed(2) || 0}ms
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((stats.network?.jitter || 0) * 5, 100)}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: calculateColor(stats.network?.jitter || 0, 5, 10, 20)
                      }
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('statistics.network.packetsLost')}
                    </Typography>
                    <Typography variant="body2" 
                      sx={{ 
                        fontWeight: 'medium',
                        color: calculateColor(stats.network?.packetsLost || 0, 5, 20, 50)
                      }}
                    >
                      {stats.network?.packetsLost || 0}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((stats.network?.packetsLost || 0) / 2, 100)}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: calculateColor(stats.network?.packetsLost || 0, 5, 20, 50)
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary">
              {t('statistics.network.qualityInfo')}
            </Typography>
          </Paper>
        </Box>
        
        {/* Aba de Áudio */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 1}
          id="stats-tabpanel-1"
          sx={{ py: 2, display: activeTab === 1 ? 'block' : 'none' }}
        >
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('statistics.audio.configuration')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('statistics.audio.sampleRate')}
                </Typography>
                <Typography variant="h6">
                  {stats.audio?.sampleRate / 1000} kHz
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('statistics.audio.bufferSize')}
                </Typography>
                <Typography variant="h6">
                  {stats.audio?.bufferSize} samples
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('statistics.audio.latency')}
                </Typography>
                <Typography variant="h6">
                  {stats.audio?.latency?.toFixed(1) || 0} ms
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('statistics.audio.codec')}
                </Typography>
                <Typography variant="h6">
                  {stats.audio?.codec || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('statistics.audio.levels')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('statistics.audio.inputLevel')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {Math.round((stats.audio?.inputLevel || 0) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.audio?.inputLevel || 0) * 100}
                    sx={{ 
                      height: 12, 
                      borderRadius: 4,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.primary.main
                      }
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('statistics.audio.outputLevel')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {Math.round((stats.audio?.outputLevel || 0) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.audio?.outputLevel || 0) * 100}
                    sx={{ 
                      height: 12, 
                      borderRadius: 4,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.secondary.main
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary">
              {t('statistics.audio.levelsInfo')}
            </Typography>
          </Paper>
        </Box>
        
        {/* Aba de Conexões */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 2}
          id="stats-tabpanel-2"
          sx={{ py: 2, display: activeTab === 2 ? 'block' : 'none' }}
        >
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('statistics.connections.user')}</TableCell>
                  <TableCell align="right">{t('statistics.connections.latency')}</TableCell>
                  <TableCell align="right">{t('statistics.connections.jitter')}</TableCell>
                  <TableCell align="right">{t('statistics.connections.packetsLost')}</TableCell>
                  <TableCell align="right">{t('statistics.connections.bandwidth')}</TableCell>
                  <TableCell align="right">{t('statistics.connections.audioLevel')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(stats.connections || []).map((connection) => (
                  <TableRow
                    key={connection.id}
                    sx={{
                      backgroundColor: connection.id === localUser?.id ? alpha(theme.palette.primary.light, 0.1) : 'inherit'
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {connection.name}
                        {connection.id === localUser?.id && 
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            ({t('statistics.connections.you')})
                          </Typography>
                        }
                      </Box>
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: calculateColor(connection.latency, 50, 100, 200)
                      }}
                    >
                      {connection.latency} ms
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: calculateColor(connection.jitter, 5, 10, 20)
                      }}
                    >
                      {connection.jitter.toFixed(2)} ms
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: calculateColor(connection.packetsLost, 1, 5, 10)
                      }}
                    >
                      {connection.packetsLost}
                    </TableCell>
                    <TableCell align="right">
                      {connection.bandwidth} kbps
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={connection.audioLevel * 100}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: theme.palette.grey[200]
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('statistics.connections.info')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          {t('statistics.refreshRate')}
        </Typography>
        <Button onClick={onClose} color="primary">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Função auxiliar para ajustar a transparência das cores
const alpha = (color, alpha) => {
  return color + Math.round(alpha * 255).toString(16).padStart(2, '0');
};

export default StatisticsDialog;
