const fs = require('fs-extra');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const os = require('os');

// Speichern des Server-Prozesses für spätere Verwaltung
let serverProcess = null;
let serverStatus = {
  running: false,
  startTime: null,
  pid: null,
  logs: []
};

// Maximale Anzahl an Log-Zeilen im Speicher
const MAX_LOG_LINES = 1000;

// Funktion zum Hinzufügen von Logs mit Zeitstempel
function addLog(message, isError = false) {
  const timestamp = new Date();
  const logEntry = {
    timestamp,
    message,
    type: isError ? 'error' : 'info'
  };
  
  serverStatus.logs.unshift(logEntry);
  
  // Begrenze die Logs auf die letzten 1000 Einträge
  if (serverStatus.logs.length > 1000) {
    serverStatus.logs = serverStatus.logs.slice(0, 1000);
  }
  
  console.log(`[${isError ? 'ERROR' : 'INFO'}] ${message}`);
}

/**
 * Überprüft, ob der Server-Prozess noch läuft
 * @returns {Promise<Boolean>} - True, wenn der Prozess läuft
 */
async function isProcessRunning(pid) {
  if (!pid) return false;
  
  try {
    // Unterschiedliche Befehle je nach Betriebssystem
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /NH`);
      return stdout.includes(`${pid}`);
    } else {
      // Linux/Unix: Prüfen, ob das Verzeichnis im /proc existiert
      return await fs.pathExists(`/proc/${pid}`);
    }
  } catch (error) {
    console.error(`[DEBUG] Fehler beim Überprüfen des Prozesses: ${error.message}`);
    return false;
  }
}

/**
 * Startet den Assetto Corsa Server
 * @param {String} serverPath - Pfad zum Serververzeichnis
 * @returns {Promise<Object>} - Server-Status-Objekt
 */
async function startServer(serverPath) {
  try {
    console.log(`[DEBUG] Versuche Server zu starten. ServerPath: ${serverPath}`);
    
    // Überprüfen, ob der Server bereits läuft
    if (serverProcess !== null) {
      const isRunning = serverStatus.running && serverStatus.pid && await isProcessRunning(serverStatus.pid);
      
      if (isRunning) {
        addLog('Server läuft bereits', false);
        return {
          success: false,
          message: 'Server läuft bereits',
          status: serverStatus
        };
      } else {
        // Setze Status zurück, falls der Prozess nicht mehr läuft
        console.log('[DEBUG] Server-Prozess existiert, läuft aber nicht mehr. Setze Status zurück.');
        serverProcess = null;
        serverStatus.running = false;
        serverStatus.pid = null;
        addLog('Server-Prozess wurde außerhalb beendet, setze Status zurück', false);
      }
    }
    
    // Verzeichnis auf Existenz prüfen
    if (!await fs.pathExists(serverPath)) {
      const errorMsg = `Server-Verzeichnis existiert nicht: ${serverPath}`;
      addLog(errorMsg, true);
      return {
        success: false,
        message: errorMsg,
        status: serverStatus
      };
    }
    
    console.log('[DEBUG] Server-Verzeichnis existiert:', serverPath);
    
    // Verzeichnisinhalt ausgeben für Debugging
    const dirContents = await fs.readdir(serverPath);
    console.log('[DEBUG] Inhalt des Server-Verzeichnisses:', dirContents.join(', '));
    
    // Betriebssystem ermitteln
    const isWindows = process.platform === 'win32';
    console.log(`[DEBUG] Betriebssystem: ${isWindows ? 'Windows' : 'Linux/Unix'}`);
    
    // Pfade zu möglichen Executables
    const windowsExePath = path.join(serverPath, 'acServer.exe');
    const linuxExePath = path.join(serverPath, 'acServer');
    
    console.log('[DEBUG] Suche nach Executables:');
    console.log(`    - Windows: ${windowsExePath}`);
    console.log(`    - Linux: ${linuxExePath}`);
    
    // Prüfen, ob die Executables existieren
    const windowsExeExists = await fs.pathExists(windowsExePath);
    const linuxExeExists = await fs.pathExists(linuxExePath);
    
    if (windowsExeExists) console.log('[DEBUG] Windows-Executable gefunden:', windowsExePath);
    if (linuxExeExists) console.log('[DEBUG] Linux-Executable gefunden:', linuxExePath);
    
    // Executable-Pfad basierend auf Betriebssystem wählen
    let exePath;
    
    if (isWindows && windowsExeExists) {
      exePath = windowsExePath;
      console.log('[DEBUG] Verwende Windows-Executable:', exePath);
    } else if (linuxExeExists) {
      exePath = linuxExePath;
      console.log('[DEBUG] Verwende Linux-Executable:', exePath);
      
      // Ausführungsrechte für Linux-Executable setzen
      try {
        await fs.chmod(exePath, 0o755);
        console.log('[DEBUG] Ausführungsrechte für Linux-Executable gesetzt');
        
        // Nochmals explizit chmod ausführen für Debugging
        await execAsync(`chmod +x ${exePath}`);
        console.log(`[DEBUG] Ausführungsrechte nochmals für ${exePath} gesetzt`);
        
        // Überprüfen, ob die Datei ausführbar ist
        const isExecutable = (await fs.stat(exePath)).mode & 0o111;
        console.log(`[DEBUG] Executable ist ausführbar: ${isExecutable ? 'Ja' : 'Nein'}`);
      } catch (error) {
        console.error(`[DEBUG] Fehler beim Setzen der Ausführungsrechte: ${error.message}`);
      }
    } else {
      const errorMsg = 'Keine passende Server-Executable gefunden';
      addLog(errorMsg, true);
      return {
        success: false,
        message: errorMsg,
        status: serverStatus
      };
    }
    
    // Prozess-Optionen
    const options = {
      cwd: serverPath,
      detached: false,  // Nicht im Hintergrund laufen lassen
      shell: true       // Shell verwenden für bessere Kompatibilität
    };
    
    console.log(`[DEBUG] Starte Prozess mit den Optionen: cwd=${options.cwd}, shell=${options.shell}, detached=${options.detached}`);
    console.log(`[DEBUG] spawn(${exePath}, [], ${JSON.stringify(options)})`);
    
    // Für Linux noch einmal explizit chmod ausführen
    if (!isWindows) {
      console.log('[DEBUG] Führe chmod +x explizit aus');
      try {
        await execAsync(`chmod +x "${exePath}"`);
      } catch (error) {
        console.error(`[DEBUG] Fehler bei explizitem chmod: ${error.message}`);
      }
    }
    
    // Server starten
    try {
      // Bei Problemen mit spawn, versuche es mit exec
      if (isWindows) {
        serverProcess = spawn(exePath, [], options);
      } else {
        console.log('[DEBUG] Starte Server mit direktem Befehl');
        serverProcess = spawn(exePath, [], options);
      }
      
      // Prozess-Ereignisse behandeln
      serverProcess.on('error', (error) => {
        console.error(`[DEBUG] Server-Prozess-Fehler: ${error.message}`);
        addLog(`Server-Prozess-Fehler: ${error.message}`, true);
        
        // Status zurücksetzen
        serverStatus.running = false;
        serverStatus.pid = null;
        serverProcess = null;
      });
      
      serverProcess.on('exit', (code, signal) => {
        console.log(`[DEBUG] Server-Prozess beendet mit Code ${code}, Signal: ${signal}`);
        addLog(`Server-Prozess beendet mit Code ${code}${signal ? `, Signal: ${signal}` : ''}`, code !== 0);
        
        // Status zurücksetzen
        serverStatus.running = false;
        serverStatus.pid = null;
        serverProcess = null;
      });
      
      // Ausgabe des Servers erfassen
      serverProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        if (message) addLog(message);
      });
      
      serverProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message) addLog(message, true);
      });
      
      // Status aktualisieren
      serverStatus.running = true;
      serverStatus.startTime = new Date();
      serverStatus.pid = serverProcess.pid;
      
      addLog(`Prüfe Server-Verzeichnis: ${serverPath}`);
      addLog(`Server-Executable gefunden: ${exePath}`);
      
      if (!isWindows) {
        addLog('Ausführungsrechte für Linux-Executable gesetzt');
      }
      
      addLog(`Starte Server mit Executable: ${exePath}`);
      addLog(`Server-Prozess gestartet mit PID: ${serverProcess.pid}`);
      
      // Prozess regelmäßig überprüfen
      setupProcessCheck();
      
      return {
        success: true,
        message: 'Server erfolgreich gestartet',
        status: serverStatus
      };
    } catch (error) {
      console.error(`[DEBUG] Fehler beim Starten des Server-Prozesses: ${error.message}`);
      addLog(`Fehler beim Starten des Server-Prozesses: ${error.message}`, true);
      
      return {
        success: false,
        message: `Fehler beim Starten des Servers: ${error.message}`,
        status: serverStatus
      };
    }
  } catch (error) {
    console.error(`[DEBUG] Unerwarteter Fehler beim Starten des Servers: ${error.message}`);
    addLog(`Unerwarteter Fehler beim Starten des Servers: ${error.message}`, true);
    
    return {
      success: false,
      message: `Unerwarteter Fehler: ${error.message}`,
      status: serverStatus
    };
  }
}

/**
 * Richtet eine regelmäßige Überprüfung des Server-Prozesses ein
 */
function setupProcessCheck() {
  const checkInterval = setInterval(async () => {
    // Wenn kein Prozess oder keine PID vorhanden, Überprüfung beenden
    if (!serverProcess || !serverStatus.pid) {
      clearInterval(checkInterval);
      return;
    }
    
    // Prüfen, ob der Prozess noch läuft
    const isRunning = await isProcessRunning(serverStatus.pid);
    
    if (!isRunning && serverStatus.running) {
      console.log(`[DEBUG] Prozess-Check: Server wurde außerhalb beendet (PID: ${serverStatus.pid})`);
      addLog('Server wurde außerhalb beendet', true);
      
      // Status aktualisieren
      serverStatus.running = false;
      serverProcess = null;
      
      // Intervall beenden
      clearInterval(checkInterval);
    }
  }, 5000); // Alle 5 Sekunden prüfen
}

/**
 * Stoppt den laufenden Assetto Corsa Server
 * @returns {Promise<Object>} - Server-Status-Objekt
 */
async function stopServer() {
  try {
    // Überprüfen, ob der Server läuft
    if (!serverProcess || !serverStatus.running) {
      addLog('Server läuft nicht', false);
      return {
        success: false,
        message: 'Server läuft nicht',
        status: serverStatus
      };
    }
    
    // PID speichern für zusätzliche Sicherheit
    const pidToKill = serverStatus.pid;
    
    // Versuche, den Prozess zu beenden
    try {
      // Kill-Signal senden
      if (process.platform === 'win32') {
        // Windows: Prozess direkt beenden
        serverProcess.kill();
      } else {
        // Linux/Unix: SIGTERM senden
        serverProcess.kill('SIGTERM');
      }
      
      addLog('Server-Stopp-Signal gesendet');
      
      // Warten, bis der Prozess beendet ist
      let tries = 0;
      const maxTries = 10;
      
      while (tries < maxTries) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Prüfen, ob der Prozess noch läuft
        const isRunning = await isProcessRunning(pidToKill);
        
        if (!isRunning) {
          break;
        }
        
        tries++;
      }
      
      // Falls der Prozess nach mehreren Versuchen noch läuft, mit SIGKILL versuchen
      if (tries === maxTries) {
        console.log(`[DEBUG] Prozess reagiert nicht, versuche SIGKILL (PID: ${pidToKill})`);
        
        // Unterschiedliche Befehle je nach Betriebssystem
        if (process.platform === 'win32') {
          await execAsync(`taskkill /F /PID ${pidToKill}`);
        } else {
          await execAsync(`kill -9 ${pidToKill}`);
        }
        
        addLog('Server-Prozess zwangsweise beendet', true);
      } else {
        addLog('Server-Prozess erfolgreich beendet');
      }
    } catch (error) {
      console.error(`[DEBUG] Fehler beim Beenden des Prozesses: ${error.message}`);
      
      // Trotzdem versuchen, den Prozess mit Betriebssystem-Befehlen zu beenden
      try {
        if (process.platform === 'win32') {
          await execAsync(`taskkill /F /PID ${pidToKill}`);
        } else {
          await execAsync(`kill -9 ${pidToKill}`);
        }
        
        addLog('Server-Prozess mit Systembefehl beendet', true);
      } catch (killError) {
        console.error(`[DEBUG] Auch Systembefehl konnte Prozess nicht beenden: ${killError.message}`);
        addLog(`Fehler beim Beenden des Servers: ${error.message}`, true);
        
        // Trotzdem den Status zurücksetzen
        serverStatus.running = false;
        serverProcess = null;
        
        return {
          success: false,
          message: `Fehler beim Beenden des Servers: ${error.message}`,
          status: serverStatus
        };
      }
    }
    
    // Status zurücksetzen
    serverStatus.running = false;
    serverStatus.pid = null;
    serverProcess = null;
    
    return {
      success: true,
      message: 'Server erfolgreich gestoppt',
      status: serverStatus
    };
  } catch (error) {
    console.error(`[DEBUG] Unerwarteter Fehler beim Stoppen des Servers: ${error.message}`);
    addLog(`Unerwarteter Fehler beim Stoppen des Servers: ${error.message}`, true);
    
    return {
      success: false,
      message: `Unerwarteter Fehler: ${error.message}`,
      status: serverStatus
    };
  }
}

/**
 * Gibt den aktuellen Status des Servers zurück
 * @returns {Object} - Server-Status-Objekt
 */
function getServerStatus() {
  return {
    success: true,
    status: serverStatus
  };
}

/**
 * Gibt die Server-Logs zurück
 * @param {Number} lines - Anzahl der zurückzugebenden Zeilen
 * @returns {Array} - Server-Logs
 */
function getServerLogs(lines = 100) {
  return serverStatus.logs.slice(0, lines);
}

module.exports = {
  startServer,
  stopServer,
  getServerStatus,
  getServerLogs
}; 