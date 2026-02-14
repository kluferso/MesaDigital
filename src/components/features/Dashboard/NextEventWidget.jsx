import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NextEventWidget = () => {
    const [nextEvent, setNextEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/events')
            .then(res => res.json())
            .then(data => {
                const now = new Date();
                const upcoming = data
                    .map(e => ({ ...e, start: new Date(e.start) }))
                    .filter(e => e.start > now)
                    .sort((a, b) => a.start - b.start)[0];
                setNextEvent(upcoming);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography>Carregando...</Typography></Card>;

    if (!nextEvent) {
        return (
            <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'white' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Calendar size={48} style={{ opacity: 0.8, marginBottom: 16 }} />
                    <Typography variant="h6">Sem ensaios agendados</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Agende um novo ensaio!</Typography>
                </CardContent>
            </Card>
        );
    }

    const daysLeft = differenceInDays(nextEvent.start, new Date());

    return (
        <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: 4,
                bgcolor: daysLeft < 3 ? 'error.main' : 'primary.main'
            }} />
            <CardContent>
                <Typography variant="overline" color="text.secondary">Próximo Ensaio</Typography>
                <Typography variant="h5" fontWeight="bold" gutterBottom>{nextEvent.title}</Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip icon={<Calendar size={14} />} label={format(nextEvent.start, "dd 'de' MMMM", { locale: ptBR })} size="small" />
                    <Chip icon={<Clock size={14} />} label={format(nextEvent.start, "HH:mm")} size="small" />
                </Box>

                {nextEvent.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                        <MapPin size={16} />
                        <Typography variant="body2">{nextEvent.location}</Typography>
                    </Box>
                )}

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h3" fontWeight="900" color="primary.main">
                        {daysLeft === 0 ? 'HOJE' : daysLeft}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {daysLeft === 0 ? 'Prepare-se!' : 'dias restantes'}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default NextEventWidget;
