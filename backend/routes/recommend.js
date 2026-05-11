// backend/routes/recommend.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

const REC_URL = process.env.RECOMMENDER_URL || 'http://localhost:8001';

// POST /api/recommend/for-you
router.post('/for-you', async (req, res) => {
    try {
        console.log('HIT /api/recommend/for-you', req.body);
        const { user_id, query, exclude_ids, top_k } = req.body;
        const { data } = await axios.post(`${REC_URL}/recommend/for-you`, {
            user_id, query, exclude_ids, top_k
        });
        res.json(data);
    } catch (err) {
        res.status(err.response?.status || 500).json({ error: err.message });
    }
});

// GET /api/recommend/similar/:listing_id
router.get('/similar/:listing_id', async (req, res) => {
    try {
        const { data } = await axios.get(
            `${REC_URL}/recommend/similar/${req.params.listing_id}`,
            { params: { top_k: req.query.top_k || 10 } }
        );
        res.json(data);
    } catch (err) {
        res.status(err.response?.status || 500).json({ error: err.message });
    }
});

// POST /api/recommend/voice-rerank
router.post('/voice-rerank', async (req, res) => {
    try {
        const { data } = await axios.post(`${REC_URL}/recommend/voice-rerank`, req.body);
        res.json(data);
    } catch (err) {
        res.status(err.response?.status || 500).json({ error: err.message });
    }
});

// POST /api/recommend/visual-rerank
router.post('/visual-rerank', async (req, res) => {
    try {
        const { data } = await axios.post(`${REC_URL}/recommend/visual-rerank`, req.body);
        res.json(data);
    } catch (err) {
        res.status(err.response?.status || 500).json({ error: err.message });
    }
});

// POST /api/events/log
router.post('/events', async (req, res) => {
    try {
        const { data } = await axios.post(`${REC_URL}/events/log`, req.body);
        res.json(data);
    } catch (err) {
        res.status(err.response?.status || 500).json({ error: err.message });
    }
});

export default router;