import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, IconButton, List, ListItem, ListItemText, ListItemIcon, Button } from '@mui/material';
import { Mic, Square, Play, Trash2, Download } from 'lucide-react';
import { useReactMediaRecorder } from 'react-media-recorder';

const IdeaPad = () => {
    const [recordings, setRecordings] = useState([]);

    // Carregar gravações salvas (mockadas por enquanto, pois Blob URL não persiste após refresh)
    // Em uma implementação real, precisaríamos converter Blob para Base64 ou enviar para o servidor.
    // Aqui focaremos na funcionalidade da sessão atual.

    const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });

    useEffect(() => {
        if (status === 'stopped' && mediaBlobUrl) {
            const newRecording = {
                id: Date.now(),
                url: mediaBlobUrl,
                name: `Ideia ${recordings.length + 1} - ${new Date().toLocaleTimeString()}`,
                date: new Date()
            };
            setRecordings(prev => [newRecording, ...prev]);
        }
    }, [mediaBlobUrl, status]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = (id) => {
        setRecordings(prev => prev.filter(r => r.id !== id));
    };

    return (
        <Card sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Bloco de Ideias</Typography>
                <Typography variant="body2" color="text.secondary">Grave riffs e melodias rapidamente.</Typography>
            </Box>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                {status !== 'recording' ? (
                    <IconButton
                        onClick={startRecording}
                        sx={{
                            width: 80, height: 80, bgcolor: 'error.main', color: 'white',
                            '&:hover': { bgcolor: 'error.dark' },
                            boxShadow: '0 4px 20px rgba(211, 47, 47, 0.4)'
                        }}
                    >
                        <Mic size={40} />
                    </IconButton>
                ) : (
                    <IconButton
                        onClick={stopRecording}
                        sx={{
                            width: 80, height: 80, bgcolor: 'text.primary', color: 'white',
                            '&:hover': { bgcolor: 'grey.800' },
                            animation: 'pulse 1.5s infinite'
                        }}
                    >
                        <Square size={32} />
                    </IconButton>
                )}
            </Box>

            <Typography variant="overline" color={status === 'recording' ? 'error.main' : 'text.secondary'} sx={{ display: 'block', mb: 3 }}>
                {status === 'recording' ? 'GRAVANDO...' : status === 'idle' ? 'PRONTO PARA GRAVAR' : 'PROCESSANDO...'}
            </Typography>

            <Typography variant="h6" align="left" sx={{ mb: 2 }}>Gravações Recentes</Typography>

            <List sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'background.default', borderRadius: 2 }}>
                {recordings.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
                        Nenhuma gravação ainda.
                    </Typography>
                )}
                {recordings.map((rec) => (
                    <ListItem key={rec.id} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                        <ListItemIcon>
                            <Play size={20} />
                        </ListItemIcon>
                        <ListItemText
                            primary={rec.name}
                            secondary={
                                <audio src={rec.url} controls style={{ height: 30, marginTop: 8 }} />
                            }
                        />
                        <IconButton href={rec.url} download={`${rec.name}.wav`} color="primary">
                            <Download size={20} />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(rec.id)} color="error">
                            <Trash2 size={20} />
                        </IconButton>
                    </ListItem>
                ))}
            </List>
        </Card>
    );
};

export default IdeaPad;
