/**
 * Einfaches Testskript zum direkten Starten des Assetto Corsa Servers mit Shell-Befehlen
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

// Serverpfad aus der .env-Datei laden
const serverPath = process.env.SERVER_PATH || path.join(__dirname, '..', 'server');
console.log(`=== Direkter Assetto Corsa Server Test ===`);
console.log(`Serververzeichnis: ${serverPath}`);

// Prüfen, ob das Verzeichnis existiert
if (!fs.existsSync(serverPath)) {
  console.error(`Fehler: Serververzeichnis ${serverPath} existiert nicht!`);
  process.exit(1);
}

// Verzeichnisinhalt anzeigen
try {
  console.log('\nVerzeichnisinhalt:');
  const output = execSync(`ls -la "${serverPath}"`, { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error(`Fehler beim Anzeigen des Verzeichnisinhalts: ${error.message}`);
}

// Prüfen, ob die Linux-Executable existiert
const acServerPath = path.join(serverPath, 'acServer');
if (fs.existsSync(acServerPath)) {
  console.log(`\nAC Server Executable existiert: ${acServerPath}`);
  
  // Berechtigungen anzeigen
  try {
    const permissions = execSync(`ls -la "${acServerPath}"`, { encoding: 'utf8' });
    console.log(`Berechtigungen: ${permissions.trim()}`);
  } catch (error) {
    console.error(`Fehler beim Anzeigen der Berechtigungen: ${error.message}`);
  }
  
  // Executable-Rechte setzen
  try {
    console.log('\nSetzt Ausführungsrechte...');
    execSync(`chmod +x "${acServerPath}"`, { encoding: 'utf8' });
    console.log('Ausführungsrechte gesetzt.');
    
    // Berechtigungen nach dem Ändern anzeigen
    const newPermissions = execSync(`ls -la "${acServerPath}"`, { encoding: 'utf8' });
    console.log(`Neue Berechtigungen: ${newPermissions.trim()}`);
  } catch (error) {
    console.error(`Fehler beim Setzen der Ausführungsrechte: ${error.message}`);
  }
  
  // Versuchen, den Server zu starten
  try {
    console.log('\n=== Starte den Server über Shell ===');
    console.log('WICHTIG: Drücke Strg+C, um den Server zu beenden.\n');
    
    // Wechsle ins Serververzeichnis und starte den Server
    const command = `cd "${serverPath}" && ./acServer`;
    console.log(`Ausführen: ${command}`);
    
    // Server im Vordergrund starten
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    // Hier wird der Code fortgesetzt, wenn der Benutzer den Prozess mit Strg+C beendet
    console.log('\nServer-Prozess beendet.');
  }
} else {
  console.error(`\nFehler: AC Server Executable nicht gefunden: ${acServerPath}`);
  
  // Suche nach dem Executable im gesamten Verzeichnis
  try {
    console.log('\nSuche nach acServer im gesamten Verzeichnis...');
    const searchResult = execSync(`find "${serverPath}" -name acServer -type f`, { encoding: 'utf8' });
    
    if (searchResult.trim()) {
      console.log(`Gefundene acServer-Dateien:\n${searchResult}`);
      
      // Wenn acServer gefunden wurde, versuche den ersten Treffer zu verwenden
      const foundPath = searchResult.trim().split('\n')[0];
      console.log(`Versuche gefundenen Pfad: ${foundPath}`);
      
      // Berechtigungen setzen
      execSync(`chmod +x "${foundPath}"`, { encoding: 'utf8' });
      console.log(`Ausführungsrechte für ${foundPath} gesetzt.`);
      
      // Versuchen, den Server zu starten
      try {
        console.log('\n=== Starte den Server über Shell mit gefundenem Pfad ===');
        console.log('WICHTIG: Drücke Strg+C, um den Server zu beenden.\n');
        
        // Wechsle ins Verzeichnis und starte den Server
        const foundDir = path.dirname(foundPath);
        const command = `cd "${foundDir}" && ./acServer`;
        console.log(`Ausführen: ${command}`);
        
        execSync(command, { stdio: 'inherit' });
      } catch (error) {
        console.log('\nServer-Prozess beendet.');
      }
    } else {
      console.error('Keine acServer-Dateien gefunden.');
    }
  } catch (error) {
    console.error(`Fehler bei der Suche nach acServer: ${error.message}`);
  }
} 