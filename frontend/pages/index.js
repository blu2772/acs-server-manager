import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Paper, Divider, Chip } from '@mui/material';
import { PlayArrow as PlayIcon, Stop as StopIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { getServerStatus, startServer, stopServer, getContent } from '../lib/api';
import { toast } from 'react-toastify';

export default function Home() {
  const router = useRouter();
  const [serverStatus, setServerStatus] = useState({ running: false, startTime: null });
  const [content, setContent] = useState({ cars: [], tracks: [] });
  const [isLoading, setIsLoading] = useState(false);

  // Server-Status abrufen
  const fetchServerStatus = async () => {
    try {
      const response = await getServerStatus();
      if (response.success) {
        setServerStatus(response.status);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Server-Status:', error);
    }
  };

  // Inhalte (Autos und Strecken) abrufen
  const fetchContent = async () => {
    try {
      const response = await getContent();
      if (response.success) {
        setContent(response.content);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Inhalte:', error);
    }
  };

  // Initialisierung
  useEffect(() => {
    fetchServerStatus();
    fetchContent();

    // Regelmäßige Aktualisierung des Server-Status
    const intervalId = setInterval(fetchServerStatus, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Server starten
  const handleStartServer = async () => {
    setIsLoading(true);
    try {
      const response = await startServer();
      if (response.success) {
        toast.success('Server erfolgreich gestartet');
        setServerStatus(response.status);
      } else {
        toast.error(response.message || 'Fehler beim Starten des Servers');
      }
    } catch (error) {
      toast.error('Fehler beim Starten des Servers: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };

  // Server stoppen
  const handleStopServer = async () => {
    setIsLoading(true);
    try {
      const response = await stopServer();
      if (response.success) {
        toast.success('Server erfolgreich gestoppt');
        setServerStatus(response.status);
      } else {
        toast.error(response.message || 'Fehler beim Stoppen des Servers');
      }
    } catch (error) {
      toast.error('Fehler beim Stoppen des Servers: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };

  // Zeit formatieren
  const formatUptime = (startTimeStr) => {
    if (!startTimeStr) return 'N/A';
    
    const startTime = new Date(startTimeStr);
    const now = new Date();
    const diffMs = now - startTime;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Assetto Corsa Server Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Server-Status-Karte */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Server-Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1">
                    Status: 
                    <Chip 
                      label={serverStatus.running ? 'Online' : 'Offline'} 
                      color={serverStatus.running ? 'success' : 'error'}
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  
                  {serverStatus.running && (
                    <>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Uptime: {formatUptime(serverStatus.startTime)}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        PID: {serverStatus.pid || 'N/A'}
                      </Typography>
                    </>
                  )}
                </Box>
                
                <Box>
                  {serverStatus.running ? (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={handleStopServer}
                      disabled={isLoading}
                    >
                      Server stoppen
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayIcon />}
                      onClick={handleStartServer}
                      disabled={isLoading}
                    >
                      Server starten
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Inhalts-Karte */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verfügbare Inhalte
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Autos
                    </Typography>
                    <Typography variant="h4">
                      {content.cars?.length || 0}
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={() => router.push('/cars')}
                      sx={{ mt: 1 }}
                    >
                      Autos verwalten
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Strecken
                    </Typography>
                    <Typography variant="h4">
                      {content.tracks?.length || 0}
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={() => router.push('/tracks')}
                      sx={{ mt: 1 }}
                    >
                      Strecken verwalten
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
              
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => router.push('/upload')}
                sx={{ mt: 2 }}
                fullWidth
              >
                Neuen Mod hochladen
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Konfigurationsschnellzugriff */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Schnellzugriff
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => router.push('/configuration')}
                  >
                    Server konfigurieren
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => router.push('/server-control')}
                  >
                    Server-Logs ansehen
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => router.push('/upload')}
                  >
                    Mods verwalten
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export async function getStaticProps() {
  return {
    props: {
      title: 'Dashboard - Assetto Corsa Server Manager'
    }
  };
} 