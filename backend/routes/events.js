import express from 'express';
import RecommendationEvent from '../models/recommendationEvent.js';
import { Listing } from '../models/index.js';

const router = express.Router();

// POST /api/events/log
// Body: { user_id?, session_token?, listing_id, event_type, source?, query_text?, position? }
router.post('/log', async (req, res) => {
  try {
    const {
      user_id,
      session_token,
      listing_id,
      event_type,
      source,
      query_text,
      position,
      metadata,
    } = req.body;

    if (!event_type) {
      return res.status(400).json({ error: 'event_type is required' });
    }

    if (!user_id && !session_token) {
      return res.status(400).json({ error: 'Either user_id or session_token is required' });
    }

    const event = await RecommendationEvent.create({
      user_id: user_id || null,
      session_token: session_token || null,
      listing_id: listing_id || null,
      event_type,
      source: source || null,
      query_text: query_text || null,
      position: position || null,
      metadata: metadata || null,
    });

    // Increment popularity_count on the listing for click/order/booking/save
    if (listing_id && ['click', 'order', 'booking', 'save'].includes(event_type)) {
      await Listing.increment('popularity_count', {
        where: { listing_id }
      });
    }

    return res.status(201).json({ success: true, event_id: event.event_id });
  } catch (err) {
    console.error('Event log error:', err);
    return res.status(500).json({ error: 'Failed to log event' });
  }
});

export default router;
