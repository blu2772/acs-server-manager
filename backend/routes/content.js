const express = require('express');
const router = express.Router();
const { getAllContent, getCars, getTracks } = require('../services/contentService');
const fs = require('fs');
const path = require('path');

/**
 * @route GET /api/content
 * @desc Gibt alle verfügbaren Inhalte (Autos und Strecken) zurück
 */
router.get('/', async (req, res) => {
  try {
    const content = await getAllContent(req.serverPath);
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Fehler beim Auslesen der Inhalte:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/content/cars
 * @desc Gibt alle verfügbaren Autos zurück
 */
router.get('/cars', async (req, res) => {
  try {
    const cars = await getCars(req.serverPath);
    res.json({
      success: true,
      cars
    });
  } catch (error) {
    console.error('Fehler beim Auslesen der Autos:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/content/tracks
 * @desc Gibt alle verfügbaren Strecken zurück
 */
router.get('/tracks', async (req, res) => {
  try {
    console.log('[DEBUG] Strecken werden abgerufen von:', req.serverPath);
    
    // Prüfen, ob der Pfad existiert
    if (!await fs.pathExists(req.serverPath)) {
      console.error(`[DEBUG] Server-Pfad existiert nicht: ${req.serverPath}`);
      return res.status(500).json({
        success: false,
        message: `Server-Pfad existiert nicht: ${req.serverPath}`
      });
    }
    
    // Prüfen, ob das Tracks-Verzeichnis existiert
    const tracksPath = path.join(req.serverPath, 'content', 'tracks');
    if (!await fs.pathExists(tracksPath)) {
      console.error(`[DEBUG] Tracks-Verzeichnis existiert nicht: ${tracksPath}`);
      return res.status(500).json({
        success: false,
        message: `Tracks-Verzeichnis existiert nicht: ${tracksPath}`
      });
    }
    
    const tracks = await getTracks(req.serverPath);
    
    // Detaillierte Informationen über gefundene Strecken ausgeben
    console.log(`[DEBUG] ${tracks.length} Strecken gefunden`);
    tracks.forEach(track => {
      console.log(`[DEBUG] Strecke: ${track.id}, Layouts: ${track.layouts.join(', ')}`);
    });
    
    res.json({
      success: true,
      tracks
    });
  } catch (error) {
    console.error('[DEBUG] Fehler beim Auslesen der Strecken:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 