import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Divider, Alert, Card, CardContent, Chip, Tooltip } from '@mui/material';
import { PlayArrow as PlayIcon, Stop as StopIcon, Refresh as RefreshIcon, RestartAlt as RestartIcon } from '@mui/icons-material';
import { getServerStatus, startServer, stopServer, restartServer, getServerLogs } from '../lib/api';
import { toast } from 'react-toastify';

export default function ServerControl() {
  const [serverStatus, setServerStatus] = useState({ running: false, startTime: null });
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const logsEndRef = useRef(null);
  const intervalRef = useRef(null);

  // Automatisches Scrollen zu den neuesten Logs
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Server-Status und Logs laden
  const fetchServerData = async () => {
    try {
      // Status abrufen
      const statusResponse = await getServerStatus();
      if (statusResponse.success) {
        setServerStatus(statusResponse.status);
      }

      // Logs abrufen
      const logsResponse = await getServerLogs(100);
      if (logsResponse.success) {
        setLogs(logsResponse.logs);
      }
      
      setError(null);
    } catch (error) {
      console.error('Fehler beim Abrufen der Server-Daten:', error);
      setError('Fehler beim Abrufen der Server-Daten: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialisierung und Polling
  useEffect(() => {
    fetchServerData();

    // Regelmäßige Aktualisierung
    intervalRef.current = setInterval(fetchServerData, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Logs automatisch scrollen
  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Server starten
  const handleStartServer = async () => {
    setIsActionLoading(true);
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
      setIsActionLoading(false);
    }
  };

  // Server stoppen
  const handleStopServer = async () => {
    setIsActionLoading(true);
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
      setIsActionLoading(false);
    }
  };

  // Server neustarten
  const handleRestartServer = async () => {
    setIsActionLoading(true);
    try {
      const response = await restartServer();
      if (response.success) {
        toast.success('Server erfolgreich neu gestartet');
        fetchServerData(); // Status neu laden
      } else {
        toast.error(response.message || 'Fehler beim Neustarten des Servers');
      }
    } catch (error) {
      toast.error('Fehler beim Neustarten des Servers: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsActionLoading(false);
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

  // Zeitstempel formatieren
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Server-Steuerung
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Server-Status-Karte */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" gutterBottom>
                Server-Status
              </Typography>
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
                <>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : <StopIcon />}
                    onClick={handleStopServer}
                    disabled={isActionLoading}
                  >
                    Server stoppen
                  </Button>
                  
                  <Tooltip title="Server neu starten">
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : <RestartIcon />}
                      onClick={handleRestartServer}
                      disabled={isActionLoading}
                      sx={{ ml: 1 }}
                    >
                      Neustart
                    </Button>
                  </Tooltip>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                  onClick={handleStartServer}
                  disabled={isActionLoading}
                >
                  Server starten
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchServerData}
                disabled={isActionLoading}
                sx={{ ml: 2 }}
              >
                Aktualisieren
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Server-Logs */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Server-Logs
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {logs.length === 0 ? (
          <Alert severity="info">
            Keine Logs verfügbar. Starten Sie den Server, um Logs zu sehen.
          </Alert>
        ) : (
          <Box
            sx={{
              height: 400,
              overflowY: 'scroll',
              p: 2,
              backgroundColor: '#222',
              color: '#eee',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              borderRadius: 1
            }}
          >
            {logs.map((log, index) => (
              <Box key={index} sx={{ mb: 1, color: log.type === 'error' ? '#ff6b6b' : 'inherit' }}>
                <Box component="span" sx={{ color: '#aaa', mr: 2 }}>
                  [{formatTimestamp(log.timestamp)}]
                </Box>
                {log.message}
              </Box>
            ))}
            <div ref={logsEndRef} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export async function getStaticProps() {
  return {
    props: {
      title: 'Server-Steuerung - Assetto Corsa Server Manager'
    }
  };
} 