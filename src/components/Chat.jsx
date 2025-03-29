import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography, 
  Paper, 
  Avatar,
  Badge,
  Tooltip,
  Fade,
  Divider
} from '@mui/material';
import { 
  Send,
  EmojiEmotions,
  AttachFile,
  Close as CloseIcon,
  ChatBubble,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { useRoom } from '../contexts/RoomContext';
import { useTranslation } from 'react-i18next';

function Chat() {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { users } = useRoom();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, data]);
      
      // Incrementar contador de não lidos se o chat estiver minimizado
      if (!isExpanded) {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('chat_message');
    };
  }, [socket, isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isExpanded]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!socket || !newMessage.trim()) return;

    const messageData = {
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    return user || { name: t('chat.unknownUser'), instrument: '' };
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleChat = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setUnreadCount(0);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: isExpanded ? 350 : 'auto',
        height: isExpanded ? 500 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        zIndex: 1000,
      }}
    >
      {/* Cabeçalho do Chat */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={toggleChat}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatBubble />
          {isExpanded && (
            <Typography variant="h6" component="div">
              {t('chat.title')}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isExpanded && unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error" />
          )}
          {isExpanded ? <ExpandMore /> : <ExpandLess />}
        </Box>
      </Box>

      {isExpanded && (
        <>
          {/* Lista de mensagens */}
          <Box
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: 'background.default'
            }}
          >
            {messages.map((message, index) => {
              const user = getUserInfo(message.userId);
              const isCurrentUser = message.userId === socket?.id;
              const showAvatar = index === 0 || messages[index - 1]?.userId !== message.userId;

              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                    gap: 1,
                    alignItems: 'flex-end',
                  }}
                >
                  {showAvatar && !isCurrentUser && (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {getInitials(user.name)}
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: '70%',
                      minWidth: '20%',
                    }}
                  >
                    {showAvatar && !isCurrentUser && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {user.name}
                      </Typography>
                    )}
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1,
                        bgcolor: isCurrentUser ? 'primary.main' : 'grey.100',
                        color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                        borderTopLeftRadius: !isCurrentUser && !showAvatar ? 1 : 2,
                        borderTopRightRadius: isCurrentUser && !showAvatar ? 1 : 2,
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'right',
                          color: isCurrentUser ? 'primary.light' : 'text.secondary',
                          mt: 0.5,
                        }}
                      >
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>

          {/* Área de input */}
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('chat.typePlaceholder')}
                variant="outlined"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={t('chat.attachFile')}>
                        <IconButton size="small">
                          <AttachFile fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('chat.emoji')}>
                        <IconButton size="small">
                          <EmojiEmotions fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ),
                }}
              />
              <IconButton
                color="primary"
                type="submit"
                disabled={!newMessage.trim()}
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
}

export default Chat;
