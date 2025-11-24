// routes/upload.routes.js
import express from 'express';
import multer from 'multer';
import { uploadVendorImage } from '../controllers/upload.controller.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// POST /api/upload/vendor-image - Upload vendor image
router.post('/vendor-image', upload.single('image'), uploadVendorImage);

export default router;
