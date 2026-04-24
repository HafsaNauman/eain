const API_CONFIG = {
  BASE_URL: "https://5097-59-103-88-155.ngrok-free.app",
  //BASE_URL: "https://localhost:3000",
  TIMEOUT: 30000,

  ENDPOINTS: {
    AUTH: {
      SEND_OTP: '/api/auth/send-otp',
      VERIFY_OTP: '/api/auth/verify-otp',
      SIGNUP: '/api/auth/signup',
      LOGIN: '/api/auth/login',
    },
    VENDOR: {
      PROFILE: '/api/vendor/profile',
      LISTINGS: '/api/vendor/listings',
    },
    CATALOG: {
      LISTINGS: '/api/catalog/listings',
      LISTING_DETAILS: '/api/catalog/listings/:listing_id',
      SEARCH: '/api/catalog/search',
      VENDOR_LISTINGS: '/api/catalog/vendors/:vendor_id/listings',
    },
    STT: {
      TRANSCRIBE: '/api/stt/transcribe',
      HEALTH: '/api/stt/health',
    },
    ORDERS: {
      PLACE_ORDER: '/api/orders',
      MY_ORDERS: '/api/orders/my',
      ORDER_DETAILS: '/api/orders/:order_id',
    },
    AI: {
      GENERATE_PRODUCT_DESCRIPTION: '/api/ai/generate-product-description',
      UPDATE_LISTING_WITH_AI: '/api/ai/update-listing-with-ai/:listing_id',
    },
  },
};

export default API_CONFIG;
