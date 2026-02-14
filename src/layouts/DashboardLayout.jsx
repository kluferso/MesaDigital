import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, useTheme, IconButton } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Music, ListMusic, Mic2, Home, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const DRAWER_WIDTH = 240;

const DashboardLayout = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { text: 'Início', icon: <Home size={20} />, path: '/dashboard' },
        { text: 'Agenda', icon: <Calendar size={20} />, path: '/agenda' },
        { text: 'Setlists', icon: <ListMusic size={20} />, path: '/setlists' },
        { text: 'Ferramentas', icon: <Mic2 size={20} />, path: '/tools' },
    ];

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: 'background.paper',
                        borderRight: '1px solid rgba(255, 255, 255, 0.12)'
                    },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box component="img" src="/logo-musical.svg" sx={{ width: 32, height: 32 }} />
                    <Typography variant="h6" fontWeight="bold">Mesa Digital</Typography>
                </Box>

                <List sx={{ px: 2 }}>
                    {menuItems.map((item) => (
                        <ListItem
                            button
                            key={item.text}
                            onClick={() => navigate(item.path)}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                bgcolor: location.pathname === item.path ? 'action.selected' : 'transparent',
                                color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                    color: 'text.primary'
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ mt: 'auto', p: 2 }}>
                    <ListItem button onClick={() => navigate('/')} sx={{ borderRadius: 2, color: 'error.main' }}>
                        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><LogOut size={20} /></ListItemIcon>
                        <ListItemText primary="Sair" />
                    </ListItem>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        style={{ height: '100%' }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </Box>
        </Box>
    );
};

export default DashboardLayout;
