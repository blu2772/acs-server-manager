const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { processModUpload } = require('../services/uploadService');

// Konfiguration für multer (File-Upload)
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(req.serverPath, 'uploads');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Originalnamen beibehalten, aber Zeitstempel hinzufügen
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Dateifilter für ZIP-Dateien
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/zip' || path.extname(file.originalname).toLowerCase() === '.zip') {
    cb(null, true);
  } else {
    cb(new Error('Nur ZIP-Dateien sind erlaubt'), false);
  }
};

// Upload-Middleware erstellen
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 500 // 500 MB maximale Dateigröße
  }
});

/**
 * @route POST /api/upload
 * @desc Lädt einen Mod hoch (Auto oder Strecke)
 * @param {string} modType - Typ des Mods (car oder track)
 * @param {file} modFile - Die hochzuladende ZIP-Datei
 */
router.post('/', upload.single('modFile'), async (req, res) => {
  try {
    const { modType } = req.body;
    
    if (!modType) {
      return res.status(400).json({
        success: false,
        message: 'Mod-Typ ist erforderlich'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Keine Datei hochgeladen'
      });
    }
    
    // Mod-Upload verarbeiten
    const result = await processModUpload(req.file, modType, req.serverPath);
    
    res.json({
      success: true,
      message: result.message,
      modName: result.modName
    });
  } catch (error) {
    console.error('Upload-Fehler:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 