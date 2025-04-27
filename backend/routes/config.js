const express = require('express');
const router = express.Router();
const { getServerConfig, updateServerConfig, getEntryList, updateEntryList } = require('../services/configService');

/**
 * @route GET /api/config/server
 * @desc Gibt die Server-Konfiguration zurück
 */
router.get('/server', async (req, res) => {
  try {
    const config = await getServerConfig(req.serverPath);
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Server-Konfiguration:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route PUT /api/config/server
 * @desc Aktualisiert die Server-Konfiguration
 * @param {Object} config - Die neue Server-Konfiguration
 */
router.put('/server', async (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Konfiguration ist erforderlich'
      });
    }
    
    const updatedConfig = await updateServerConfig(config, req.serverPath);
    
    res.json({
      success: true,
      message: 'Server-Konfiguration erfolgreich aktualisiert',
      config: updatedConfig
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Server-Konfiguration:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/config/entrylist
 * @desc Gibt die Entry-List zurück
 */
router.get('/entrylist', async (req, res) => {
  try {
    const entryList = await getEntryList(req.serverPath);
    res.json({
      success: true,
      entryList
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Entry-List:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route PUT /api/config/entrylist
 * @desc Aktualisiert die Entry-List
 * @param {Array} entries - Die neuen Einträge für die Entry-List
 */
router.put('/entrylist', async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        message: 'Gültige Einträge sind erforderlich'
      });
    }
    
    const updatedEntryList = await updateEntryList(entries, req.serverPath);
    
    res.json({
      success: true,
      message: 'Entry-List erfolgreich aktualisiert',
      entryList: updatedEntryList
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Entry-List:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route PUT /api/config/quick-setup
 * @desc Schnelle Konfiguration von Strecke und erlaubten Autos
 * @param {String} track - ID der Strecke
 * @param {String} layout - Gewähltes Layout der Strecke
 * @param {Array} cars - Array von Auto-IDs
 */
router.put('/quick-setup', async (req, res) => {
  try {
    const { track, layout, cars } = req.body;
    
    if (!track || !cars || !Array.isArray(cars)) {
      return res.status(400).json({
        success: false,
        message: 'Strecke und Autos sind erforderlich'
      });
    }
    
    // Server-Konfiguration abrufen
    const config = await getServerConfig(req.serverPath);
    
    // Strecke und Autos aktualisieren
    config.SERVER.TRACK = track;
    config.SERVER.CONFIG_TRACK = layout || '';
    config.SERVER.CARS = cars.join(';');
    
    // Konfiguration speichern
    await updateServerConfig(config, req.serverPath);
    
    // Entry-List erstellen
    const entries = cars.map((carId, index) => ({
      model: carId,
      skin: '',
      driverName: `Driver ${index + 1}`
    }));
    
    await updateEntryList(entries, req.serverPath);
    
    res.json({
      success: true,
      message: 'Konfiguration erfolgreich aktualisiert',
      config,
      entryList: entries
    });
  } catch (error) {
    console.error('Fehler bei der schnellen Konfiguration:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 