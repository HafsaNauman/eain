// controllers/aiDescription.controller.js
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';
import { Listing } from '../models/index.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://walrus-app-w43ss.ondigitalocean.app/eain-ai-descriptions';

/**
 * POST /api/ai/generate-product-description
 * Generate product description from uploaded image using AI microservice
 * and optionally save to database
 */
export const generateProductDescription = async (req, res) => {
    try {
        const file = req.file;
        const { vendor_id, save_to_db } = req.body; // Optional: pass vendor_id to create listing

        if (!file) {
            return errorResponse(res, 400, 'No image file uploaded');
        }

        console.log(`📤 Sending image to AI service: ${file.originalname}`);

        const fileStat = fs.statSync(file.path);
        // Create form data for AI microservice
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), {
            filename: file.originalname || 'image.png',
            contentType: file.mimetype || 'image/png',
            knownLength: fileStat.size
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

        if (!response.data.success) {
            return errorResponse(res, 500, 'AI service failed to generate description');
        }

        const aiData = response.data.data;

        // If vendor_id is provided and save_to_db flag is true, save to database
        let listingRecord = null;
        if (vendor_id && save_to_db === 'true') {
            try {
                listingRecord = await Listing.create({
                    vendor_id: parseInt(vendor_id),
                    listing_type: 'product',
                    title_en: aiData.ai_description.title,
                    description_en: aiData.ai_description.description,
                    tags: aiData.ai_description.keywords, // Array of keywords
                    media: {
                        images: [aiData.image_url], // Store AI service image URL
                        videos: []
                    },
                    ai_metadata: {
                        // Store complete AI response for reference
                        title: aiData.ai_description.title,
                        description: aiData.ai_description.description,
                        features: aiData.ai_description.features,
                        keywords: aiData.ai_description.keywords,
                        generation_method: aiData.generation_method,
                        model: aiData.model,
                        generated_at: new Date().toISOString(),
                        image_url: aiData.image_url
                    },
                    is_active: false // Draft mode - vendor needs to review/publish
                });

                console.log(`✅ Listing created with ID: ${listingRecord.listing_id}`);
            } catch (dbError) {
                console.error('❌ Database Error:', dbError);
                // Don't fail the request - still return AI data
                return successResponse(res, 200, 'Product description generated successfully, but failed to save to database', {
                    ai_description: aiData.ai_description,
                    image_url: aiData.image_url,
                    generation_method: aiData.generation_method,
                    model: aiData.model,
                    db_error: dbError.message
                });
            }
        }

        return successResponse(res, 200, 'Product description generated successfully', {
            ai_description: aiData.ai_description,
            image_url: aiData.image_url,
            generation_method: aiData.generation_method,
            model: aiData.model,
            listing_id: listingRecord ? listingRecord.listing_id : null,
            saved_to_db: !!listingRecord
        });

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

/**
 * PUT /api/ai/update-listing-with-ai/:listing_id
 * Update existing listing with AI-generated description
 */
export const updateListingWithAI = async (req, res) => {
    try {
        const { listing_id } = req.params;
        const file = req.file;

        if (!file) {
            return errorResponse(res, 400, 'No image file uploaded');
        }

        // Check if listing exists
        const listing = await Listing.findByPk(listing_id);
        if (!listing) {
            fs.unlinkSync(file.path);
            return errorResponse(res, 404, 'Listing not found');
        }

        console.log(`📤 Sending image to AI service for listing ${listing_id}`);

        const fileStat = fs.statSync(file.path);
        // Create form data for AI microservice
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), {
            filename: file.originalname || 'image.png',
            contentType: file.mimetype || 'image/png',
            knownLength: fileStat.size
        });

        // Call FastAPI microservice
        const response = await axios.post(
            `${AI_SERVICE_URL}/generate-product-description-from-image`,
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 30000
            }
        );

        fs.unlinkSync(file.path);

        if (!response.data.success) {
            return errorResponse(res, 500, 'AI service failed to generate description');
        }

        const aiData = response.data.data;

        // Update listing with AI-generated content
        await listing.update({
            title_en: aiData.ai_description.title,
            description_en: aiData.ai_description.description,
            tags: aiData.ai_description.keywords,
            media: {
                ...listing.media,
                images: [
                    ...(listing.media?.images || []),
                    aiData.image_url
                ]
            },
            ai_metadata: {
                ...listing.ai_metadata,
                latest_generation: {
                    title: aiData.ai_description.title,
                    description: aiData.ai_description.description,
                    features: aiData.ai_description.features,
                    keywords: aiData.ai_description.keywords,
                    generation_method: aiData.generation_method,
                    model: aiData.model,
                    generated_at: new Date().toISOString(),
                    image_url: aiData.image_url
                }
            }
        });

        return successResponse(res, 200, 'Listing updated with AI description', {
            listing_id: listing.listing_id,
            ai_description: aiData.ai_description,
            image_url: aiData.image_url
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error('❌ Update Listing Error:', error.message);
        return errorResponse(res, 500, 'Failed to update listing with AI description', error.message);
    }
};
