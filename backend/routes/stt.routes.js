import express from 'express';
import { transcribeAudio, checkSTTHealth } from '../controllers/stt.controller.js';
import { uploadAudio, handleUploadError } from '../middlewares/uploadAudio.js';
import { verifyJWTOptional } from '../middlewares/authJwt.js';  // ← Changed

const router = express.Router();

/**
 * STT Routes
 */

// Health check (public)
router.get('/health', checkSTTHealth);

// Transcribe audio (public - no authentication required)
router.post(
  '/transcribe',
  verifyJWTOptional,     
  uploadAudio,
  handleUploadError,
  transcribeAudio
);

export default router;
