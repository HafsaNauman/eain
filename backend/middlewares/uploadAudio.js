// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import sttConfig from '../config/stt.config.js';
// import { errorResponse } from '../utils/responseBuilder.js';

// // Create uploads directory if it doesn't exist
// const uploadDir = sttConfig.uploadDir;
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // File filter
// const fileFilter = (req, file, cb) => {
//   console.log('Received file mimetype:', file.mimetype, 'filename:', file.originalname);
//   if (sttConfig.allowedFormats.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`Invalid file type. Allowed: ${sttConfig.allowedFormats.join(', ')}`), false);
//   }
// };

// // Multer configuration
// export const uploadAudio = multer({
//   storage: storage,
//   limits: {
//     fileSize: sttConfig.maxFileSize
//   },
//   fileFilter: fileFilter
// }).single('audio'); // 'audio' is the field name from frontend

// // Error handling middleware for multer
// export const handleUploadError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return errorResponse(res, 400, 'File too large. Max size: 50MB');
//     }
//     return errorResponse(res, 400, `Upload error: ${err.message}`);
//   } else if (err) {
//     return errorResponse(res, 400, err.message);
//   }
//   next();
// };
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

// Enhanced file filter - check both mimetype AND file extension
const fileFilter = (req, file, cb) => {
  console.log('📁 Received file:');
  console.log('   - Mimetype:', file.mimetype);
  console.log('   - Filename:', file.originalname);
  console.log('   - Extension:', path.extname(file.originalname));
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.wav', '.mp3', '.webm', '.ogg', '.m4a'];
  const allowedMimetypes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/x-pn-wav',
    'audio/vnd.wave',
    'audio/mpeg',
    'audio/mp3',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'application/octet-stream'  // ← Some clients send this for WAV
  ];
  
  // Check if either mimetype OR extension is valid
  const isMimetypeValid = allowedMimetypes.includes(file.mimetype);
  const isExtensionValid = allowedExtensions.includes(fileExtension);
  
  if (isMimetypeValid || isExtensionValid) {
    console.log('✅ File accepted');
    cb(null, true);
  } else {
    console.log('❌ File rejected');
    cb(new Error(`Invalid file type. Please upload: WAV, MP3, WebM, or OGG files`), false);
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
