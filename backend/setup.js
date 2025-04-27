/**
 * Setup-Skript für den Assetto Corsa Server Manager
 * Erstellt die Verzeichnisstruktur und initialisiert die Konfigurationsdateien
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const ini = require('ini');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Frage nach dem Serververzeichnis
async function setupServerManager() {
  console.log('=== Assetto Corsa Server Manager Setup ===');
  console.log('Dieses Skript richtet die grundlegende Verzeichnisstruktur ein und initialisiert Konfigurationsdateien.');
  
  // Standardpfad aus .env oder ../server
  const defaultServerPath = process.env.SERVER_PATH || path.join(__dirname, '..', 'server');
  
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
  
  const serverPath = await question(`Server-Verzeichnis eingeben [${defaultServerPath}]: `);
  const finalServerPath = serverPath.trim() || defaultServerPath;
  
  console.log(`\nVerwende Server-Verzeichnis: ${finalServerPath}`);
  
  try {
    // Hauptverzeichnis erstellen
    await fs.ensureDir(finalServerPath);
    console.log(`✓ Hauptverzeichnis erstellt: ${finalServerPath}`);
    
    // Verzeichnisstruktur erstellen
    const directories = [
      path.join(finalServerPath, 'cfg'),
      path.join(finalServerPath, 'content'),
      path.join(finalServerPath, 'content', 'cars'),
      path.join(finalServerPath, 'content', 'tracks'),
      path.join(finalServerPath, 'results')
    ];
    
    for (const dir of directories) {
      await fs.ensureDir(dir);
      console.log(`✓ Verzeichnis erstellt: ${dir}`);
    }
    
    // Standard-Server-Konfiguration erstellen
    const serverCfgPath = path.join(finalServerPath, 'cfg', 'server_cfg.ini');
    
    if (!await fs.pathExists(serverCfgPath)) {
      const defaultConfig = {
        SERVER: {
          NAME: 'Assetto Corsa Server',
          CARS: '',
          TRACK: '',
          CONFIG_TRACK: '',
          SUN_ANGLE: 16,
          MAX_CLIENTS: 16,
          RACE_OVER_TIME: 40,
          PORT: 9600,
          HTTP_PORT: 8081,
          REGISTER_TO_LOBBY: 1,
          PICKUP_MODE_ENABLED: 1,
          SLEEP_TIME: 1,
          VOTING_QUORUM: 75,
          VOTE_DURATION: 20,
          BLACKLIST_MODE: 0,
          CLIENT_SEND_INTERVAL_HZ: 15,
          USE_FLOW_CONTROL: 0,
          LOOP_MODE: 1,
          PASSWORD: '',
          ALLOWED_TYRES_OUT: 2,
          DAMAGE_MULTIPLIER: 100,
          FUEL_RATE: 100,
          TYRE_WEAR_RATE: 100
        },
        PRACTICE: {
          NAME: 'Freies Training',
          TIME: 30,
          IS_OPEN: 1
        },
        QUALIFY: {
          NAME: 'Qualifikation',
          TIME: 15,
          IS_OPEN: 1
        },
        RACE: {
          NAME: 'Rennen',
          LAPS: 5,
          TIME: 0,
          WAIT_TIME: 60
        },
        DYNAMIC_TRACK: {
          SESSION_START: 96,
          RANDOMNESS: 0,
          LAP_GAIN: 30,
          SESSION_TRANSFER: 80
        }
      };
      
      await fs.writeFile(serverCfgPath, ini.stringify(defaultConfig));
      console.log(`✓ Standard-Server-Konfiguration erstellt: ${serverCfgPath}`);
    } else {
      console.log(`✓ Server-Konfiguration existiert bereits: ${serverCfgPath}`);
    }
    
    // Leere Entry-List erstellen
    const entryListPath = path.join(finalServerPath, 'cfg', 'entry_list.ini');
    
    if (!await fs.pathExists(entryListPath)) {
      await fs.writeFile(entryListPath, '# Entry-List wird automatisch durch den Server Manager verwaltet\n');
      console.log(`✓ Entry-List erstellt: ${entryListPath}`);
    } else {
      console.log(`✓ Entry-List existiert bereits: ${entryListPath}`);
    }
    
    // .env aktualisieren
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (error) {
      envContent = '# Server-Konfiguration\nPORT=3001\n\n';
    }
    
    // SERVER_PATH in .env aktualisieren oder hinzufügen
    const serverPathRegex = /SERVER_PATH=.*/;
    const newServerPathLine = `SERVER_PATH=${finalServerPath.replace(/\\/g, '/')}`;
    
    if (serverPathRegex.test(envContent)) {
      envContent = envContent.replace(serverPathRegex, newServerPathLine);
    } else {
      envContent += `\n# Pfad zum Assetto Corsa Server\n${newServerPathLine}\n`;
    }
    
    await fs.writeFile(envPath, envContent);
    console.log(`✓ .env-Datei aktualisiert mit SERVER_PATH=${finalServerPath}`);
    
    console.log('\n✓ Setup erfolgreich abgeschlossen!');
    console.log('\nUm den Server zu starten, führen Sie aus:');
    console.log('  npm start');
    
  } catch (error) {
    console.error(`\n❌ Fehler während des Setups: ${error.message}`);
    console.error('Bitte stellen Sie sicher, dass Sie die nötigen Berechtigungen haben und überprüfen Sie den Pfad.');
  } finally {
    rl.close();
  }
}

setupServerManager(); 