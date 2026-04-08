import { Listing, VendorProfile, User } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';
import { Op } from 'sequelize';

/**
 * GET /api/catalog/listings
 * Browse all active listings with search and pagination
 * Query params: q (search), city (filter), limit, offset
 */
export const getAllListings = async (req, res) => {
    try {
        const { q, city, listing_type, limit = 20, offset = 0 } = req.query;

        // Check user gender
        const isFemale = req.userGender && req.userGender.toLowerCase() === 'female';

        // Build where clause for Listing
        const listingWhere = {
            is_active: true
        };

        // If not female, can only see non-female-only items
        if (!isFemale) {
            listingWhere.is_female_only = false;
        }

        // Search in title, category, tags
        if (q) {
            listingWhere[Op.or] = [
                { title_en: { [Op.iLike]: `%${q}%` } },
                { title_ur: { [Op.iLike]: `%${q}%` } },
                { category: { [Op.iLike]: `%${q}%` } },
                { tags: { [Op.contains]: [q] } }, // For JSONB arrays
            ];
        }

        // Build where clause for VendorProfile (related model)
        const vendorWhere = {
            is_active: true // Only show listings from active vendors
        };

        if (city) {
            vendorWhere.city = { [Op.iLike]: `%${city}%` };
        }

        // Filter by listing_type: 'service' → only service vendors; 'product' or omitted → product vendors
        if (listing_type === 'service') {
            vendorWhere.vendor_type = { [Op.in]: ['service', 'both'] };
        } else if (!listing_type || listing_type === 'product') {
            vendorWhere.vendor_type = { [Op.in]: ['product', 'both'] };
        }

        const maxLimit = Math.min(parseInt(limit) || 20, 100);
        const skip = parseInt(offset) || 0;

        // Find listings with vendor association
        const { count, rows } = await Listing.findAndCountAll({
            where: listingWhere,
            include: [
                {
                    association: 'Vendor', // Use the alias we defined in models/index.js
                    model: VendorProfile,
                    where: vendorWhere,
                    attributes: ['vendor_id', 'business_name_en', 'business_name_ur', 'city', 'area', 'vendor_type', 'media'], // Select specific fields
                    required: true // INNER JOIN - only listings with active vendors

                },
            ],
            limit: maxLimit,
            offset: skip,
            order: [['created_at', 'DESC']],
            subQuery: false, // Prevent Sequelize from creating invalid subqueries
        });

        const hasMore = skip + maxLimit < count;

        return successResponse(res, 200, 'Listings retrieved successfully', {
            total: count,
            listings: rows,
            pagination: {
                limit: maxLimit,
                offset: skip,
                hasMore,
            },
        });
    } catch (error) {
        console.error('Get All Listings Error:', error);
        return errorResponse(res, 500, 'Failed to retrieve listings', error.message);
    }
};

/**
 * GET /api/catalog/listings/:listing_id
 * Get full details for a single listing
 */
export const getListingDetails = async (req, res) => {
    try {
        const { listing_id } = req.params;

        const listing = await Listing.findOne({
            where: {
                listing_id,
                is_active: true, // Only show active listings
            },
            include: [
                {
                    association: 'Vendor',
                    model: VendorProfile,
                    where: { is_active: true }, // Only from active vendors
                    attributes: [
                        'vendor_id',
                        'business_name_en',
                        'business_name_ur',
                        'vendor_type',
                        'description_en',
                        'description_ur',
                        'category',
                        'city',
                        'area',
                        'is_female_only',
                        'media',
                    ],
                    required: true,
                },
            ],
        });

        if (!listing) {
            return errorResponse(res, 404, 'Listing not found or is inactive');
        }

        // Check access for female-only items
        if (listing.is_female_only) {
            const isFemale = req.userGender && req.userGender.toLowerCase() === 'female';
            if (!isFemale) {
                return errorResponse(res, 403, 'Access denied. This listing is for female customers only.');
            }
        }

        return successResponse(res, 200, 'Listing details retrieved', {
            listing,
        });
    } catch (error) {
        console.error('Get Listing Details Error:', error);
        return errorResponse(res, 500, 'Failed to retrieve listing details', error.message);
    }
};

/**
 * GET /api/catalog/vendors/:vendor_id/listings
 * Get all active listings for a specific vendor (public view)
 */
