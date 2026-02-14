import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Divider,
  Slider,
  CircularProgress,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Search,
  Add,
  Delete,
  MusicNote,
  QueueMusic,
  VolumeUp
} from '@mui/icons-material';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';

const MusicPlayerPanel = ({ roomId }) => {
  const {
    playlist,
    currentSong,
    searchResults,
    loading,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    searchMusic,
    addSong,
    removeSong,
    playSong
  } = useMusicPlayer(roomId);

  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (currentSong && isPlaying) {
      // Fetch URL real para tocar
      fetch(`/api/music/stream/${currentSong.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.url && audioRef.current) {
            audioRef.current.src = data.url;
            audioRef.current.play().catch(e => console.error("Erro ao tocar:", e));
          }
        })
        .catch(err => console.error("Erro ao obter stream:", err));
    } else if (audioRef.current && !isPlaying) {
      audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMusic(searchQuery);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Paper 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden'
      }}
      elevation={3}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<QueueMusic />} label="Playlist" />
          <Tab icon={<Search />} label="Buscar" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {tabValue === 0 && (
          <List dense>
            {playlist.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', opacity: 0.6 }}>
                <MusicNote sx={{ fontSize: 48, mb: 1 }} />
                <Typography>A playlist está vazia</Typography>
                <Typography variant="caption">Adicione músicas na aba Buscar</Typography>
              </Box>
            ) : (
              playlist.map((song, index) => (
                <ListItem
                  key={song.uuid}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => removeSong(song.uuid)}>
                      <Delete />
                    </IconButton>
                  }
                  sx={{
                    bgcolor: currentSong?.uuid === song.uuid ? 'action.selected' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={song.thumbnail} variant="rounded">
                      <MusicNote />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={song.title}
                    secondary={song.uploader}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                  <IconButton onClick={() => playSong(song.uuid)} color="primary">
                    {currentSong?.uuid === song.uuid && isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                </ListItem>
              ))
            )}
          </List>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 1 }}>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar no YouTube..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton type="submit" disabled={loading}>
                      {loading ? <CircularProgress size={24} /> : <Search />}
                    </IconButton>
                  )
                }}
              />
            </Box>

            <List dense>
              {searchResults.map((result) => (
                <ListItem
                  key={result.id}
                  secondaryAction={
                    <IconButton edge="end" color="primary" onClick={() => addSong(result)}>
                      <Add />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={result.thumbnail} variant="rounded" />
                  </ListItemAvatar>
                  <ListItemText
                    primary={result.title}
                    secondary={result.uploader}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>

      {/* Mini Player */}
      <Box sx={{ p: 2, bgcolor: 'background.surface', borderTop: 1, borderColor: 'divider' }}>
        {currentSong ? (
          <>
            <Typography variant="subtitle2" noWrap sx={{ mb: 1 }}>
              {currentSong.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', width: 100 }}>
                <VolumeUp fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                <Slider 
                  size="small" 
                  value={volume * 100} 
                  onChange={(_, v) => setVolume(v / 100)} 
                />
              </Box>
            </Box>
          </>
        ) : (
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Nenhuma música tocando
          </Typography>
        )}
        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </Box>
    </Paper>
  );
};

export default MusicPlayerPanel;
