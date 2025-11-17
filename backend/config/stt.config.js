import dotenv from 'dotenv';
dotenv.config();

export default {
  fastApiUrl: process.env.FASTAPI_URL || 'http://localhost:8000',
  uploadDir: './uploads/audio',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFormats: ['audio/wav', 'audio/mpeg', 'audio/webm', 'audio/ogg'],
  defaultConfig: {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    languageCode: 'en-US'
  },
  supportedLanguages: {
    'en': 'en-US',
    'ur': 'ur-PK',
    'hi': 'hi-IN',
    'pa': 'pa-IN'
  }
};
