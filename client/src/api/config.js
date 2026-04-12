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
  BASE_URL: "https://5dd7-119-73-98-202.ngrok-free.app",
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
