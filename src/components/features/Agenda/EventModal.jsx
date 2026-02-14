import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, FormControlLabel, Checkbox,
    Typography
} from '@mui/material';

const EventModal = ({ open, onClose, onSave, onDelete, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end: '',
        description: '',
        location: '',
    });

    useEffect(() => {
        if (initialData) {
            // Formatar datas para o input datetime-local
            const formatForInput = (date) => {
                if (!date) return '';
                const d = new Date(date);
                return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            };

            setFormData({
                id: initialData.id,
                title: initialData.title || '',
                start: formatForInput(initialData.start),
                end: formatForInput(initialData.end),
                description: initialData.description || '',
                location: initialData.location || '',
            });
        } else {
            setFormData({
                title: '',
                start: '',
                end: '',
                description: '',
                location: '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{formData.id ? 'Editar Ensaio' : 'Novo Ensaio'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Título"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Início"
                            name="start"
                            type="datetime-local"
                            value={formData.start}
                            onChange={handleChange}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Fim"
                            name="end"
                            type="datetime-local"
                            value={formData.end}
                            onChange={handleChange}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Local"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Descrição / Notas"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    {formData.id && (
                        <Button onClick={() => onDelete(formData.id)} color="error" sx={{ mr: 'auto' }}>
                            Excluir
                        </Button>
                    )}
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Salvar
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EventModal;
