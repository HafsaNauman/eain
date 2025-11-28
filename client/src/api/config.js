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
  BASE_URL: "https://unfiercely-javon-holistically.ngrok-free.dev",
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
    STT: {
      TRANSCRIBE: '/api/stt/transcribe',
      HEALTH: '/api/stt/health',
    },
  },
};

export default API_CONFIG;
