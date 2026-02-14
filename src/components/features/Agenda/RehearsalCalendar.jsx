import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Button, Typography, Paper, useTheme } from '@mui/material';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import EventModal from './EventModal';

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const RehearsalCalendar = () => {
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const theme = useTheme();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            // Converter strings de data para objetos Date
            const parsedEvents = data.map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end)
            }));
            setEvents(parsedEvents);
        } catch (error) {
            console.error('Erro ao buscar eventos:', error);
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        setSelectedEvent({ start, end });
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (eventData) => {
        try {
            const method = eventData.id ? 'PUT' : 'POST'; // Na pratica, meu backend simplificado so tem POST para criar
            // Se fosse update real, precisaria de PUT no backend. 
            // Para simplificar, vou assumir create sempre por enquanto ou ajustar o backend depois se precisar editar.
            // O backend atual so tem POST (create) e DELETE.

            // Se for edição, idealmente deletamos e criamos de novo ou implementamos PUT.
            // Vou implementar apenas criação por hora.

            if (eventData.id) {
                await fetch(`/api/events/${eventData.id}`, { method: 'DELETE' });
            }

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                fetchEvents();
                setIsModalOpen(false);
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('Erro ao salvar evento:', error);
        }
    };

    const handleDeleteEvent = async (id) => {
        try {
            await fetch(`/api/events/${id}`, { method: 'DELETE' });
            fetchEvents();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao deletar evento:', error);
        }
    };

    return (
        <Box sx={{ height: '80vh', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon /> Agenda de Ensaios
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Plus />}
                    onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
                >
                    Novo Ensaio
                </Button>
            </Box>

            <Paper elevation={3} sx={{ p: 2, height: '100%', borderRadius: 2, bgcolor: 'background.paper' }}>
                <Calendar
                    localizer={localizer}
                    events={events} // react-big-calendar espera objetos Date
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    culture="pt-BR"
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    messages={{
                        next: "Próximo",
                        previous: "Anterior",
                        today: "Hoje",
                        month: "Mês",
                        week: "Semana",
                        day: "Dia"
                    }}
                    eventPropGetter={(event) => ({
                        style: {
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: '4px',
                            opacity: 0.8,
                            color: 'white',
                            border: '0px',
                            display: 'block'
                        }
                    })}
                />
            </Paper>

            {isModalOpen && (
                <EventModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    initialData={selectedEvent}
                />
            )}
        </Box>
    );
};

export default RehearsalCalendar;
