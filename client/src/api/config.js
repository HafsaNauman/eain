// const API_CONFIG = {
//   BASE_URL: "https://mightiest-unextolled-valeri.ngrok-free.dev",
//   //BASE_URL: "https://localhost:3000",
//   TIMEOUT: 30000,

//   ENDPOINTS: {
//     AUTH: {
//       SEND_OTP: '/api/auth/send-otp',
//       VERIFY_OTP: '/api/auth/verify-otp',
//       SIGNUP: '/api/auth/signup',
//       LOGIN: '/api/auth/login',
//       LOGOUT: '/api/auth/logout',
//     },
//     VENDOR: {
//       PROFILE: '/api/vendor/profile',
//       LISTINGS: '/api/vendor/listings',
//     },
//     CATALOG: {
//       LISTINGS: '/api/catalog/listings',
//       LISTING_DETAILS: '/api/catalog/listings/:listing_id',
//       SEARCH: '/api/catalog/search',
//       VENDOR_LISTINGS: '/api/catalog/vendors/:vendor_id/listings',
//     },
//     STT: {
//       TRANSCRIBE: '/api/stt/transcribe',
//       HEALTH: '/api/stt/health',
//     },
//     ORDERS: {
//       PLACE_ORDER: '/api/orders',
//       MY_ORDERS: '/api/orders/my',
//       ORDER_DETAILS: '/api/orders/:order_id',
//     },
//     AI: {
//       GENERATE_PRODUCT_DESCRIPTION: '/api/ai/generate-product-description',
//       UPDATE_LISTING_WITH_AI: '/api/ai/update-listing-with-ai/:listing_id',
//     },
//   },
// };

// export default API_CONFIG;

const API_CONFIG = {
  BASE_URL: "https://mightiest-unextolled-valeri.ngrok-free.dev",
  //BASE_URL: "https://localhost:3000",
  TIMEOUT: 30000,

  ENDPOINTS: {
    AUTH: {
      SEND_OTP:   '/api/auth/send-otp',
      VERIFY_OTP: '/api/auth/verify-otp',
      SIGNUP:     '/api/auth/signup',
      LOGIN:      '/api/auth/login',
      LOGOUT: '/api/auth/logout'
    },

    USER: {
      PROFILE: '/api/user/profile',
    },

    VENDOR: {
      PROFILE:  '/api/vendor/profile',
      LISTINGS: '/api/vendor/listings',
    },

    // ── Service Provider (vendor side) ── NEW ────────
    SERVICE: {
      PROFILE:      '/api/service/profile',
      DASHBOARD:    '/api/service/dashboard',
      BOOKINGS:     '/api/service/bookings',
      BOOKING_ACTION: '/api/service/bookings/:id/:action', // confirm|reject|complete|cancel
      AVAILABILITY: '/api/service/availability',
      AVAILABILITY_DELETE: '/api/service/availability/:availability_id',
    },

    // ── Bookings (customer side) ── NEW ──────────────
    BOOKINGS: {
      PROVIDER_AVAILABILITY: '/api/bookings/providers/:vendor_id/availability',
      CREATE:     '/api/bookings',
      MY_BOOKINGS:'/api/bookings/my',
      DETAILS:    '/api/bookings/:booking_id',
      CANCEL:     '/api/bookings/:booking_id/cancel',
    },

    CATALOG: {
      LISTINGS:        '/api/catalog/listings',
      LISTING_DETAILS: '/api/catalog/listings/:listing_id',
      SEARCH:          '/api/catalog/search',
      VENDOR_LISTINGS: '/api/catalog/vendors/:vendor_id/listings',
      VISUAL_SEARCH:   '/api/catalog/visual-search',
    },

    ORDERS: {
      PLACE_ORDER:   '/api/orders',
      MY_ORDERS:     '/api/orders/my',
      ORDER_DETAILS: '/api/orders/:order_id',
      CANCEL:        '/api/orders/:order_id/cancel',
      VENDOR_ORDERS: '/api/orders/vendor',
      UPDATE_STATUS: '/api/orders/:order_id/status',
    },

    UPLOAD: {
      IMAGE: '/api/upload',
    },

    STT: {
      TRANSCRIBE: '/api/stt/transcribe',
      HEALTH:     '/api/stt/health',
    },

    AI: {
      GENERATE_PRODUCT_DESCRIPTION: '/api/ai/generate-product-description',
      UPDATE_LISTING_WITH_AI:       '/api/ai/update-listing-with-ai/:listing_id',
      DESCRIPTION:                  '/api/ai/description',
    },
  },
};

export default API_CONFIG;