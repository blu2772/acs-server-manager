import React, { useState } from 'react';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Button, 
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  DirectionsCar as CarsIcon,
  Map as TracksIcon,
  Settings as SettingsIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Upload as UploadIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const drawerWidth = 240;

export default function Layout({ children, title = 'Assetto Corsa Server Manager' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', href: '/', icon: <HomeIcon /> },
    { text: 'Autos', href: '/cars', icon: <CarsIcon /> },
    { text: 'Strecken', href: '/tracks', icon: <TracksIcon /> },
    { text: 'Upload', href: '/upload', icon: <UploadIcon /> },
    { text: 'Konfiguration', href: '/configuration', icon: <SettingsIcon /> },
    { text: 'Server-Steuerung', href: '/server-control', icon: <StartIcon /> }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          AC Server Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Link href={item.href} passHref style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
              <ListItemButton selected={router.pathname === item.href}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const container = undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={5000} />
      
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          overflowX: 'hidden'
        }}
      >
        <Toolbar />
        <Container maxWidth={isMobile ? 'sm' : 'lg'}>
          {children}
        </Container>
      </Box>
    </Box>
  );
} 