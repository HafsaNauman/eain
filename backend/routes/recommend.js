// backend/routes/recommend.js
import express from 'express';
import axios from 'axios';
import { Op } from 'sequelize';
import { Listing } from '../models/index.js';

const router = express.Router();

const REC_URL = process.env.RECOMMENDER_URL || 'http://localhost:8001';
const REC_TIMEOUT = 35_000;   // 35 s for real inference calls
const PROBE_TIMEOUT = 8_000;  // 8 s to detect ECONNREFUSED quickly

// ─────────────────────────────────────────────────────────────────────────────
// DB fallbacks — used whenever the Python recommender is unreachable
// ─────────────────────────────────────────────────────────────────────────────

/** Category-diverse "For You" from the real catalogue. */
async function dbForYou(topK = 10) {
    const rows = await Listing.findAll({
        where: { is_active: true, listing_type: 'product' },
        attributes: ['listing_id', 'title_en', 'category', 'price', 'currency', 'popularity_count'],
        order: [['popularity_count', 'DESC'], ['created_at', 'DESC']],
        limit: topK * 4,
    });

    // Round-robin across categories so result is visually diverse
    const byCategory = {};
    for (const item of rows) {
        const cat = item.category || 'Other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(item);
    }

    const results = [];
    const cats = Object.keys(byCategory);
    let round = 0;
    outer: while (results.length < topK) {
        let added = false;
        for (const cat of cats) {
            if (byCategory[cat][round]) {
                results.push(byCategory[cat][round]);
                added = true;
                if (results.length >= topK) break outer;
            }
        }
        if (!added) break;
        round++;
    }

    return {
        status: 'ok',
        method: 'category_diverse_popularity',
        results: results.map((item, i) => ({
            rank: i + 1,
            item_id: String(item.listing_id),
            score: parseFloat(item.popularity_count || 0) / 100,
            title: item.title_en,
            category: item.category || '',
            price: parseFloat(item.price || 0),
            currency: item.currency || 'PKR',
        })),
    };
}

/** Same-category similar items from the real catalogue. */
async function dbSimilar(listingId, topK = 8) {
    const source = await Listing.findByPk(listingId, {
        attributes: ['category', 'listing_type'],
    });
    if (!source) return null;

    const baseWhere = {
        is_active: true,
        listing_type: source.listing_type || 'product',
        listing_id: { [Op.ne]: parseInt(listingId, 10) },
    };

    let rows = [];
    if (source.category) {
        rows = await Listing.findAll({
            where: { ...baseWhere, category: source.category },
            order: [['popularity_count', 'DESC'], ['created_at', 'DESC']],
            limit: topK,
        });
    }

    if (rows.length < topK) {
        const exclude = [parseInt(listingId, 10), ...rows.map(r => r.listing_id)];
        const more = await Listing.findAll({
            where: { ...baseWhere, listing_id: { [Op.notIn]: exclude } },
            order: [['popularity_count', 'DESC']],
            limit: topK - rows.length,
        });
        rows.push(...more);
    }

    return {
        status: 'ok',
        method: 'same_category_popularity',
        results: rows.map((item, i) => ({
            rank: i + 1,
            item_id: String(item.listing_id),
            score: parseFloat(item.popularity_count || 0) / 100,
            title: item.title_en,
            category: item.category || '',
            price: parseFloat(item.price || 0),
            currency: item.currency || 'PKR',
        })),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/recommend/for-you
router.post('/for-you', async (req, res) => {
    try {
        const { user_id, query, exclude_ids, top_k = 10 } = req.body;
        try {
            const { data } = await axios.post(
                `${REC_URL}/recommend/for-you`,
                { user_id, query, exclude_ids, top_k },
                { timeout: REC_TIMEOUT }
            );
            return res.json(data);
        } catch (_recErr) {
            console.log('[recommend] Python service unavailable — DB fallback /for-you');
            const data = await dbForYou(top_k);
            return res.json(data);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/recommend/similar/:listing_id
router.get('/similar/:listing_id', async (req, res) => {
    try {
        const { listing_id } = req.params;
        const topK = parseInt(req.query.top_k || '8', 10);
        try {
            const { data } = await axios.get(
                `${REC_URL}/recommend/similar/${listing_id}`,
                { params: { top_k: topK }, timeout: REC_TIMEOUT }
            );
            return res.json(data);
        } catch (_recErr) {
            console.log('[recommend] Python service unavailable — DB fallback /similar');
            const data = await dbSimilar(listing_id, topK);
            if (!data) return res.status(404).json({ error: 'listing not found' });
            return res.json(data);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/recommend/voice-rerank
router.post('/voice-rerank', async (req, res) => {
    try {
        try {
            const { data } = await axios.post(
                `${REC_URL}/recommend/voice-rerank`,
                req.body,
                { timeout: REC_TIMEOUT }
            );
            return res.json(data);
        } catch (_recErr) {
            console.log('[recommend] Python service unavailable — DB fallback /voice-rerank');
            const data = await dbForYou(req.body.top_k || 10);
            return res.json(data);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/recommend/visual-rerank
router.post('/visual-rerank', async (req, res) => {
    try {
        try {
            const { data } = await axios.post(
                `${REC_URL}/recommend/visual-rerank`,
                req.body,
                { timeout: REC_TIMEOUT }
            );
            return res.json(data);
        } catch (_recErr) {
            console.log('[recommend] Python service unavailable — DB fallback /visual-rerank');
            const data = await dbForYou(req.body.top_k || 10);
            return res.json(data);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/recommend/events  (fire-and-forget)
router.post('/events', async (req, res) => {
    try {
        try {
            const { data } = await axios.post(
                `${REC_URL}/events/log`,
                req.body,
                { timeout: PROBE_TIMEOUT }
            );
            return res.json(data);
        } catch (_) {
            return res.json({ status: 'logged_locally' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
