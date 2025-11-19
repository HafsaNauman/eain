// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  TIMEOUT: 30000,
  AUDIO_CONFIG: {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    languageCode: 'en-US',
  },
};

export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  
  // STT
  TRANSCRIBE: '/stt/transcribe',
  STT_HEALTH: '/stt/health',
};
