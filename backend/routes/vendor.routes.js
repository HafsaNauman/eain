// routes/vendor.routes.js
import express from 'express';
import {
  getProfile,
  createOrUpdateProfile,
  updateProfile,
} from '../controllers/vendor.controller.js';
import { verifyJWT } from '../middlewares/authJwt.js';

const router = express.Router();

// All vendor routes require authentication
router.use(verifyJWT);

// GET /api/vendor/profile - Get vendor profile
router.get('/profile', getProfile);

// POST /api/vendor/profile - Create or upsert vendor profile
router.post('/profile', createOrUpdateProfile);

// PUT /api/vendor/profile - Update vendor profile
router.put('/profile', updateProfile);

export default router;
