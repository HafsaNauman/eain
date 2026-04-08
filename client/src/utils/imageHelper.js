export const getFirstImage = (media, fallback = 'https://via.placeholder.com/150?text=No+Image') => {
  if (!media) return fallback;
  
  let parsedMedia = media;
  // Handle JSON string cases
  if (typeof media === 'string') {
    try {
        parsedMedia = JSON.parse(media);
    } catch (e) {
        if (media.startsWith('http')) return media;
        return fallback;
    }
  }

  // Handle Object case: { images: ['url1', 'url2'] }
  if (parsedMedia && typeof parsedMedia === 'object' && !Array.isArray(parsedMedia)) {
    if (parsedMedia.images && Array.isArray(parsedMedia.images) && parsedMedia.images.length > 0) {
      if (typeof parsedMedia.images[0] === 'string') return parsedMedia.images[0];
      if (typeof parsedMedia.images[0] === 'object' && parsedMedia.images[0].image_url) return parsedMedia.images[0].image_url;
    }
    if (parsedMedia.image_url) return parsedMedia.image_url;
  }

  // Handle Array case: [{ image_url: 'url' }] or ['url']
  if (Array.isArray(parsedMedia) && parsedMedia.length > 0) {
    if (typeof parsedMedia[0] === 'string') return parsedMedia[0];
    if (typeof parsedMedia[0] === 'object' && parsedMedia[0].image_url) return parsedMedia[0].image_url;
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
        if (media.startsWith('http')) return [media];
        return fallback;
    }
  }

  let images = [];
  
  if (parsedMedia && typeof parsedMedia === 'object' && !Array.isArray(parsedMedia)) {
    if (parsedMedia.images && Array.isArray(parsedMedia.images)) {
      images = parsedMedia.images.map(img => typeof img === 'string' ? img : img.image_url).filter(Boolean);
    } else if (parsedMedia.image_url) {
      images = [parsedMedia.image_url];
    }
  }
  
  if (Array.isArray(parsedMedia)) {
     images = parsedMedia.map(img => typeof img === 'string' ? img : img.image_url).filter(Boolean);
  }

  return images.length > 0 ? images : fallback;
};
