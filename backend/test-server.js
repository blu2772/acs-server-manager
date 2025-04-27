/**
 * Test-Skript zum direkten Starten des Assetto Corsa Servers
 * Dieses Skript umgeht das Frontend und startet den Server direkt
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

async function testServerStart() {
  console.log('=== Assetto Corsa Server Test ===');
  
  // Server-Pfad aus der .env-Datei oder Standardpfad verwenden
  const serverPath = process.env.SERVER_PATH || path.join(__dirname, '..', 'server');
  console.log(`Verwende Server-Pfad: ${serverPath}`);
  
  // Prüfen, ob das Verzeichnis existiert
  if (!await fs.pathExists(serverPath)) {
    console.error(`Fehler: Server-Verzeichnis existiert nicht: ${serverPath}`);
    process.exit(1);
  }
  
  // Mögliche Pfade zum Executable
  const exePaths = [
    path.join(serverPath, 'acServer.exe'),
    path.join(serverPath, 'acServer')
  ];
  
  let executablePath = null;
  
  // Suche nach dem Executable
  for (const exePath of exePaths) {
    if (await fs.pathExists(exePath)) {
      executablePath = exePath;
      console.log(`Server-Executable gefunden: ${exePath}`);
      break;
    }
  }
  
  if (!executablePath) {
    console.error('Fehler: Keine acServer-Executable gefunden!');
    console.log('Bitte stelle sicher, dass die Executable im angegebenen Pfad existiert.');
    process.exit(1);
  }
  
  // Setze Ausführungsrechte für Linux
  if (process.platform !== 'win32' && executablePath.endsWith('acServer')) {
    try {
      await fs.chmod(executablePath, 0o755);
      console.log('Ausführungsrechte für Linux-Executable gesetzt');
    } catch (error) {
      console.error(`Warnung: Konnte Ausführungsrechte nicht setzen: ${error.message}`);
    }
  }
  
  console.log(`Starte Server: ${executablePath}`);
  
  // Server-Prozess starten
  const serverProcess = spawn(executablePath, [], {
    cwd: serverPath,
    stdio: 'inherit', // Ausgabe direkt an die Konsole weiterleiten
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error(`Fehler beim Starten des Servers: ${error.message}`);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server beendet mit Code ${code}`);
  });
  
  console.log('Server-Prozess gestartet. Drücke Ctrl+C, um zu beenden.');
}

testServerStart().catch(error => {
  console.error(`Ein Fehler ist aufgetreten: ${error.message}`);
}); 