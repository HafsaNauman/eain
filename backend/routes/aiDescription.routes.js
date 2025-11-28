// routes/aiDescription.routes.js
import express from 'express';
import multer from 'multer';
import {
    generateProductDescription,
    updateListingWithAI
} from '../controllers/aiDescription.controller.js';

const router = express.Router();

// Configure multer for temporary file storage
const upload = multer({
    dest: 'uploads/temp/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'));
        }
    }
});

/**
 * @route   POST /api/ai/generate-product-description
 * @desc    Generate AI product description from image (optionally save to DB)
 * @access  Private (add auth middleware if needed)
 * @body    vendor_id (optional), save_to_db (optional, 'true'/'false')
 */
router.post(
    '/generate-product-description',
    upload.single('image'),
    generateProductDescription
);

/**
 * @route   PUT /api/ai/update-listing-with-ai/:listing_id
 * @desc    Update existing listing with AI-generated description
 * @access  Private
 */
router.put(
    '/update-listing-with-ai/:listing_id',
    upload.single('image'),
    updateListingWithAI
);

export default router;
