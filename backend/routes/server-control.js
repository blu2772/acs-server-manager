const express = require('express');
const router = express.Router();
const { startServer, stopServer, getServerStatus, getServerLogs } = require('../services/serverControlService');
const fs = require('fs-extra');
const path = require('path');

/**
 * @route POST /api/server/start
 * @desc Startet den Assetto Corsa Server
 */
router.post('/start', async (req, res) => {
  console.log('[DEBUG] Start-Server-Route aufgerufen');
  
  try {
    console.log(`[DEBUG] Verwende serverPath: ${req.serverPath}`);
    
    // Prüfe, ob das Serververzeichnis existiert
    if (!await fs.pathExists(req.serverPath)) {
      const errorMsg = `Server-Verzeichnis existiert nicht: ${req.serverPath}`;
      console.error(`[DEBUG] ${errorMsg}`);
      return res.status(500).json({
        success: false,
        message: errorMsg
      });
    }
    
    // Prüfe, ob die Konfigurationsdateien existieren
    const serverCfgPath = path.join(req.serverPath, 'cfg', 'server_cfg.ini');
    if (!await fs.pathExists(serverCfgPath)) {
      const errorMsg = `Serverkonfigurationsdatei nicht gefunden: ${serverCfgPath}`;
      console.error(`[DEBUG] ${errorMsg}`);
      return res.status(500).json({
        success: false,
        message: errorMsg
      });
    }
    
    // Prüfe, ob die erforderlichen Verzeichnisse existieren
    const contentPath = path.join(req.serverPath, 'content');
    if (!await fs.pathExists(contentPath)) {
      const errorMsg = `Content-Verzeichnis existiert nicht: ${contentPath}`;
      console.error(`[DEBUG] ${errorMsg}`);
      return res.status(500).json({
        success: false,
        message: errorMsg
      });
    }
    
    // Versuche den Server zu starten
    const result = await startServer(req.serverPath);
    console.log(`[DEBUG] startServer-Ergebnis: ${JSON.stringify(result)}`);
    res.json(result);
  } catch (error) {
    console.error('[DEBUG] Fehler beim Starten des Servers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route POST /api/server/stop
 * @desc Stoppt den Assetto Corsa Server
 */
router.post('/stop', async (req, res) => {
  console.log('[DEBUG] Stop-Server-Route aufgerufen');
  
  try {
    // Versuche den Server zu stoppen
    const result = await stopServer();
    console.log(`[DEBUG] stopServer-Ergebnis: ${JSON.stringify(result)}`);
    res.json(result);
  } catch (error) {
    console.error('[DEBUG] Fehler beim Stoppen des Servers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/server/status
 * @desc Gibt den aktuellen Status des Servers zurück
 */
router.get('/status', (req, res) => {
  console.log('[DEBUG] Status-Route aufgerufen');
  
  try {
    const result = getServerStatus();
    res.json(result);
  } catch (error) {
    console.error('[DEBUG] Fehler beim Abrufen des Server-Status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/server/logs
 * @desc Gibt die Server-Logs zurück
 * @param {Number} lines - Anzahl der zurückzugebenden Zeilen (optional)
 */
router.get('/logs', (req, res) => {
  console.log('[DEBUG] Logs-Route aufgerufen');
  
  try {
    const lines = parseInt(req.query.lines) || 100;
    const logs = getServerLogs(lines);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('[DEBUG] Fehler beim Abrufen der Server-Logs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/server/restart
 * @desc Startet den Assetto Corsa Server neu
 */
router.post('/restart', async (req, res) => {
  console.log('[DEBUG] Restart-Server-Route aufgerufen');
  
  try {
    // Zuerst Server stoppen
    console.log('[DEBUG] Stoppe Server im Rahmen eines Neustarts');
    const stopResult = await stopServer();
    
    // Kurz warten, um sicherzustellen, dass der Server vollständig gestoppt ist
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Dann Server neu starten
    console.log('[DEBUG] Starte Server nach dem Stoppen neu');
    const startResult = await startServer(req.serverPath);
    
    res.json({
      success: startResult.success,
      message: startResult.success ? 'Server erfolgreich neu gestartet' : 'Fehler beim Neustart des Servers',
      stopResult,
      startResult
    });
  } catch (error) {
    console.error('[DEBUG] Fehler beim Neustarten des Servers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 