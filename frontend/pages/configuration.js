import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl, Tabs, Tab, CircularProgress, Divider, Alert, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { getServerConfig, updateServerConfig, getContent, getEntryList, updateEntryList, quickSetup } from '../lib/api';
import { toast } from 'react-toastify';

// TabPanel-Komponente für Tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Configuration() {
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState(null);
  const [entryList, setEntryList] = useState([]);
  const [content, setContent] = useState({ cars: [], tracks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Quick-Setup-Status
  const [quickSetupData, setQuickSetupData] = useState({
    track: '',
    layout: '',
    selectedCars: []
  });

  // Laden der Server-Konfiguration und Inhalte
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Konfiguration und Inhalte parallel laden
        const [configRes, contentRes, entryListRes] = await Promise.all([
          getServerConfig(),
          getContent(),
          getEntryList()
        ]);
        
        if (configRes.success) {
          setConfig(configRes.config);
          
          // Quick-Setup mit aktuellen Werten initialisieren
          if (configRes.config.SERVER) {
            setQuickSetupData(prev => ({
              ...prev,
              track: configRes.config.SERVER.TRACK || '',
              layout: configRes.config.SERVER.CONFIG_TRACK || ''
            }));
          }
        }
        
        if (contentRes.success) {
          setContent(contentRes.content);
        }
        
        if (entryListRes.success) {
          // Entry-List in ein Array umwandeln
          const entries = [];
          const entryListObj = entryListRes.entryList;
          
          for (const key in entryListObj) {
            if (key.startsWith('CAR_')) {
              entries.push({
                model: entryListObj[key].MODEL,
                skin: entryListObj[key].SKIN || '',
                driverName: entryListObj[key].DRIVERNAME || '',
                team: entryListObj[key].TEAM || '',
                guid: entryListObj[key].GUID || '',
                ballast: entryListObj[key].BALLAST || 0,
                restrictor: entryListObj[key].RESTRICTOR || 0
              });
            }
          }
          
          setEntryList(entries);
          
          // Quick-Setup mit ausgewählten Autos initialisieren
          if (configRes.config.SERVER && configRes.config.SERVER.CARS) {
            const selectedCars = configRes.config.SERVER.CARS.split(';').filter(Boolean);
            setQuickSetupData(prev => ({
              ...prev,
              selectedCars
            }));
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        setError('Fehler beim Laden der Konfiguration: ' + (error.message || 'Unbekannter Fehler'));
        toast.error('Fehler beim Laden der Konfiguration');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Tab wechseln
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Konfiguration aktualisieren
  const handleConfigChange = (section, field, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [field]: value
      }
    }));
  };

  // Konfiguration speichern
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await updateServerConfig(config);
      
      if (response.success) {
        setSuccess('Server-Konfiguration erfolgreich gespeichert');
        toast.success('Server-Konfiguration erfolgreich gespeichert');
      } else {
        setError(response.message || 'Fehler beim Speichern der Konfiguration');
        toast.error(response.message || 'Fehler beim Speichern der Konfiguration');
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Konfiguration:', error);
      setError('Fehler beim Speichern der Konfiguration: ' + (error.message || 'Unbekannter Fehler'));
      toast.error('Fehler beim Speichern der Konfiguration');
    } finally {
      setIsSaving(false);
    }
  };

  // Entry-List aktualisieren
  const handleUpdateEntryList = (index, field, value) => {
    setEntryList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Entry-List speichern
  const handleSaveEntryList = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await updateEntryList(entryList);
      
      if (response.success) {
        setSuccess('Entry-List erfolgreich gespeichert');
        toast.success('Entry-List erfolgreich gespeichert');
      } else {
        setError(response.message || 'Fehler beim Speichern der Entry-List');
        toast.error(response.message || 'Fehler beim Speichern der Entry-List');
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Entry-List:', error);
      setError('Fehler beim Speichern der Entry-List: ' + (error.message || 'Unbekannter Fehler'));
      toast.error('Fehler beim Speichern der Entry-List');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick-Setup-Daten ändern
  const handleQuickSetupChange = (field, value) => {
    setQuickSetupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-Auswahl ändern
  const handleCarSelectionChange = (carId) => {
    setQuickSetupData(prev => {
      const selectedCars = [...prev.selectedCars];
      
      if (selectedCars.includes(carId)) {
        return {
          ...prev,
          selectedCars: selectedCars.filter(id => id !== carId)
        };
      } else {
        return {
          ...prev,
          selectedCars: [...selectedCars, carId]
        };
      }
    });
  };

  // Quick-Setup anwenden
  const handleApplyQuickSetup = async () => {
    if (!quickSetupData.track || quickSetupData.selectedCars.length === 0) {
      setError('Bitte wählen Sie eine Strecke und mindestens ein Auto aus');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await quickSetup(
        quickSetupData.track,
        quickSetupData.layout,
        quickSetupData.selectedCars
      );
      
      if (response.success) {
        // Aktualisieren der UI mit den neuen Daten
        setConfig(response.config);
        
        // Entry-List in ein Array umwandeln
        const entries = [];
        const entryListObj = response.entryList;
        
        for (let i = 0; i < entryListObj.length; i++) {
          entries.push(entryListObj[i]);
        }
        
        setEntryList(entries);
        
        setSuccess('Konfiguration erfolgreich angewendet');
        toast.success('Konfiguration erfolgreich angewendet');
      } else {
        setError(response.message || 'Fehler beim Anwenden der Konfiguration');
        toast.error(response.message || 'Fehler beim Anwenden der Konfiguration');
      }
    } catch (error) {
      console.error('Fehler beim Anwenden der Konfiguration:', error);
      setError('Fehler beim Anwenden der Konfiguration: ' + (error.message || 'Unbekannter Fehler'));
      toast.error('Fehler beim Anwenden der Konfiguration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Verfügbare Layouts für die ausgewählte Strecke finden
  const selectedTrack = content.tracks?.find(track => track.id === quickSetupData.track);
  const availableLayouts = selectedTrack?.layouts || [];

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Server-Konfiguration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Schnelleinrichtung" />
          <Tab label="Server-Einstellungen" />
          <Tab label="Renn-Einstellungen" />
          <Tab label="Entry-List" />
        </Tabs>

        {/* Schnelleinrichtung */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Schnelle Server-Einrichtung
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Verwenden Sie diese Optionen, um schnell eine Strecke und erlaubte Autos auszuwählen.
            Dies aktualisiert sowohl die Server-Konfiguration als auch die Entry-List.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="track-select-label">Strecke</InputLabel>
                <Select
                  labelId="track-select-label"
                  value={quickSetupData.track}
                  label="Strecke"
                  onChange={(e) => handleQuickSetupChange('track', e.target.value)}
                >
                  {content.tracks?.map((track) => (
                    <MenuItem key={track.id} value={track.id}>
                      {track.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {quickSetupData.track && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="layout-select-label">Layout</InputLabel>
                  <Select
                    labelId="layout-select-label"
                    value={quickSetupData.layout}
                    label="Layout"
                    onChange={(e) => handleQuickSetupChange('layout', e.target.value)}
                  >
                    {availableLayouts.map((layout) => (
                      <MenuItem key={layout} value={layout}>
                        {layout}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Ausgewählte Autos ({quickSetupData.selectedCars.length})
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                {content.cars?.map((car) => (
                  <FormControlLabel
                    key={car.id}
                    control={
                      <Checkbox
                        checked={quickSetupData.selectedCars.includes(car.id)}
                        onChange={() => handleCarSelectionChange(car.id)}
                      />
                    }
                    label={car.name}
                  />
                ))}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyQuickSetup}
                disabled={isSaving || !quickSetupData.track || quickSetupData.selectedCars.length === 0}
                startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Konfiguration anwenden
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Server-Einstellungen */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Allgemeine Server-Einstellungen
          </Typography>

          {config && config.SERVER && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Server-Name"
                  value={config.SERVER.NAME || ''}
                  onChange={(e) => handleConfigChange('SERVER', 'NAME', e.target.value)}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Passwort"
                  value={config.SERVER.PASSWORD || ''}
                  onChange={(e) => handleConfigChange('SERVER', 'PASSWORD', e.target.value)}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Maximale Spieler"
                  type="number"
                  value={config.SERVER.MAX_CLIENTS || 16}
                  onChange={(e) => handleConfigChange('SERVER', 'MAX_CLIENTS', parseInt(e.target.value) || 16)}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="UDP-Port"
                  type="number"
                  value={config.SERVER.PORT || 9600}
                  onChange={(e) => handleConfigChange('SERVER', 'PORT', parseInt(e.target.value) || 9600)}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="HTTP-Port"
                  type="number"
                  value={config.SERVER.HTTP_PORT || 8081}
                  onChange={(e) => handleConfigChange('SERVER', 'HTTP_PORT', parseInt(e.target.value) || 8081)}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Zusätzliche Einstellungen
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Sonnenstand (Grad)"
                  type="number"
                  value={config.SERVER.SUN_ANGLE || 16}
                  onChange={(e) => handleConfigChange('SERVER', 'SUN_ANGLE', parseInt(e.target.value) || 16)}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Schadensmultiplikator (%)"
                  type="number"
                  value={config.SERVER.DAMAGE_MULTIPLIER || 100}
                  onChange={(e) => handleConfigChange('SERVER', 'DAMAGE_MULTIPLIER', parseInt(e.target.value) || 100)}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Kraftstoffverbrauch (%)"
                  type="number"
                  value={config.SERVER.FUEL_RATE || 100}
                  onChange={(e) => handleConfigChange('SERVER', 'FUEL_RATE', parseInt(e.target.value) || 100)}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveConfig}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              Konfiguration speichern
            </Button>
          </Box>
        </TabPanel>

        {/* Renn-Einstellungen */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Renn-Einstellungen
          </Typography>

          <Grid container spacing={4}>
            {/* Practice */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Training
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {config && config.PRACTICE && (
                <>
                  <TextField
                    fullWidth
                    label="Name"
                    value={config.PRACTICE.NAME || 'Freies Training'}
                    onChange={(e) => handleConfigChange('PRACTICE', 'NAME', e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Dauer (Minuten)"
                    type="number"
                    value={config.PRACTICE.TIME || 30}
                    onChange={(e) => handleConfigChange('PRACTICE', 'TIME', parseInt(e.target.value) || 30)}
                    margin="normal"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.PRACTICE.IS_OPEN === 1}
                        onChange={(e) => handleConfigChange('PRACTICE', 'IS_OPEN', e.target.checked ? 1 : 0)}
                      />
                    }
                    label="Offen (Spieler können jederzeit beitreten)"
                  />
                </>
              )}
            </Grid>

            {/* Qualify */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Qualifikation
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {config && config.QUALIFY && (
                <>
                  <TextField
                    fullWidth
                    label="Name"
                    value={config.QUALIFY.NAME || 'Qualifikation'}
                    onChange={(e) => handleConfigChange('QUALIFY', 'NAME', e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Dauer (Minuten)"
                    type="number"
                    value={config.QUALIFY.TIME || 15}
                    onChange={(e) => handleConfigChange('QUALIFY', 'TIME', parseInt(e.target.value) || 15)}
                    margin="normal"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.QUALIFY.IS_OPEN === 1}
                        onChange={(e) => handleConfigChange('QUALIFY', 'IS_OPEN', e.target.checked ? 1 : 0)}
                      />
                    }
                    label="Offen (Spieler können jederzeit beitreten)"
                  />
                </>
              )}
            </Grid>

            {/* Race */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Rennen
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {config && config.RACE && (
                <>
                  <TextField
                    fullWidth
                    label="Name"
                    value={config.RACE.NAME || 'Rennen'}
                    onChange={(e) => handleConfigChange('RACE', 'NAME', e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Runden"
                    type="number"
                    value={config.RACE.LAPS || 5}
                    onChange={(e) => handleConfigChange('RACE', 'LAPS', parseInt(e.target.value) || 5)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Zeit (0 = unbegrenzt)"
                    type="number"
                    value={config.RACE.TIME || 0}
                    onChange={(e) => handleConfigChange('RACE', 'TIME', parseInt(e.target.value) || 0)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Wartezeit (Sekunden)"
                    type="number"
                    value={config.RACE.WAIT_TIME || 60}
                    onChange={(e) => handleConfigChange('RACE', 'WAIT_TIME', parseInt(e.target.value) || 60)}
                    margin="normal"
                  />
                </>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveConfig}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              Konfiguration speichern
            </Button>
          </Box>
        </TabPanel>

        {/* Entry-List */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Entry-List verwalten
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveEntryList}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              Entry-List speichern
            </Button>
          </Box>

          <Typography variant="body2" color="textSecondary" paragraph>
            Die Entry-List definiert, welche Autos mit welchen Skins für das Rennen verfügbar sind.
          </Typography>

          {entryList.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Keine Autos in der Entry-List. Verwenden Sie die Schnelleinrichtung, um Autos hinzuzufügen.
            </Alert>
          ) : (
            entryList.map((entry, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id={`car-model-label-${index}`}>Auto-Modell</InputLabel>
                      <Select
                        labelId={`car-model-label-${index}`}
                        value={entry.model || ''}
                        label="Auto-Modell"
                        onChange={(e) => handleUpdateEntryList(index, 'model', e.target.value)}
                      >
                        {content.cars?.map((car) => (
                          <MenuItem key={car.id} value={car.id}>
                            {car.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id={`car-skin-label-${index}`}>Skin</InputLabel>
                      <Select
                        labelId={`car-skin-label-${index}`}
                        value={entry.skin || ''}
                        label="Skin"
                        onChange={(e) => handleUpdateEntryList(index, 'skin', e.target.value)}
                      >
                        {content.cars
                          ?.find(car => car.id === entry.model)
                          ?.skins.map((skin) => (
                            <MenuItem key={skin} value={skin}>
                              {skin}
                            </MenuItem>
                          )) || []}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Fahrername"
                      value={entry.driverName || ''}
                      onChange={(e) => handleUpdateEntryList(index, 'driverName', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Team"
                      value={entry.team || ''}
                      onChange={(e) => handleUpdateEntryList(index, 'team', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}

export async function getStaticProps() {
  return {
    props: {
      title: 'Server-Konfiguration - Assetto Corsa Server Manager'
    }
  };
} 