// /**
//  * API Configuration
//  * 
//  * IMPORTANT: Replace YOUR_MACHINE_IP with your actual IP address
//  * 
//  * To find your IP:
//  * - macOS/Linux: Run `ifconfig | grep inet` in terminal
//  * - Windows: Run `ipconfig` in command prompt
//  * 
//  * Examples:
//  * - Development (same WiFi): http://192.168.1.100:3000
//  * - Android Emulator: http://10.0.2.2:3000
//  * - iOS Simulator: http://localhost:3000
//  */

// const API_CONFIG = {
//   // Base URL for your Node.js backend
// //   BASE_URL: 'http://YOUR_MACHINE_IP:3000',
//   BASE_URL:"https://unfiercely-javon-holistically.ngrok-free.dev",
//   // Timeout for API requests (milliseconds)
//   TIMEOUT: 30000,

//   // API endpoints
//   ENDPOINTS: {
//     AUTH: {
//       SEND_OTP: '/api/auth/send-otp',
//       VERIFY_OTP: '/api/auth/verify-otp',
//       SIGNUP: '/api/auth/signup',
//       LOGIN: '/api/auth/login',
//     },
//     STT: {
//       TRANSCRIBE: '/api/stt/transcribe',
//       HEALTH: '/api/stt/health',
//     },
//   },
// };

// export default API_CONFIG;
const API_CONFIG = {
  BASE_URL: "https://957d-223-123-109-224.ngrok-free.app",
  TIMEOUT: 30000,

  ENDPOINTS: {
    AUTH: {
      SEND_OTP: '/api/auth/send-otp',
      VERIFY_OTP: '/api/auth/verify-otp',
      SIGNUP: '/api/auth/signup',
      LOGIN: '/api/auth/login',
    },

    ADMIN: {
      DASHBOARD: '/api/admin/dashboard',
      USERS: '/api/admin/users',
      VENDORS: '/api/admin/vendors',
      ORDERS: '/api/admin/orders',
      LISTINGS: '/api/admin/listings',
    },

    VENDOR: {
      PROFILE: '/api/vendor/profile',
      LISTINGS: '/api/vendor/listings',
      LISTING_DETAILS: '/api/vendor/listings/:listing_id',
      ORDERS: '/api/vendor/orders',
      ORDER_DETAILS: '/api/vendor/orders/:order_id',
    },

    CATALOG: {
      LISTINGS: '/api/catalog/listings',
      LISTING_DETAILS: '/api/catalog/listings/:listing_id',
      SEARCH: '/api/catalog/search',
      VENDOR_LISTINGS: '/api/catalog/vendors/:vendor_id/listings',
    },

    INVENTORY: {
      LIST: '/api/inventory',
      ITEM_DETAILS: '/api/inventory/:item_id',
      UPDATE: '/api/inventory/:item_id',
      LOW_STOCK: '/api/inventory/low-stock',
    },

    SERVICE: {
      LIST: '/api/services',
      DETAILS: '/api/services/:service_id',
      CREATE: '/api/services',
      UPDATE: '/api/services/:service_id',
      DELETE: '/api/services/:service_id',
    },

    LISTING: {
      LIST: '/api/listings',
      DETAILS: '/api/listings/:listing_id',
      CREATE: '/api/listings',
      UPDATE: '/api/listings/:listing_id',
      DELETE: '/api/listings/:listing_id',
    },

    CART: {
      GET: '/api/cart',
      ADD: '/api/cart',
      UPDATE: '/api/cart/:item_id',
      REMOVE: '/api/cart/:item_id',
      CLEAR: '/api/cart',
    },

    BOOKING: {
      CREATE: '/api/bookings',
      MY_BOOKINGS: '/api/bookings/my',
      DETAILS: '/api/bookings/:booking_id',
      UPDATE: '/api/bookings/:booking_id',
      CANCEL: '/api/bookings/:booking_id/cancel',
    },

    ORDERS: {
      PLACE_ORDER: '/api/orders',
      MY_ORDERS: '/api/orders/my',
      ORDER_DETAILS: '/api/orders/:order_id',
    },

    VENDOR_ORDERS: {
      LIST: '/api/vendor/orders',
      DETAILS: '/api/vendor/orders/:order_id',
      UPDATE_STATUS: '/api/vendor/orders/:order_id/status',
    },

    AI: {
      GENERATE_PRODUCT_DESCRIPTION: '/api/ai/generate-product-description',
      UPDATE_LISTING_WITH_AI: '/api/ai/update-listing-with-ai/:listing_id',
      VISUAL_SEARCH: '/api/ai/visual-search',
      AI_DESCRIPTION: '/api/ai/description',
    },

    STT: {
      TRANSCRIBE: '/api/stt/transcribe',
      HEALTH: '/api/stt/health',
    },

    UPLOAD: {
      SINGLE: '/api/upload',
      MULTIPLE: '/api/upload/multiple',
      IMAGE: '/api/upload/image',
      AUDIO: '/api/upload/audio',
    },
  },
};

export default API_CONFIG;