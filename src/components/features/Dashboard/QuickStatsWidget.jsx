import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { Music, ListMusic } from 'lucide-react';

const QuickStatsWidget = () => {
    const [stats, setStats] = useState({ setlists: 0, songs: 0 });

    useEffect(() => {
        fetch('/api/setlists')
            .then(res => res.json())
            .then(data => {
                const totalSongs = data.reduce((acc, curr) => acc + (curr.songs?.length || 0), 0);
                setStats({ setlists: data.length, songs: totalSongs });
            })
            .catch(console.error);
    }, []);

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="overline" color="text.secondary">Estatísticas</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center' }}>
                            <ListMusic color="#666" size={24} />
                            <Typography variant="h4" fontWeight="bold">{stats.setlists}</Typography>
                            <Typography variant="caption">Setlists</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center' }}>
                            <Music color="#666" size={24} />
                            <Typography variant="h4" fontWeight="bold">{stats.songs}</Typography>
                            <Typography variant="caption">Músicas</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default QuickStatsWidget;
