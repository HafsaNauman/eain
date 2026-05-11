import API_CONFIG from '../api/config';

const resolveUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/+$/, '');
  const path = url.replace(/^\/+/, '');
  return `${baseUrl}/${path}`;
};

export const getFirstImage = (media, fallback = 'https://via.placeholder.com/150?text=No+Image') => {
  if (!media) return fallback;
  
  let parsedMedia = media;
  // Handle JSON string cases
  if (typeof media === 'string') {
    try {
        parsedMedia = JSON.parse(media);
    } catch (e) {
        if (media.startsWith('http')) return resolveUrl(media);
        return fallback;
    }
  }

  if (parsedMedia && typeof parsedMedia === 'object' && !Array.isArray(parsedMedia)) {
    if (parsedMedia.images && Array.isArray(parsedMedia.images) && parsedMedia.images.length > 0) {
      if (typeof parsedMedia.images[0] === 'string') return resolveUrl(parsedMedia.images[0]) || fallback;
      if (typeof parsedMedia.images[0] === 'object' && parsedMedia.images[0].image_url) return resolveUrl(parsedMedia.images[0].image_url) || fallback;
    }
    if (parsedMedia.image_url) return resolveUrl(parsedMedia.image_url) || fallback;
  }

  if (Array.isArray(parsedMedia) && parsedMedia.length > 0) {
    if (typeof parsedMedia[0] === 'string') return resolveUrl(parsedMedia[0]) || fallback;
    if (typeof parsedMedia[0] === 'object' && parsedMedia[0].image_url) return resolveUrl(parsedMedia[0].image_url) || fallback;
  }

  return fallback;
};

export const getAllImages = (media, fallback = ['https://via.placeholder.com/400?text=No+Image']) => {
  if (!media) return fallback;
  
  let parsedMedia = media;
  if (typeof media === 'string') {
    try {
        parsedMedia = JSON.parse(media);
    } catch (e) {
        if (media.startsWith('http')) return [resolveUrl(media)];
        return fallback;
    }
  }

  let images = [];
  
  if (parsedMedia && typeof parsedMedia === 'object' && !Array.isArray(parsedMedia)) {
    if (parsedMedia.images && Array.isArray(parsedMedia.images)) {
      images = parsedMedia.images.map(img => typeof img === 'string' ? resolveUrl(img) : resolveUrl(img.image_url)).filter(Boolean);
    } else if (parsedMedia.image_url) {
      images = [resolveUrl(parsedMedia.image_url)].filter(Boolean);
    }
  }
  
  if (Array.isArray(parsedMedia)) {
     images = parsedMedia.map(img => typeof img === 'string' ? resolveUrl(img) : resolveUrl(img.image_url)).filter(Boolean);
  }

  return images.length > 0 ? images : fallback;
};