export const getVendorListingsPublic = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        // Check if vendor exists and is active
        const vendor = await VendorProfile.findOne({
            where: {
                vendor_id,
                is_active: true,
            },
            attributes: [
                'vendor_id',
                'business_name_en',
                'business_name_ur',
                'city',
                'area',
                'vendor_type',
            ],
        });

        if (!vendor) {
            return errorResponse(res, 404, 'Vendor not found or is inactive');
        }

        const maxLimit = Math.min(parseInt(limit) || 20, 100);
        const skip = parseInt(offset) || 0;

        const isFemale = req.userGender && req.userGender.toLowerCase() === 'female';
        const listingWhere = {
            vendor_id,
            is_active: true, // Only active listings
        };

        if (!isFemale) {
            listingWhere.is_female_only = false;
        }

        const { count, rows } = await Listing.findAndCountAll({
            where: listingWhere,
            limit: maxLimit,
            offset: skip,
            order: [['created_at', 'DESC']],
            attributes: [
                'listing_id',
                'listing_type',
                'title_en',
                'title_ur',
                'price',
                'currency',
                'category',
                'media',
            ],
        });

        const hasMore = skip + maxLimit < count;

        return successResponse(res, 200, 'Vendor listings retrieved successfully', {
            vendor,
            total: count,
            listings: rows,
            pagination: {
                limit: maxLimit,
                offset: skip,
                hasMore,
            },
        });
    } catch (error) {
        console.error('Get Vendor Listings Public Error:', error);
        return errorResponse(res, 500, 'Failed to retrieve vendor listings', error.message);
    }
};

/**
 * GET /api/catalog/search
 * Advanced search with multiple filters
 * Query params: q, category, city, vendor_type, is_female_only, sort, limit, offset
 */
export const searchListings = async (req, res) => {
    try {
        const {
            q,
            category,
            city,
            vendor_type,
            is_female_only,
            sort = 'created_at',
            limit = 20,
            offset = 0,
        } = req.query;

        // Check user gender
        const isFemale = req.userGender && req.userGender.toLowerCase() === 'female';

        // Build listing filters
        const listingWhere = { is_active: true };

        if (!isFemale) {
            // Male/Guest can ONLY see non-female-only items
            listingWhere.is_female_only = false;
        } else {
            // Female user can filter if they want
            if (is_female_only === 'true') {
                listingWhere.is_female_only = true;
            }
        }

        if (category) {
            listingWhere.category = category;
        }

        if (q) {
            listingWhere[Op.or] = [
                { title_en: { [Op.iLike]: `%${q}%` } },
                { title_ur: { [Op.iLike]: `%${q}%` } },
                { category: { [Op.iLike]: `%${q}%` } },
            ];
        }

        // Build vendor filters
        const vendorWhere = { is_active: true };
        if (city) {
            vendorWhere.city = { [Op.iLike]: `%${city}%` };
        }
        if (vendor_type) {
            vendorWhere.vendor_type = vendor_type;
        }

        // Build order clause
        let orderClause = [['created_at', 'DESC']];
        if (sort === 'price_asc') {
            orderClause = [['price', 'ASC']];
        } else if (sort === 'price_desc') {
            orderClause = [['price', 'DESC']];
        }

        const maxLimit = Math.min(parseInt(limit) || 20, 100);
        const skip = parseInt(offset) || 0;

        const { count, rows } = await Listing.findAndCountAll({
            where: listingWhere,
            include: [
                {
                    association: 'Vendor',
                    model: VendorProfile,
                    where: vendorWhere,
                    attributes: [
                        'vendor_id',
                        'business_name_en',
                        'business_name_ur',
                        'city',
                        'vendor_type',
                    ],
                    required: true,
                },
            ],
            limit: maxLimit,
            offset: skip,
            order: orderClause,
            subQuery: false,
        });

        const hasMore = skip + maxLimit < count;

        return successResponse(res, 200, 'Search results retrieved successfully', {
            total: count,
            listings: rows,
            pagination: {
                limit: maxLimit,
                offset: skip,
                hasMore,
            },
        });
    } catch (error) {
        console.error('Search Listings Error:', error);
        return errorResponse(res, 500, 'Failed to search listings', error.message);
    }
};