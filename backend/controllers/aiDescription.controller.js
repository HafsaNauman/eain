// controllers/aiDescription.controller.js
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/ai/generate-product-description
 * Generate product description from uploaded image using AI microservice
 */
export const generateProductDescription = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return errorResponse(res, 400, 'No image file uploaded');
        }

        console.log(`📤 Sending image to AI service: ${file.originalname}`);

        // Create form data for AI microservice
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), {
            filename: file.originalname,
            contentType: file.mimetype
        });

        // Call FastAPI microservice
        const response = await axios.post(
            `${AI_SERVICE_URL}/generate-product-description-from-image`,
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 30000 // 30 second timeout
            }
        );

        // Clean up temp file
        fs.unlinkSync(file.path);

        if (response.data.success) {
            return successResponse(res, 200, 'Product description generated successfully', {
                ai_description: response.data.data.ai_description,
                image_url: response.data.data.image_url,
                generation_method: response.data.data.generation_method,
                model: response.data.data.model
            });
        } else {
            return errorResponse(res, 500, 'AI service failed to generate description');
        }

    } catch (error) {
        // Clean up temp file if exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error('❌ AI Description Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return errorResponse(res, 503, 'AI service unavailable', 'FastAPI service is not running');
        }

        return errorResponse(res, 500, 'Failed to generate product description', error.message);
    }
};
