import axios from 'axios';
import APICONFIG from './config';

const joinUrl = (base, path) =>
    `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;

export const getForYouFeed = async (userId, query = null, topK = 10) => {
    try {
        const { data } = await axios.post(
            joinUrl(APICONFIG.BASE_URL, APICONFIG.ENDPOINTS.RECOMMEND.FOR_YOU),
            { user_id: userId, query, top_k: topK },
            { timeout: APICONFIG.TIMEOUT || 30000 }
        );
        return { success: true, data };
    } catch (err) {
        return {
            success: false,
            error: err.response?.data?.error || err.message,
        };
    }
};

export const getSimilarItems = async (listingId, topK = 10) => {
    try {
        const { data } = await axios.get(
            joinUrl(APICONFIG.BASE_URL, `${APICONFIG.ENDPOINTS.RECOMMEND.SIMILAR}/${listingId}`),
            {
                params: { top_k: topK },
                timeout: APICONFIG.TIMEOUT || 30000,
            }
        );
        return { success: true, data };
    } catch (err) {
        return {
            success: false,
            error: err.response?.data?.error || err.message,
        };
    }
};

export const voiceRerank = async (transcript, userId = null) => {
    try {
        const { data } = await axios.post(
            joinUrl(APICONFIG.BASE_URL, APICONFIG.ENDPOINTS.RECOMMEND.VOICE_RERANK),
            { user_id: userId, transcript, top_k: 10 },
            { timeout: APICONFIG.TIMEOUT || 30000 }
        );
        return { success: true, data };
    } catch (err) {
        return {
            success: false,
            error: err.response?.data?.error || err.message,
        };
    }
};

export const visualRerank = async (payload) => {
    try {
        const { data } = await axios.post(
            joinUrl(BASE, APICONFIG.ENDPOINTS.RECOMMEND.VISUAL_RERANK),
            payload,
            { timeout: APICONFIG.TIMEOUT || 30000 }
        );
        return { success: true, data };
    } catch (err) {
        return {
            success: false,
            error: err.response?.data?.error || err.message,
        };
    }
};

export const logEvent = async (userId, listingId, eventType) => {
    try {
        await axios.post(
            joinUrl(BASE, APICONFIG.ENDPOINTS.RECOMMEND.LOG_EVENT),
            {
                user_id: userId,
                listing_id: String(listingId),
                event_type: eventType,
            },
            { timeout: APICONFIG.TIMEOUT || 30000 }
        );
    } catch (_) { }
};