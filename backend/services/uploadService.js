const fs = require('fs-extra');
const path = require('path');
const extract = require('extract-zip');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * Verarbeitet den Upload einer Mod-Datei (Auto oder Strecke)
 * @param {Object} file - Die hochgeladene Datei (multer file-Objekt)
 * @param {String} modType - Typ des Mods ('car' oder 'track')
 * @param {String} serverPath - Pfad zum Serververzeichnis
 * @returns {Promise<Object>} - Ergebnis des Upload-Prozesses
 */
async function processModUpload(file, modType, serverPath) {
  try {
    if (!file) {
      throw new Error('Keine Datei hochgeladen');
    }

    if (!['car', 'track'].includes(modType)) {
      throw new Error('Ungültiger Mod-Typ. Nur "car" oder "track" erlaubt.');
    }

    // Pfad zum Zielverzeichnis bestimmen
    const targetDir = modType === 'car'
      ? path.join(serverPath, 'content', 'cars')
      : path.join(serverPath, 'content', 'tracks');

    // Temporären Extraktionspfad erstellen
    const extractionDir = path.join(serverPath, 'temp_extraction');
    fs.ensureDirSync(extractionDir);

    // Datei entpacken
    try {
      await extract(file.path, { dir: extractionDir });
    } catch (extractError) {
      await fs.remove(extractionDir);
      throw new Error(`Fehler beim Entpacken: ${extractError.message}`);
    }

    // Prüfen, ob es einen Haupt-Ordner in der ZIP gibt
    const extractedItems = await fs.readdir(extractionDir);
    let modDir;

    // Wenn es einen Ordner gibt, verschieben wir diesen
    // Wenn es mehrere Dateien/Ordner gibt, verschieben wir alles
    if (extractedItems.length === 1 && (await fs.stat(path.join(extractionDir, extractedItems[0]))).isDirectory()) {
      modDir = extractedItems[0];
      
      // Überprüfen ob dieser Mod bereits existiert
      if (await fs.pathExists(path.join(targetDir, modDir))) {
        // Existierenden Mod löschen
        await fs.remove(path.join(targetDir, modDir));
      }
      
      // Verzeichnis verschieben
      await fs.move(
        path.join(extractionDir, modDir),
        path.join(targetDir, modDir)
      );
    } else {
      // Wenn keine klare Hauptdatei vorhanden ist, leiten wir den Namen aus der ZIP-Datei ab
      modDir = path.basename(file.originalname, path.extname(file.originalname));
      
      // Zielverzeichnis erstellen
      const finalTargetDir = path.join(targetDir, modDir);
      
      if (await fs.pathExists(finalTargetDir)) {
        await fs.remove(finalTargetDir);
      }
      
      await fs.ensureDir(finalTargetDir);
      
      // Alle Dateien verschieben
      for (const item of extractedItems) {
        await fs.move(
          path.join(extractionDir, item),
          path.join(finalTargetDir, item),
          { overwrite: true }
        );
      }
    }

    // Temporäres Verzeichnis aufräumen
    await fs.remove(extractionDir);
    
    // Hochgeladene Datei löschen
    await fs.remove(file.path);

    return {
      success: true,
      message: `${modType === 'car' ? 'Auto' : 'Strecke'} erfolgreich hochgeladen`,
      modName: modDir
    };
  } catch (error) {
    // Cleanup bei Fehlern
    if (file && file.path) {
      try {
        await fs.remove(file.path);
      } catch (e) {
        console.error('Fehler beim Löschen der temporären Datei:', e);
      }
    }
    
    throw error;
  }
}

module.exports = {
  processModUpload
}; 