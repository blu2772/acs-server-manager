import React, { useState, useCallback } from 'react';
import { Box, Typography, Paper, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, LinearProgress, Alert, Card, CardContent, Divider } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { uploadMod } from '../lib/api';
import { toast } from 'react-toastify';

export default function Upload() {
  const [selectedModType, setSelectedModType] = useState('car');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Datei-Dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      // Überprüfen, ob es sich um eine ZIP-Datei handelt
      if (selectedFile.type === 'application/zip' || selectedFile.name.toLowerCase().endsWith('.zip')) {
        setFile(selectedFile);
        setUploadError(null);
      } else {
        setUploadError('Bitte laden Sie nur ZIP-Dateien hoch.');
        setFile(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
    },
    maxFiles: 1
  });

  // Mod-Typ ändern
  const handleModTypeChange = (event) => {
    setSelectedModType(event.target.value);
  };

  // Datei hochladen
  const handleUpload = async () => {
    if (!file) {
      setUploadError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Simuliere Fortschritt
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 20;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);

      // Upload durchführen
      const response = await uploadMod(file, selectedModType);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setUploadSuccess(`${selectedModType === 'car' ? 'Auto' : 'Strecke'} "${response.modName}" wurde erfolgreich hochgeladen.`);
        toast.success('Mod erfolgreich hochgeladen!');
        setFile(null);
      } else {
        setUploadError(response.message || 'Beim Hochladen ist ein Fehler aufgetreten.');
        toast.error(response.message || 'Beim Hochladen ist ein Fehler aufgetreten.');
      }
    } catch (error) {
      setUploadError('Beim Hochladen ist ein Fehler aufgetreten: ' + (error.message || 'Unbekannter Fehler'));
      toast.error('Beim Hochladen ist ein Fehler aufgetreten: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsUploading(false);
    }
  };

  // Upload zurücksetzen
  const resetUpload = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(null);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Mods hochladen
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Neue Mod-Datei hochladen
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Mod-Typ auswählen */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Mod-Typ auswählen</FormLabel>
          <RadioGroup
            row
            name="mod-type"
            value={selectedModType}
            onChange={handleModTypeChange}
          >
            <FormControlLabel value="car" control={<Radio />} label="Auto" />
            <FormControlLabel value="track" control={<Radio />} label="Strecke" />
          </RadioGroup>
        </FormControl>

        {/* Dropzone für Datei-Upload */}
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 3,
            mb: 3,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, mb: 2, color: isDragActive ? 'primary.main' : 'action.active' }} />
          
          {isDragActive ? (
            <Typography>Datei hier ablegen...</Typography>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                Ziehen Sie eine ZIP-Datei hierher oder klicken Sie, um eine Datei auszuwählen
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Unterstützt werden nur ZIP-Dateien
              </Typography>
            </>
          )}
          
          {file && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
              <Typography variant="body2">
                Ausgewählte Datei: <strong>{file.name}</strong> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </Typography>
            </Box>
          )}
        </Box>

        {/* Hochladen-Button und Fortschritt */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!file || isUploading}
            startIcon={<UploadIcon />}
            sx={{ flexGrow: 1 }}
          >
            {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </Button>
          
          {file && (
            <Button
              variant="outlined"
              onClick={resetUpload}
              disabled={isUploading}
            >
              Zurücksetzen
            </Button>
          )}
        </Box>

        {/* Ladebalken */}
        {isUploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              {Math.round(uploadProgress)}%
            </Typography>
          </Box>
        )}

        {/* Fehler- oder Erfolgsmeldung */}
        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}

        {uploadSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {uploadSuccess}
          </Alert>
        )}
      </Paper>

      {/* Hilfe-Karte */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Hinweise zum Hochladen
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="body2" gutterBottom>
            <strong>Auto-Mods:</strong> Die ZIP-Datei sollte einen Hauptordner enthalten, der nach dem Auto benannt ist
            (z.B. "ks_ferrari_488"). Innerhalb dieses Ordners sollten sich die Auto-Dateien und ein "skins"-Ordner befinden.
          </Typography>
          
          <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
            <strong>Strecken-Mods:</strong> Die ZIP-Datei sollte einen Hauptordner enthalten, der nach der Strecke benannt ist
            (z.B. "monza"). Innerhalb dieses Ordners sollten sich die Streckendateien und optional ein "layouts"-Ordner befinden.
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Nach dem Hochladen wird die ZIP-Datei entpackt und im entsprechenden Verzeichnis des Assetto Corsa Servers installiert.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export async function getStaticProps() {
  return {
    props: {
      title: 'Mods hochladen - Assetto Corsa Server Manager'
    }
  };
} 