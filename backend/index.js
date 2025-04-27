const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

// Import der Routen
const uploadRoutes = require('./routes/upload');
const contentRoutes = require('./routes/content');
const configRoutes = require('./routes/config');
const serverControlRoutes = require('./routes/server-control');

// Konstanten
const PORT = process.env.PORT || 3001;
// Konvertiere relativen Pfad zu absolutem Pfad, falls nötig
const serverPathFromEnv = process.env.SERVER_PATH || path.join(__dirname, '..', 'server');
const SERVER_PATH = path.isAbsolute(serverPathFromEnv) 
  ? serverPathFromEnv 
  : path.resolve(__dirname, serverPathFromEnv);

console.log(`[DEBUG] Server-Verzeichnis konfiguriert als: ${SERVER_PATH}`);

// Stellen Sie sicher, dass das Hauptverzeichnis existiert
try {
  fs.ensureDirSync(SERVER_PATH);
  console.log(`[DEBUG] Hauptverzeichnis existiert oder wurde erstellt: ${SERVER_PATH}`);
  
  // Unterverzeichnisse erstellen
  const contentPath = path.join(SERVER_PATH, 'content');
  fs.ensureDirSync(contentPath);
  
  const carsPath = path.join(contentPath, 'cars');
  fs.ensureDirSync(carsPath);
  console.log(`[DEBUG] Cars-Verzeichnis existiert oder wurde erstellt: ${carsPath}`);
  
  const tracksPath = path.join(contentPath, 'tracks');
  fs.ensureDirSync(tracksPath);
  console.log(`[DEBUG] Tracks-Verzeichnis existiert oder wurde erstellt: ${tracksPath}`);
  
  const cfgPath = path.join(SERVER_PATH, 'cfg');
  fs.ensureDirSync(cfgPath);
  console.log(`[DEBUG] Konfigurationsverzeichnis existiert oder wurde erstellt: ${cfgPath}`);
} catch (error) {
  console.error(`[DEBUG] Fehler beim Erstellen der Verzeichnisstruktur: ${error.message}`);
  console.error('Bitte überprüfen Sie den SERVER_PATH in der .env-Datei und stellen Sie sicher, dass die Verzeichnisse erstellt werden können.');
  process.exit(1);
}

// Express-App erstellen
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Stellen Sie den Serverpfad als globale Variable zur Verfügung
app.use((req, res, next) => {
  req.serverPath = SERVER_PATH;
  next();
});

// Routen
app.use('/api/upload', uploadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/server', serverControlRoutes);

// Grundlegende Route für Gesundheitscheck
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Assetto Corsa Server Manager API läuft',
    serverPath: SERVER_PATH
  });
});

// Error-Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Ein Fehler ist aufgetreten'
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`[DEBUG] Server-Verzeichnis: ${SERVER_PATH}`);
}); 