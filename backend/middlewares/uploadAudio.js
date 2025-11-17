import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sttConfig from '../config/stt.config.js';
import { errorResponse } from '../utils/responseBuilder.js';

// Create uploads directory if it doesn't exist
const uploadDir = sttConfig.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (sttConfig.allowedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${sttConfig.allowedFormats.join(', ')}`), false);
  }
};

// Multer configuration
export const uploadAudio = multer({
  storage: storage,
  limits: {
    fileSize: sttConfig.maxFileSize
  },
  fileFilter: fileFilter
}).single('audio'); // 'audio' is the field name from frontend

// Error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 400, 'File too large. Max size: 50MB');
    }
    return errorResponse(res, 400, `Upload error: ${err.message}`);
  } else if (err) {
    return errorResponse(res, 400, err.message);
  }
  next();
};
