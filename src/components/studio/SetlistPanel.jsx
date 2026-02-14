import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  MusicNote as MusicNoteIcon,
  Timer as TimerIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const SetlistPanel = () => {
  const { t } = useTranslation();
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // States for Setlist Dialog
  const [openSetlistDialog, setOpenSetlistDialog] = useState(false);
  const [currentSetlist, setCurrentSetlist] = useState({ name: '', songs: [] });
  const [isEditing, setIsEditing] = useState(false);

  // States for Song Dialog
  const [openSongDialog, setOpenSongDialog] = useState(false);
  const [currentSong, setCurrentSong] = useState({ title: '', key: '', bpm: '', notes: '' });
  const [editingSongIndex, setEditingSongIndex] = useState(-1);

  useEffect(() => {
    fetchSetlists();
  }, []);

  const fetchSetlists = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/setlists');
      if (response.ok) {
        const data = await response.json();
        setSetlists(data);
      }
    } catch (error) {
      console.error('Error fetching setlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetlist = async () => {
    try {
      const response = await fetch('/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSetlist)
      });
      
      if (response.ok) {
        fetchSetlists();
        setOpenSetlistDialog(false);
      }
    } catch (error) {
      console.error('Error saving setlist:', error);
    }
  };

  const handleDeleteSetlist = async (id) => {
    if (!window.confirm(t('setlist.confirmDelete', 'Tem certeza que deseja excluir este repertório?'))) return;
    
    try {
      await fetch('/api/setlists/' + id, { method: 'DELETE' });
      fetchSetlists();
    } catch (error) {
      console.error('Error deleting setlist:', error);
    }
  };

  const handleAddSong = () => {
    const newSongs = [...currentSetlist.songs];
    if (editingSongIndex >= 0) {
      newSongs[editingSongIndex] = currentSong;
    } else {
      newSongs.push(currentSong);
    }
    setCurrentSetlist({ ...currentSetlist, songs: newSongs });
    setOpenSongDialog(false);
  };

  const handleRemoveSong = (index) => {
    const newSongs = currentSetlist.songs.filter((_, i) => i !== index);
    setCurrentSetlist({ ...currentSetlist, songs: newSongs });
  };

  const openNewSetlist = () => {
    setCurrentSetlist({ name: '', songs: [] });
    setIsEditing(false);
    setOpenSetlistDialog(true);
  };

  const openEditSetlist = (setlist) => {
    setCurrentSetlist(setlist);
    setIsEditing(true);
    setOpenSetlistDialog(true);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">{t('setlist.title', 'Repertórios')}</Typography>
        <Button 
          variant="contained" 
          size="small" 
          startIcon={<AddIcon />} 
          onClick={openNewSetlist}
        >
          {t('common.add', 'Novo')}
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {setlists.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
            {t('setlist.empty', 'Nenhum repertório criado.')}
          </Typography>
        ) : (
          setlists.map((setlist) => (
            <Accordion key={setlist.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', pr: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{setlist.name}</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ mr: 2 }}>
                      {setlist.songs?.length || 0} {t('setlist.songs', 'músicas')}
                    </Typography>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditSetlist(setlist); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteSetlist(setlist.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {setlist.songs?.map((song, index) => (
                    <ListItem key={index} divider={index < setlist.songs.length - 1}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MusicNoteIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="medium">{song.title}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            {song.key && <Chip size="small" icon={<KeyIcon />} label={song.key} variant="outlined" />}
                            {song.bpm && <Chip size="small" icon={<TimerIcon />} label={`${song.bpm} BPM`} variant="outlined" />}
                            {song.notes && <Typography variant="caption" color="text.secondary">- {song.notes}</Typography>}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Setlist Dialog */}
      <Dialog open={openSetlistDialog} onClose={() => setOpenSetlistDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? t('setlist.edit', 'Editar Repertório') : t('setlist.create', 'Novo Repertório')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('setlist.name', 'Nome do Repertório')}
            fullWidth
            value={currentSetlist.name}
            onChange={(e) => setCurrentSetlist({ ...currentSetlist, name: e.target.value })}
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">{t('setlist.songsList', 'Lista de Músicas')}</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => {
              setCurrentSong({ title: '', key: '', bpm: '', notes: '' });
              setEditingSongIndex(-1);
              setOpenSongDialog(true);
            }}>
              {t('setlist.addSong', 'Adicionar Música')}
            </Button>
          </Box>
          
          <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            {currentSetlist.songs?.length === 0 && (
              <ListItem>
                <ListItemText secondary={t('setlist.noSongs', 'Nenhuma música adicionada')} />
              </ListItem>
            )}
            {currentSetlist.songs?.map((song, index) => (
              <ListItem key={index} divider={index < currentSetlist.songs.length - 1}>
                <ListItemText 
                  primary={song.title} 
                  secondary={`${song.key ? `Key: ${song.key}` : ''} ${song.bpm ? `| BPM: ${song.bpm}` : ''}`} 
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" onClick={() => {
                    setCurrentSong(song);
                    setEditingSongIndex(index);
                    setOpenSongDialog(true);
                  }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleRemoveSong(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSetlistDialog(false)}>{t('common.cancel', 'Cancelar')}</Button>
          <Button onClick={handleSaveSetlist} variant="contained" disabled={!currentSetlist.name}>
            {t('common.save', 'Salvar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Song Dialog */}
      <Dialog open={openSongDialog} onClose={() => setOpenSongDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingSongIndex >= 0 ? t('setlist.editSong', 'Editar Música') : t('setlist.newSong', 'Nova Música')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('setlist.songTitle', 'Título')}
            fullWidth
            value={currentSong.title}
            onChange={(e) => setCurrentSong({ ...currentSong, title: e.target.value })}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              margin="dense"
              label={t('setlist.key', 'Tom')}
              value={currentSong.key}
              onChange={(e) => setCurrentSong({ ...currentSong, key: e.target.value })}
              sx={{ width: '50%' }}
            />
            <TextField
              margin="dense"
              label="BPM"
              type="number"
              value={currentSong.bpm}
              onChange={(e) => setCurrentSong({ ...currentSong, bpm: e.target.value })}
              sx={{ width: '50%' }}
            />
          </Box>
          <TextField
            margin="dense"
            label={t('setlist.notes', 'Notas')}
            fullWidth
            multiline
            rows={2}
            value={currentSong.notes}
            onChange={(e) => setCurrentSong({ ...currentSong, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSongDialog(false)}>{t('common.cancel', 'Cancelar')}</Button>
          <Button onClick={handleAddSong} variant="contained" disabled={!currentSong.title}>
            {t('common.add', 'Adicionar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SetlistPanel;