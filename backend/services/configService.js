const fs = require('fs-extra');
const path = require('path');
const ini = require('ini');

/**
 * Liest die Server-Konfiguration aus der INI-Datei
 * @param {String} serverPath - Pfad zum Serververzeichnis
 * @returns {Promise<Object>} - Server-Konfigurationsobjekt
 */
async function getServerConfig(serverPath) {
  try {
    const configPath = path.join(serverPath, 'cfg', 'server_cfg.ini');
    
    // Wenn die Datei nicht existiert, erstellen wir eine Standard-Konfiguration
    if (!await fs.pathExists(configPath)) {
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
      
      await fs.writeFile(configPath, ini.stringify(defaultConfig));
      return defaultConfig;
    }
    
    // Konfiguration auslesen
    const configContent = await fs.readFile(configPath, 'utf8');
    return ini.parse(configContent);
  } catch (error) {
    console.error('Fehler beim Lesen der Server-Konfiguration:', error);
    throw new Error('Fehler beim Lesen der Server-Konfiguration');
  }
}

/**
 * Aktualisiert die Server-Konfiguration
 * @param {Object} config - Neues Konfigurationsobjekt
 * @param {String} serverPath - Pfad zum Serververzeichnis
 * @returns {Promise<Object>} - Aktualisiertes Konfigurationsobjekt
 */
async function updateServerConfig(config, serverPath) {
  try {
    const configPath = path.join(serverPath, 'cfg', 'server_cfg.ini');
    
    // INI-Datei schreiben
    await fs.writeFile(configPath, ini.stringify(config));
    
    return config;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Server-Konfiguration:', error);
    throw new Error('Fehler beim Aktualisieren der Server-Konfiguration');
  }
}

/**
 * Liest die Entry-List aus der INI-Datei
 * @param {String} serverPath - Pfad zum Serververzeichnis
 * @returns {Promise<Object>} - Entry-List-Objekt
 */
async function getEntryList(serverPath) {
  try {
    const entryListPath = path.join(serverPath, 'cfg', 'entry_list.ini');
    
    // Wenn die Datei nicht existiert, erstellen wir eine leere Entry-List
    if (!await fs.pathExists(entryListPath)) {
      await fs.writeFile(entryListPath, '');
      return {};
    }
    
    // Entry-List auslesen
    const entryListContent = await fs.readFile(entryListPath, 'utf8');
    return ini.parse(entryListContent);
  } catch (error) {
    console.error('Fehler beim Lesen der Entry-List:', error);
    throw new Error('Fehler beim Lesen der Entry-List');
  }
}

/**
 * Aktualisiert die Entry-List
 * @param {Array} entries - Array von Fahrzeugen für die Entry-List
 * @param {String} serverPath - Pfad zum Serververzeichnis
 * @returns {Promise<Object>} - Aktualisiertes Entry-List-Objekt
 */
async function updateEntryList(entries, serverPath) {
  try {
    const entryListPath = path.join(serverPath, 'cfg', 'entry_list.ini');
    
    // Entry-List-Objekt erstellen
    const entryListObj = {};
    
    entries.forEach((entry, index) => {
      entryListObj[`CAR_${index}`] = {
        MODEL: entry.model,
        SKIN: entry.skin || '',
        SPECTATOR_MODE: entry.spectatorMode || 0,
        DRIVERNAME: entry.driverName || '',
        TEAM: entry.team || '',
        GUID: entry.guid || '',
        BALLAST: entry.ballast || 0,
        RESTRICTOR: entry.restrictor || 0
      };
    });
    
    // INI-Datei schreiben
    await fs.writeFile(entryListPath, ini.stringify(entryListObj));
    
    return entryListObj;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Entry-List:', error);
    throw new Error('Fehler beim Aktualisieren der Entry-List');
  }
}

module.exports = {
  getServerConfig,
  updateServerConfig,
  getEntryList,
  updateEntryList
}; 