const fs = require('fs-extra');
const path = require('path');

/**
 * @returns {Promise<Array>} - Liste der verfügbaren Autos
 */
async function getCars(serverPath) {
  try {
    console.log(`[DEBUG] Lese Autos aus: ${serverPath}`);
    
    const carsPath = path.join(serverPath, 'content', 'cars');
    console.log(`[DEBUG] Vollständiger Pfad zum Autos-Verzeichnis: ${carsPath}`);
    
    // Prüfen, ob das Verzeichnis existiert
    if (!await fs.pathExists(carsPath)) {
      console.error(`[DEBUG] Autos-Verzeichnis existiert nicht: ${carsPath}`);
      return [];
    }
    
    // Prüfen, ob das Verzeichnis lesbar ist
    try {
      await fs.access(carsPath, fs.constants.R_OK);
      console.log(`[DEBUG] Autos-Verzeichnis ist lesbar`);
    } catch (err) {
      console.error(`[DEBUG] Autos-Verzeichnis ist nicht lesbar: ${err.message}`);
      return [];
    }
    
    // Direktes Listing des Verzeichnisses für Debugging
    try {
      const dirContents = await fs.readdir(carsPath);
      console.log(`[DEBUG] Inhalt des Autos-Verzeichnisses: ${dirContents.join(', ')}`);
      console.log(`[DEBUG] Anzahl gefundener Einträge: ${dirContents.length}`);
    } catch (readError) {
      console.error(`[DEBUG] Konnte Verzeichnisinhalt nicht lesen: ${readError.message}`);
    }
    
    const carFolders = await fs.readdir(carsPath);
    console.log(`[DEBUG] Gefundene Auto-Ordner: ${carFolders.length}`);
    
    const cars = [];
    
    // Statistik für die Fehlersuche
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const carFolder of carFolders) {
      try {
        // Überprüfen, ob es sich um ein Verzeichnis handelt
        const folderPath = path.join(carsPath, carFolder);
        const stats = await fs.stat(folderPath);
        
        if (!stats.isDirectory()) {
          console.log(`[DEBUG] Überspringe Nicht-Verzeichnis: ${carFolder}`);
          skippedCount++;
          continue;
        }
        
        // Skin-Verzeichnis prüfen
        const skinsPath = path.join(folderPath, 'skins');
        let skins = [];
        
        if (await fs.pathExists(skinsPath)) {
          try {
            const skinFolders = await fs.readdir(skinsPath);
            
            // Nur Verzeichnisse berücksichtigen
            for (const skinFolder of skinFolders) {
              const skinFolderPath = path.join(skinsPath, skinFolder);
              
              try {
                if ((await fs.stat(skinFolderPath)).isDirectory()) {
                  skins.push(skinFolder);
                }
              } catch (skinStatError) {
                console.error(`[DEBUG] Fehler beim Prüfen des Skin-Ordners ${skinFolder}: ${skinStatError.message}`);
              }
            }
          } catch (skinsError) {
            console.error(`[DEBUG] Fehler beim Lesen der Skins für ${carFolder}: ${skinsError.message}`);
          }
        } else {
          console.log(`[DEBUG] Keine Skins gefunden für ${carFolder}`);
        }
        
        // Auto zur Liste hinzufügen
        cars.push({
          id: carFolder,
          name: carFolder.replace(/_/g, ' '),
          path: folderPath,
          skins
        });
        
        processedCount++;
      } catch (error) {
        console.error(`[DEBUG] Fehler bei der Verarbeitung von Auto ${carFolder}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`[DEBUG] Auto-Verarbeitung abgeschlossen: ${processedCount} verarbeitet, ${skippedCount} übersprungen, ${errorCount} Fehler`);
    console.log(`[DEBUG] Insgesamt ${cars.length} Autos mit Skins gefunden`);
    
    return cars;
  } catch (error) {
    console.error(`[DEBUG] Fehler beim Auslesen der Autos: ${error.message}`);
    console.error(`[DEBUG] Stack: ${error.stack}`);
    throw error; // Originalen Fehler weitergeben für bessere Diagnose
  }
}

/**
 * @returns {Promise<Array>} - Liste der verfügbaren Strecken mit Layouts
 */
async function getTracks(serverPath) {
  try {
    console.log(`[DEBUG] Lese Strecken aus: ${serverPath}`);
    
    const tracksPath = path.join(serverPath, 'content', 'tracks');
    console.log(`[DEBUG] Vollständiger Pfad zum Strecken-Verzeichnis: ${tracksPath}`);
    
    // Prüfen, ob das Verzeichnis existiert
    if (!await fs.pathExists(tracksPath)) {
      console.error(`[DEBUG] Strecken-Verzeichnis existiert nicht: ${tracksPath}`);
      return [];
    }
    
    // Prüfen, ob das Verzeichnis lesbar ist
    try {
      await fs.access(tracksPath, fs.constants.R_OK);
      console.log(`[DEBUG] Strecken-Verzeichnis ist lesbar`);
    } catch (err) {
      console.error(`[DEBUG] Strecken-Verzeichnis ist nicht lesbar: ${err.message}`);
      return [];
    }
    
    // Direktes Listing des Verzeichnisses für Debugging
    try {
      const dirContents = await fs.readdir(tracksPath);
      console.log(`[DEBUG] Inhalt des Strecken-Verzeichnisses: ${dirContents.join(', ')}`);
      console.log(`[DEBUG] Anzahl gefundener Einträge: ${dirContents.length}`);
    } catch (readError) {
      console.error(`[DEBUG] Konnte Verzeichnisinhalt nicht lesen: ${readError.message}`);
    }
    
    // Lokale Hilfsfunktion: Prüft, ob ein Verzeichnis ein Layout ist
    async function isLayoutDirectory(dirPath) {
      // Ein Verzeichnis ist ein Layout, wenn eines der folgenden zutrifft:
      // 1. Es enthält eine ui_track.json Datei
      const uiTrackPath = path.join(dirPath, 'ui_track.json');
      if (await fs.pathExists(uiTrackPath)) {
        return true;
      }
      
      // 2. Es enthält ein data-Verzeichnis
      const dataPath = path.join(dirPath, 'data');
      if (await fs.pathExists(dataPath)) {
        return true;
      }
      
      return false;
    }
    
    const trackFolders = await fs.readdir(tracksPath);
    console.log(`[DEBUG] Gefundene Strecken-Ordner: ${trackFolders.length}`);
    
    const tracks = [];
    
    // Statistik für die Fehlersuche
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const trackFolder of trackFolders) {
      try {
        // Überprüfen, ob es sich um ein Verzeichnis handelt
        const folderPath = path.join(tracksPath, trackFolder);
        let stats;
        
        try {
          stats = await fs.stat(folderPath);
        } catch (err) {
          console.error(`[DEBUG] Fehler beim Prüfen von ${trackFolder}: ${err.message}`);
          errorCount++;
          continue;
        }
        
        if (!stats.isDirectory()) {
          console.log(`[DEBUG] Überspringe Nicht-Verzeichnis: ${trackFolder}`);
          skippedCount++;
          continue;
        }
        
        console.log(`[DEBUG] Verarbeite Strecke: ${trackFolder}`);
        
        // Debugausgabe des Verzeichnisinhalts
        try {
          const dirContents = await fs.readdir(folderPath);
          console.log(`[DEBUG] Inhalt des Streckenordners ${trackFolder}:`, dirContents.join(', '));
        } catch (err) {
          console.error(`[DEBUG] Fehler beim Lesen des Streckenordners: ${err.message}`);
          errorCount++;
        }
        
        // Versuchen, Layouts zu finden
        const layouts = new Set(); // Verwende Set um Duplikate zu vermeiden
        
        // Methode 1: Layouts im Unterverzeichnis "layouts"
        const layoutsPath = path.join(folderPath, 'layouts');
        
        if (await fs.pathExists(layoutsPath)) {
          console.log(`[DEBUG] Layouts-Verzeichnis gefunden für ${trackFolder}`);
          try {
            const layoutFolders = await fs.readdir(layoutsPath);
            
            for (const layoutFolder of layoutFolders) {
              const layoutPath = path.join(layoutsPath, layoutFolder);
              try {
                const layoutStats = await fs.stat(layoutPath);
                
                if (layoutStats.isDirectory()) {
                  if (await isLayoutDirectory(layoutPath)) {
                    console.log(`[DEBUG] Valides Layout gefunden in layouts/: ${layoutFolder} für Strecke ${trackFolder}`);
                    layouts.add(layoutFolder);
                  } else {
                    console.log(`[DEBUG] Verzeichnis in layouts/ scheint kein Layout zu sein: ${layoutFolder}`);
                  }
                }
              } catch (layoutError) {
                console.error(`[DEBUG] Fehler beim Prüfen des Layouts ${layoutFolder}: ${layoutError.message}`);
              }
            }
          } catch (err) {
            console.error(`[DEBUG] Fehler beim Lesen des Layouts-Verzeichnisses: ${err.message}`);
            errorCount++;
          }
        }
        
        // Methode 2: UI-Folder als Layout betrachten, falls vorhanden
        const uiPath = path.join(folderPath, 'ui');
        if (await fs.pathExists(uiPath)) {
          const uiTrackPath = path.join(uiPath, 'ui_track.json');
          if (await fs.pathExists(uiTrackPath)) {
            console.log(`[DEBUG] UI-Verzeichnis mit ui_track.json gefunden für ${trackFolder}, könnte Hauptlayout sein`);
            layouts.add('default');
          }
        }
        
        // Methode 3: Direkte Unterordner prüfen
        try {
          const subDirs = await fs.readdir(folderPath);
          
          // Liste der Ordner, die keine Layouts sind (typische Unterordner in Strecken)
          const nonLayoutDirs = ['data', 'maps', 'models', 'skies', 'textures', 'ui', 'layouts'];
          
          for (const subDir of subDirs) {
            // Überspringe bekannte Nicht-Layout-Ordner
            if (nonLayoutDirs.includes(subDir)) {
              continue;
            }
            
            const subDirPath = path.join(folderPath, subDir);
            
            try {
              const isDir = (await fs.stat(subDirPath)).isDirectory();
              
              if (isDir && await isLayoutDirectory(subDirPath)) {
                console.log(`[DEBUG] Direktes Layout gefunden: ${subDir} für Strecke ${trackFolder}`);
                layouts.add(subDir);
              }
            } catch (err) {
              console.error(`[DEBUG] Fehler beim Prüfen von ${subDir}: ${err.message}`);
            }
          }
        } catch (err) {
          console.error(`[DEBUG] Fehler beim Lesen der Unterverzeichnisse: ${err.message}`);
          errorCount++;
        }
        
        // Methode 4: Prüfen, ob die Strecke selbst ein Layout ist
        const mainUiTrackPath = path.join(folderPath, 'ui_track.json');
        const mainDataPath = path.join(folderPath, 'data');
        
        if (await fs.pathExists(mainUiTrackPath) || await fs.pathExists(mainDataPath)) {
          console.log(`[DEBUG] Strecke selbst scheint ein Layout zu sein für ${trackFolder}`);
          layouts.add('default');
        }
        
        // Letzte Methode: Pfade mit Zahlen am Ende könnten Layouts sein (z.B. drift1, drift2)
        try {
          const allFiles = await fs.readdir(folderPath);
          const layoutPattern = /^([a-zA-Z]+)(\d+)$/; // z.B. drift1, drift2, etc.
          
          for (const file of allFiles) {
            if (layoutPattern.test(file)) {
              const filePath = path.join(folderPath, file);
              if ((await fs.stat(filePath)).isDirectory() && await isLayoutDirectory(filePath)) {
                console.log(`[DEBUG] Nummeriertes Layout gefunden: ${file} für Strecke ${trackFolder}`);
                layouts.add(file);
              }
            }
          }
        } catch (err) {
          console.error(`[DEBUG] Fehler beim Suchen nach nummerierten Layouts: ${err.message}`);
          errorCount++;
        }
        
        // Fallback: Wenn immer noch keine Layouts gefunden wurden
        if (layouts.size === 0) {
          console.log(`[DEBUG] Keine Layouts gefunden für ${trackFolder}, füge "default" Layout hinzu`);
          layouts.add('default');
        }
        
        // Konvertiere Set zu Array
        const layoutsArray = Array.from(layouts);
        
        console.log(`[DEBUG] Strecke ${trackFolder} hat ${layoutsArray.length} Layouts: ${layoutsArray.join(', ')}`);
        
        // Strecke zur Liste hinzufügen
        tracks.push({
          id: trackFolder,
          name: trackFolder.replace(/_/g, ' '),
          path: folderPath,
          layouts: layoutsArray
        });
        
        processedCount++;
      } catch (error) {
        console.error(`[DEBUG] Fehler bei der Verarbeitung von Strecke ${trackFolder}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`[DEBUG] Strecken-Verarbeitung abgeschlossen: ${processedCount} verarbeitet, ${skippedCount} übersprungen, ${errorCount} Fehler`);
    console.log(`[DEBUG] Insgesamt ${tracks.length} Strecken mit Layouts gefunden`);
    
    return tracks;
  } catch (error) {
    console.error(`[DEBUG] Fehler beim Auslesen der Strecken: ${error.message}`);
    console.error(`[DEBUG] Stack: ${error.stack}`);
    throw error; // Original-Fehler werfen für bessere Diagnose
  }
}

/**
 * @returns {Promise<Object>} - Alle verfügbaren Inhalte (Autos und Strecken)
 */
async function getAllContent(serverPath) {
  try {
    const [cars, tracks] = await Promise.all([
      getCars(serverPath),
      getTracks(serverPath)
    ]);
    
    return {
      cars,
      tracks
    };
  } catch (error) {
    console.error(`[DEBUG] Fehler beim Auslesen aller Inhalte: ${error.message}`);
    console.error(`[DEBUG] Stack: ${error.stack}`);
    throw error; // Original-Fehler werfen für bessere Diagnose
  }
}

module.exports = {
  getCars,
  getTracks,
  getAllContent
}; 