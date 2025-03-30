import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  Menu,
  MenuItem,
  Grid,
  Popover,
  ClickAwayListener
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  EmojiEmotions as EmojiIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useSocket } from '../hooks/useSocket';
import { safe, safeFilter } from '../utils/safeUtils';

// Emojis estilo Skype
const skypeEmojis = [
  { code: ':)', emoji: '😊' },
  { code: ':(', emoji: '😞' },
  { code: ':D', emoji: '😃' },
  { code: ':P', emoji: '😛' },
  { code: ';)', emoji: '😉' },
  { code: ':O', emoji: '😮' },
  { code: ':*', emoji: '😘' },
  { code: '(H)', emoji: '😎' },
  { code: '(Y)', emoji: '👍' },
  { code: '(N)', emoji: '👎' },
  { code: '<3', emoji: '❤️' },
  { code: '(clap)', emoji: '👏' },
  { code: '(coffee)', emoji: '☕' },
  { code: '(cake)', emoji: '🍰' },
  { code: '(beer)', emoji: '🍺' },
  { code: '(music)', emoji: '🎵' },
  { code: '(party)', emoji: '🎉' },
  { code: '(phone)', emoji: '📱' },
  { code: '(wave)', emoji: '👋' },
  { code: '(hug)', emoji: '🤗' }
];

const ChatBox = ({ roomId, participants = [], isOpen, onToggle, embedded = false }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Rolar para a última mensagem quando mensagens são adicionadas
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Configurar listener de mensagens
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Converter códigos de emoji para emojis reais
      if (message && message.text) {
        message.text = convertEmojiCodes(message.text);
      }
      
      setMessages((prev) => [...prev, message]);
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('chat_message', handleNewMessage);

    return () => {
      socket.off('chat_message', handleNewMessage);
    };
  }, [socket, isOpen]);

  // Converter códigos de emoji para emojis reais
  const convertEmojiCodes = (text) => {
    let processedText = text;
    
    skypeEmojis.forEach(({ code, emoji }) => {
      // Utilizar regex para substituir todos os códigos no texto
      const regex = new RegExp(code.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g');
      processedText = processedText.replace(regex, emoji);
    });
    
    return processedText;
  };

  // Enviar mensagem
  const sendMessage = () => {
    if (!socket || !messageInput.trim()) return;
    
    // Converter códigos de emoji antes de enviar
    const processedText = convertEmojiCodes(messageInput);
    
    socket.emit('send_message', {
      roomId,
      text: processedText
    });
    
    setMessageInput('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiClick = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleEmojiSelect = (emojiCode) => {
    setMessageInput((prev) => prev + ' ' + emojiCode + ' ');
    handleEmojiClose();
    // Focar no input após seleção
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  if (!isOpen) {
    return (
      <Tooltip title="Abrir Chat">
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 2000,
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
          >
            <IconButton
              color="primary"
              onClick={onToggle}
              size="large"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                width: 56,
                height: 56,
                boxShadow: 3,
              }}
            >
              <ChatIcon />
            </IconButton>
          </Badge>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Paper
      elevation={4}
      sx={{
        position: embedded ? 'static' : 'fixed',
        bottom: embedded ? 0 : 16,
        right: embedded ? 0 : 16,
        width: {
          xs: embedded ? '100%' : 'calc(100% - 32px)',
          sm: embedded ? '100%' : 350,
        },
        maxHeight: embedded ? '100%' : 500,
        display: 'flex',
        flexDirection: 'column',
        zIndex: embedded ? 0 : 2000,
        borderRadius: embedded ? 0 : 2,
        overflow: 'hidden',
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          p: 1,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Chat da Sala
        </Typography>
        {!embedded && (
          <IconButton size="small" onClick={onToggle} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Lista de Mensagens */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          height: '300px',
          bgcolor: 'background.default',
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography color="text.secondary">
              Nenhuma mensagem. Seja o primeiro a enviar!
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Dica: Você pode usar emojis estilo Skype como:
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {skypeEmojis.slice(0, 5).map((item, index) => (
                  <Tooltip key={index} title={item.code}>
                    <Box sx={{ fontSize: '1.2rem' }}>{item.emoji}</Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <List disablePadding>
            {safeFilter(messages, message => !!message).map((message) => {
              const sender = participants.find((p) => p && p.id === message.sender);
              const isLocalUser = safe(sender, 'isLocal', false);
              
              return (
                <ListItem
                  key={message.id}
                  alignItems="flex-start"
                  sx={{
                    p: 1,
                    flexDirection: isLocalUser ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: isLocalUser ? 'primary.main' : 'secondary.main',
                      width: 32,
                      height: 32,
                      mr: isLocalUser ? 0 : 1,
                      ml: isLocalUser ? 1 : 0,
                    }}
                  >
                    {sender ? getInitials(sender.name) : '?'}
                  </Avatar>
                  <Paper
                    sx={{
                      p: 1,
                      maxWidth: '70%',
                      bgcolor: isLocalUser
                        ? 'primary.light'
                        : 'background.paper',
                      color: isLocalUser ? 'primary.contrastText' : 'text.primary',
                      borderRadius: isLocalUser 
                        ? '12px 12px 0px 12px'
                        : '12px 12px 12px 0px',
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold" component="div">
                      {safe(sender, 'name', 'Usuário desconhecido')}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-word',
                        '& .emoji': { fontSize: '1.4em', verticalAlign: 'middle' }
                      }}
                    >
                      {message.text}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color={isLocalUser ? 'primary.contrastText' : 'text.secondary'} 
                      sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.5 }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Typography>
                  </Paper>
                </ListItem>
              );
            })}
            <div ref={chatEndRef} />
          </List>
        )}
      </Box>

      {/* Campo de entrada */}
      <Box sx={{ p: 1, bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            placeholder="Digite sua mensagem..."
            size="small"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            autoComplete="off"
            multiline
            maxRows={3}
            inputRef={inputRef}
            sx={{ 
              bgcolor: 'background.default',
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
              }
            }}
          />
          <Tooltip title="Inserir emoji">
            <IconButton 
              color="primary"
              onClick={handleEmojiClick}
              sx={{ mb: 0.5 }}
            >
              <EmojiIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            disabled={!messageInput.trim()}
            sx={{ 
              borderRadius: '20px',
              minWidth: '40px',
              width: '40px',
              height: '40px',
              p: 0
            }}
          >
            <SendIcon />
          </Button>
        </Stack>
      </Box>

      {/* Menu de Emojis */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={handleEmojiClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 1, width: 280 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Emojis
          </Typography>
          <Grid container spacing={1}>
            {skypeEmojis.map((item, index) => (
              <Grid item key={index} xs={2}>
                <Tooltip title={item.code}>
                  <IconButton 
                    onClick={() => handleEmojiSelect(item.emoji)}
                    size="small"
                    sx={{ fontSize: '1.4rem' }}
                  >
                    {item.emoji}
                  </IconButton>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>
    </Paper>
  );
};

export default ChatBox;
