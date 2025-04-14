import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Avatar, 
  Paper, 
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Send as SendIcon, EmojiEmotions as EmojiIcon } from '@mui/icons-material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useTranslation } from 'react-i18next';

// Componente estilizado para mensagens
const MessageBubble = styled(Paper)(({ theme, isCurrentUser }) => ({
  padding: theme.spacing(1.5),
  borderRadius: isCurrentUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  backgroundColor: isCurrentUser ? theme.palette.primary.main : theme.palette.background.paper,
  color: isCurrentUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  maxWidth: '80%',
  marginBottom: theme.spacing(1),
  boxShadow: theme.shadows[1],
  wordBreak: 'break-word',
  position: 'relative'
}));

// Componente estilizado para mensagens de sistema
const SystemMessage = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: '8px',
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.secondary,
  maxWidth: '90%',
  margin: '0 auto',
  marginBottom: theme.spacing(1),
  textAlign: 'center',
  fontSize: '0.85rem'
}));

/**
 * Componente de chat para a sala
 */
const ChatPanel = ({ roomId, socket, onNewMessage, chatEndRef }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const { localUser, users } = useWebRTC();
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);

  // Carregar histórico de mensagens ao entrar
  useEffect(() => {
    if (!socket) return;

    // Função para lidar com novas mensagens
    const handleChatMessage = (message) => {
      setMessages(prev => [...prev, message]);
      
      // Notificar o componente pai sobre nova mensagem
      if (onNewMessage) {
        onNewMessage(message);
      }
    };

    // Registrar listener de mensagens
    socket.on('chat_message', handleChatMessage);

    // Adicionar mensagem de boas-vindas
    setMessages([
      {
        type: 'system',
        text: t('chat.welcome', { roomId }),
        timestamp: new Date()
      }
    ]);

    // Limpar listener ao desmontar
    return () => {
      socket.off('chat_message', handleChatMessage);
    };
  }, [socket, roomId, onNewMessage, t]);

  // Rolar para a última mensagem quando uma nova é adicionada
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lidar com envio de mensagem
  const handleSendMessage = () => {
    if (!socket || !inputMessage.trim() || !localUser) return;

    // Enviar mensagem
    socket.emit('send_message', {
      text: inputMessage.trim(),
      type: 'text'
    });

    // Limpar campo de entrada
    setInputMessage('');
  };

  // Lidar com tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Formatar timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Formatar data se necessário
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('chat.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('chat.yesterday');
    } else {
      return date.toLocaleDateString();
    }
  };

  // Encontrar usuário pelo ID
  const findUser = (userId) => {
    return users.find(user => user.id === userId) || { name: 'Unknown', instrument: '' };
  };

  // Agrupar mensagens por data
  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = null;
    
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp);
      const dateString = messageDate.toDateString();
      
      if (dateString !== currentDate) {
        currentDate = dateString;
        groups.push({
          type: 'date',
          date: messageDate,
          messages: [message]
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%' 
    }}>
      {/* Área de mensagens */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messageGroups.map((group, groupIndex) => (
          <Box key={groupIndex}>
            {/* Cabeçalho de data */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {formatDate(group.date)}
              </Typography>
            </Divider>
            
            {/* Mensagens do grupo */}
            {group.messages.map((message, msgIndex) => {
              // Mensagem do sistema
              if (message.type === 'system') {
                return (
                  <SystemMessage key={`${groupIndex}-${msgIndex}`}>
                    {message.text}
                  </SystemMessage>
                );
              }
              
              // Mensagem normal
              const isCurrentUser = message.userId === localUser?.id;
              const user = findUser(message.userId);
              
              return (
                <Box 
                  key={`${groupIndex}-${msgIndex}`}
                  sx={{ 
                    display: 'flex',
                    flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    mb: 2
                  }}
                >
                  {!isCurrentUser && (
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1,
                        bgcolor: 'secondary.main',
                        fontSize: '0.875rem'
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                    maxWidth: 'calc(100% - 40px)'
                  }}>
                    {!isCurrentUser && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5 }}>
                        {user.name}
                      </Typography>
                    )}
                    
                    <MessageBubble isCurrentUser={isCurrentUser}>
                      <Typography variant="body2">{message.text}</Typography>
                    </MessageBubble>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mx: 1 }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
        
        <div ref={messagesEndRef} />
        {chatEndRef && <div ref={chatEndRef} />}
      </Box>
      
      {/* Área de entrada de mensagem */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: theme => theme.palette.background.paper,
        borderTop: theme => `1px solid ${theme.palette.divider}`
      }}>
        <Box
          component="form"
          sx={{ display: 'flex', gap: 1 }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('chat.typeMessage')}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small">
                    <EmojiIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            endIcon={<SendIcon />}
          >
            {t('chat.send')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPanel;
