import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent,
    TextField, IconButton, List, Collapse,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Plus, Music, Trash2, ChevronDown, ChevronUp, Save, Edit, GripVertical, MonitorPlay } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente individual de música sorteável
const SortableSongItem = ({ song, index, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: song.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                p: 1.5, bgcolor: '#fff', mb: 1, borderRadius: 1, boxShadow: 1
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.secondary', display: 'flex' }}>
                    <GripVertical size={20} />
                </Box>
                <Typography variant="body2" fontWeight="500">{index + 1}. {song.title} ({song.key || '-'}, {song.tempo || '-'})</Typography>
            </Box>
            <IconButton size="small" color="error" onClick={() => onDelete(song.id)}>
                <Trash2 size={16} />
            </IconButton>
        </Box>
    );
};

const SetlistManager = () => {
    const [setlists, setSetlists] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [expandedSetlist, setExpandedSetlist] = useState(null);
    const [currentSetlist, setCurrentSetlist] = useState({ name: '', songs: [] });
    // State para nova música
    const [newSong, setNewSong] = useState({ title: '', key: '', tempo: '' });

    // Sensores para Dnd
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchSetlists();
    }, []);

    const fetchSetlists = async () => {
        try {
            const res = await fetch('/api/setlists');
            const data = await res.json();
            setSetlists(data);
        } catch (error) {
            console.error('Error fetching setlists:', error);
        }
    };

    const handleSaveSetlist = async () => {
        try {
            const res = await fetch('/api/setlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSetlist)
            });
            if (res.ok) {
                fetchSetlists();
                setIsDialogOpen(false);
                setCurrentSetlist({ name: '', songs: [] });
            }
        } catch (error) {
            console.error('Error saving setlist:', error);
        }
    };

    const handleDeleteSetlist = async (id) => {
        try {
            await fetch(`/api/setlists/${id}`, { method: 'DELETE' });
            fetchSetlists();
        } catch (error) {
            console.error('Error deleting setlist:', error);
        }
    };

    const addSongToCurrent = () => {
        if (!newSong.title) return;
        setCurrentSetlist(prev => ({
            ...prev,
            songs: [...(prev.songs || []), { ...newSong, id: Date.now() }] // ID único para dnd
        }));
        setNewSong({ title: '', key: '', tempo: '' });
    };

    const handleRemoveSong = (songId) => {
        setCurrentSetlist(prev => ({
            ...prev,
            songs: prev.songs.filter(s => s.id !== songId)
        }));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setCurrentSetlist((prev) => {
                const oldIndex = prev.songs.findIndex(s => s.id === active.id);
                const newIndex = prev.songs.findIndex(s => s.id === over.id);
                return {
                    ...prev,
                    songs: arrayMove(prev.songs, oldIndex, newIndex)
                };
            });
        }
    };

    const openEdit = (setlist) => {
        setCurrentSetlist(setlist);
        setIsDialogOpen(true);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Music /> Setlists
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Plus />}
                    onClick={() => {
                        setCurrentSetlist({ name: '', songs: [] });
                        setIsDialogOpen(true);
                    }}
                >
                    Novo Setlist
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {setlists.map(setlist => (
                    <Card key={setlist.id} elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">{setlist.name}</Typography>
                                <Box>
                                    <IconButton onClick={() => openEdit(setlist)}>
                                        <Edit size={20} />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDeleteSetlist(setlist.id)}>
                                        <Trash2 size={20} />
                                    </IconButton>
                                    <IconButton onClick={() => setExpandedSetlist(expandedSetlist === setlist.id ? null : setlist.id)}>
                                        {expandedSetlist === setlist.id ? <ChevronUp /> : <ChevronDown />}
                                    </IconButton>
                                </Box>
                            </Box>
                            <Collapse in={expandedSetlist === setlist.id}>
                                <List sx={{ mt: 2 }}>
                                    {setlist.songs?.map((song, index) => (
                                        <Box key={index} sx={{
                                            display: 'flex', justifyContent: 'space-between',
                                            p: 1, borderBottom: '1px solid #eee',
                                            alignItems: 'center'
                                        }}>
                                            <Typography><strong>{index + 1}.</strong> {song.title}</Typography>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                {song.key && <Typography variant="caption" sx={{ bgcolor: '#eee', px: 1, borderRadius: 1 }}>Key: {song.key}</Typography>}
                                                {song.tempo && <Typography variant="caption" sx={{ bgcolor: '#eee', px: 1, borderRadius: 1 }}>BPM: {song.tempo}</Typography>}
                                            </Box>
                                        </Box>
                                    ))}
                                    {(!setlist.songs || setlist.songs.length === 0) && (
                                        <Typography variant="body2" color="text.secondary">Nenhuma música adicionada.</Typography>
                                    )}
                                </List>
                            </Collapse>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{currentSetlist.id ? 'Editar Setlist' : 'Novo Setlist'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nome do Setlist"
                        fullWidth
                        margin="normal"
                        value={currentSetlist.name}
                        onChange={(e) => setCurrentSetlist({ ...currentSetlist, name: e.target.value })}
                    />

                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Músicas (Arraste para reordenar)</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            label="Título"
                            size="small"
                            fullWidth
                            value={newSong.title}
                            onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                        />
                        <TextField
                            label="Tom"
                            size="small"
                            sx={{ width: 80 }}
                            value={newSong.key}
                            onChange={(e) => setNewSong({ ...newSong, key: e.target.value })}
                        />
                        <TextField
                            label="BPM"
                            size="small"
                            sx={{ width: 80 }}
                            value={newSong.tempo}
                            onChange={(e) => setNewSong({ ...newSong, tempo: e.target.value })}
                        />
                        <Button variant="outlined" onClick={addSongToCurrent}><Plus /></Button>
                    </Box>

                    <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={(currentSetlist.songs || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                                {(currentSetlist.songs || []).map((song, index) => (
                                    <SortableSongItem
                                        key={song.id}
                                        song={song}
                                        index={index}
                                        onDelete={handleRemoveSong}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                        {(!currentSetlist.songs || currentSetlist.songs.length === 0) && (
                            <Typography variant="body2" align="center" sx={{ py: 2, color: 'text.secondary' }}>
                                Adicione músicas aqui.
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveSetlist} startIcon={<Save />}>Salvar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SetlistManager;
