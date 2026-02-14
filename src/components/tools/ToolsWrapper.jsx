import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import SmartMetronome from './SmartMetronome';
import SimpleTuner from './SimpleTuner';
import IdeaPad from './IdeaPad';

const ToolsWrapper = () => {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>Ferramentas de Estúdio</Typography>
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <SmartMetronome />
                </Grid>
                <Grid item xs={12} md={6}>
                    <SimpleTuner />
                </Grid>
                <Grid item xs={12}>
                    <IdeaPad />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ToolsWrapper;
