import React from 'react';
import { Box, Grid, Typography, Card, CardContent, CardActionArea, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Calendar, ListMusic, Mic2, ArrowRight } from 'lucide-react';
import NextEventWidget from './features/Dashboard/NextEventWidget';
import QuickStatsWidget from './features/Dashboard/QuickStatsWidget';

const Dashboard = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    const cards = [
        { title: 'Agenda de Ensaios', icon: <Calendar size={32} />, path: '/agenda', color: theme.palette.primary.main, desc: 'Gerencie horários e ensaios' },
        { title: 'Setlists', icon: <ListMusic size={32} />, path: '/setlists', color: theme.palette.secondary.main, desc: 'Organize suas músicas para shows' },
        { title: 'Ferramentas', icon: <Mic2 size={32} />, path: '/tools', color: theme.palette.error.main, desc: 'Afinador e Metrônomo' },
    ];

    return (
        <Box>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>Painel da Banda</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Bem-vindo de volta! O que vamos fazer hoje?</Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <NextEventWidget />
                </Grid>
                <Grid item xs={12} md={4}>
                    <QuickStatsWidget />
                </Grid>
            </Grid>

            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>Acesso Rápido</Typography>
            <Grid container spacing={3}>
                {cards.map((card) => (
                    <Grid item xs={12} md={4} key={card.title}>
                        <Card
                            elevation={3}
                            sx={{
                                borderRadius: 3,
                                height: '100%',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)' }
                            }}
                        >
                            <CardActionArea onClick={() => navigate(card.path)} sx={{ p: 2, height: '100%' }}>
                                <CardContent>
                                    <Box sx={{
                                        width: 60, height: 60,
                                        borderRadius: '50%',
                                        bgcolor: `${card.color}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: card.color,
                                        mb: 2
                                    }}>
                                        {card.icon}
                                    </Box>
                                    <Typography variant="h5" fontWeight="bold" gutterBottom>{card.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {card.desc}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: card.color, fontWeight: 600, mt: 'auto' }}>
                                        Acessar <ArrowRight size={16} style={{ marginLeft: 8 }} />
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Dashboard;
