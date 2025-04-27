/**
 * Diagnose-Skript für ACS Server Manager
 * Prüft Server-Pfade, Berechtigungen und Content-Verzeichnisse
 */

const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Lade Umgebungsvariablen
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const SERVER_PATH = process.env.SERVER_PATH || './server';
const API_PORT = process.env.PORT || 3001;

async function diagnose() {
  console.log('=== ACS Server Manager Diagnose ===');
  console.log('Datum und Zeit:', new Date().toISOString());
  console.log('Plattform:', process.platform);
  console.log('Node.js Version:', process.version);
  console.log('\n');

  // 1. Prüfe Umgebungsvariablen
  console.log('=== Umgebungsvariablen ===');
  console.log('SERVER_PATH:', SERVER_PATH);
  console.log('API_PORT:', API_PORT);
  console.log('\n');

  // 2. Prüfe absoluten Pfad
  const absoluteServerPath = path.resolve(SERVER_PATH);
  console.log('=== Server-Pfad ===');
  console.log('Relativer Pfad:', SERVER_PATH);
  console.log('Absoluter Pfad:', absoluteServerPath);
  
  try {
    const stats = await fs.stat(absoluteServerPath);
    console.log('Pfad existiert:', true);
    console.log('Ist Verzeichnis:', stats.isDirectory());
    console.log('Berechtigungen:', stats.mode.toString(8));
  } catch (error) {
    console.log('Fehler beim Zugriff auf Server-Pfad:', error.message);
  }
  console.log('\n');

  // 3. Prüfe Content-Verzeichnisse
  const contentPath = path.join(absoluteServerPath, 'content');
  const carsPath = path.join(contentPath, 'cars');
  const tracksPath = path.join(contentPath, 'tracks');

  console.log('=== Content-Verzeichnisse ===');
  
  // Inhaltsverzeichnis
  try {
    console.log('Content-Pfad:', contentPath);
    if (await fs.pathExists(contentPath)) {
      const stats = await fs.stat(contentPath);
      console.log('Content-Verzeichnis existiert:', true);
      console.log('Berechtigungen:', stats.mode.toString(8));
      
      // Zeige ersten 5 Elemente
      const contentItems = await fs.readdir(contentPath);
      console.log('Inhalt (max. 5 Einträge):', contentItems.slice(0, 5));
    } else {
      console.log('Content-Verzeichnis existiert nicht!');
    }
  } catch (error) {
    console.log('Fehler beim Zugriff auf Content-Verzeichnis:', error.message);
  }
  console.log('\n');
  
  // Autos-Verzeichnis
  try {
    console.log('Autos-Pfad:', carsPath);
    if (await fs.pathExists(carsPath)) {
      const stats = await fs.stat(carsPath);
      console.log('Autos-Verzeichnis existiert:', true);
      console.log('Berechtigungen:', stats.mode.toString(8));
      
      // Zähle Anzahl der Autos
      const cars = await fs.readdir(carsPath);
      console.log('Anzahl Autos:', cars.length);
      
      // Zeige ersten 5 Autos
      console.log('Autos (max. 5 Einträge):', cars.slice(0, 5));
      
      // Prüfe ein Auto im Detail
      if (cars.length > 0) {
        const firstCar = cars[0];
        const carPath = path.join(carsPath, firstCar);
        console.log('\nDetails für Auto:', firstCar);
        
        try {
          const carStats = await fs.stat(carPath);
          console.log('Ist Verzeichnis:', carStats.isDirectory());
          
          if (carStats.isDirectory()) {
            const carContents = await fs.readdir(carPath);
            console.log('Inhalt:', carContents);
            
            // Prüfe auf Skins
            const skinsPath = path.join(carPath, 'skins');
            if (await fs.pathExists(skinsPath)) {
              const skins = await fs.readdir(skinsPath);
              console.log('Skins gefunden:', skins.length);
              console.log('Beispiel-Skins:', skins.slice(0, 3));
            } else {
              console.log('Keine Skins gefunden!');
            }
          }
        } catch (error) {
          console.log('Fehler beim Prüfen des Autos:', error.message);
        }
      }
    } else {
      console.log('Autos-Verzeichnis existiert nicht!');
    }
  } catch (error) {
    console.log('Fehler beim Zugriff auf Autos-Verzeichnis:', error.message);
  }
  console.log('\n');
  
  // Strecken-Verzeichnis
  try {
    console.log('Strecken-Pfad:', tracksPath);
    if (await fs.pathExists(tracksPath)) {
      const stats = await fs.stat(tracksPath);
      console.log('Strecken-Verzeichnis existiert:', true);
      console.log('Berechtigungen:', stats.mode.toString(8));
      
      // Zähle Anzahl der Strecken
      const tracks = await fs.readdir(tracksPath);
      console.log('Anzahl Strecken:', tracks.length);
      
      // Zeige ersten 5 Strecken
      console.log('Strecken (max. 5 Einträge):', tracks.slice(0, 5));
      
      // Prüfe eine Strecke im Detail
      if (tracks.length > 0) {
        const firstTrack = tracks[0];
        const trackPath = path.join(tracksPath, firstTrack);
        console.log('\nDetails für Strecke:', firstTrack);
        
        try {
          const trackStats = await fs.stat(trackPath);
          console.log('Ist Verzeichnis:', trackStats.isDirectory());
          
          if (trackStats.isDirectory()) {
            const trackContents = await fs.readdir(trackPath);
            console.log('Inhalt:', trackContents);
            
            // Prüfe auf Layouts
            const layoutsPath = path.join(trackPath, 'layouts');
            if (await fs.pathExists(layoutsPath)) {
              const layouts = await fs.readdir(layoutsPath);
              console.log('Layouts gefunden:', layouts.length);
              console.log('Beispiel-Layouts:', layouts.slice(0, 3));
            } else {
              console.log('Kein Layouts-Verzeichnis gefunden!');
              
              // Prüfe auf ui_track.json im Hauptverzeichnis
              const uiTrackPath = path.join(trackPath, 'ui_track.json');
              if (await fs.pathExists(uiTrackPath)) {
                console.log('ui_track.json im Hauptverzeichnis gefunden (könnte standardlayout sein)');
              }
              
              // Prüfe auf data-Verzeichnis
              const dataPath = path.join(trackPath, 'data');
              if (await fs.pathExists(dataPath)) {
                console.log('data-Verzeichnis gefunden (könnte standardlayout sein)');
              }
            }
          }
        } catch (error) {
          console.log('Fehler beim Prüfen der Strecke:', error.message);
        }
      }
    } else {
      console.log('Strecken-Verzeichnis existiert nicht!');
    }
  } catch (error) {
    console.log('Fehler beim Zugriff auf Strecken-Verzeichnis:', error.message);
  }
  console.log('\n');
  
  // 4. Prüfe API-Funktionalität
  console.log('=== API-Funktionalität ===');
  
  // Prüfe cars-Endpoint
  try {
    console.log('Teste API-Endpoint: /cars');
    const carsResponse = await axios.get(`http://localhost:${API_PORT}/cars`);
    console.log('Status:', carsResponse.status);
    console.log('Anzahl Autos in API-Antwort:', carsResponse.data.length);
    
    if (carsResponse.data.length > 0) {
      console.log('Beispiel-Auto:', carsResponse.data[0]);
    } else {
      console.log('Keine Autos in API-Antwort!');
    }
  } catch (error) {
    console.log('Fehler beim API-Aufruf /cars:', error.message);
  }
  console.log('\n');
  
  // Prüfe tracks-Endpoint
  try {
    console.log('Teste API-Endpoint: /tracks');
    const tracksResponse = await axios.get(`http://localhost:${API_PORT}/tracks`);
    console.log('Status:', tracksResponse.status);
    console.log('Anzahl Strecken in API-Antwort:', tracksResponse.data.length);
    
    if (tracksResponse.data.length > 0) {
      console.log('Beispiel-Strecke:', tracksResponse.data[0]);
    } else {
      console.log('Keine Strecken in API-Antwort!');
    }
  } catch (error) {
    console.log('Fehler beim API-Aufruf /tracks:', error.message);
  }
  console.log('\n');
  
  // 5. Zusätzliche Systemprüfung
  console.log('=== Systeminformationen ===');
  
  try {
    // Freier Speicherplatz
    if (process.platform === 'linux') {
      const { stdout } = await execPromise('df -h .');
      console.log('Speicherplatz:');
      console.log(stdout);
    } else if (process.platform === 'win32') {
      const { stdout } = await execPromise('wmic logicaldisk get deviceid,freespace,size');
      console.log('Speicherplatz:');
      console.log(stdout);
    }
  } catch (error) {
    console.log('Fehler bei Systemprüfung:', error.message);
  }

  console.log('\n=== Diagnose abgeschlossen ===');
}

// Ausführung
diagnose().catch(error => {
  console.error('Fehler im Diagnose-Skript:', error);
}); 