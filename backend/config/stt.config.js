// import dotenv from 'dotenv';
// dotenv.config();

// export default {
//   fastApiUrl: process.env.FASTAPI_URL || 'http://localhost:8000',
//   uploadDir: './uploads/audio',
//   maxFileSize: 50 * 1024 * 1024, // 50MB
//   allowedFormats: ['audio/wav',
//      'audio/mpeg',
//       'audio/webm', 
//       'audio/ogg', 
//       'audio/wav',        // Standard
//   'audio/x-wav'],    // Common from Windows and Postman] ,
//   defaultConfig: {
//     encoding: 'LINEAR16',
//     sampleRateHertz: 44100,
//     languageCode: 'en-US'
//     // languageCode: 'ur-PK'

//   },
//   supportedLanguages: {
//     'en': 'en-US',
//     'ur': 'ur-PK',
//     'hi': 'hi-IN',
//     'pa': 'pa-IN'
//   }
// };


import dotenv from 'dotenv';
dotenv.config();

// ── Fashion domain phrases for Google STT PhraseSet boost ──────────────
const FASHION_PHRASES = [
  // ── Garments (Roman Urdu) ──
  { value: 'kameez', boost: 20 },
  { value: 'shalwar', boost: 20 },
  { value: 'shalwar kameez', boost: 20 },
  { value: 'kurta', boost: 20 },
  { value: 'dupatta', boost: 18 },
  { value: 'gharara', boost: 18 },
  { value: 'lehenga', boost: 18 },
  { value: 'abaya', boost: 18 },
  { value: 'jora', boost: 15 },
  { value: 'kamiz', boost: 15 },
  { value: 'kurti', boost: 18 },
  { value: 'palazzo', boost: 15 },
  { value: 'suit', boost: 12 },
  { value: 'dress', boost: 12 },
  { value: 'shirt', boost: 12 },
  { value: 'pants', boost: 10 },
  { value: 'frock', boost: 15 },
  { value: 'saree', boost: 15 },
  { value: 'lawn', boost: 15 },
  { value: 'chiffon', boost: 15 },
  { value: 'silk', boost: 12 },
  { value: 'cotton', boost: 10 },
  // ── Jewellery ──
  { value: 'haar', boost: 18 },
  { value: 'kangan', boost: 18 },
  { value: 'jhumka', boost: 20 },
  { value: 'angoothi', boost: 18 },
  { value: 'necklace', boost: 15 },
  { value: 'earring', boost: 15 },
  { value: 'earrings', boost: 15 },
  { value: 'bracelet', boost: 12 },
  { value: 'ring', boost: 10 },
  { value: 'bangles', boost: 15 },
  { value: 'choker', boost: 15 },
  // ── Colors (English) ──
  { value: 'white', boost: 15 },
  { value: 'black', boost: 15 },
  { value: 'red', boost: 12 },
  { value: 'blue', boost: 12 },
  { value: 'green', boost: 12 },
  { value: 'yellow', boost: 12 },
  { value: 'pink', boost: 12 },
  { value: 'purple', boost: 10 },
  { value: 'orange', boost: 10 },
  { value: 'brown', boost: 10 },
  { value: 'grey', boost: 10 },
  { value: 'golden', boost: 12 },
  { value: 'maroon', boost: 12 },
  { value: 'navy', boost: 10 },
  // ── Colors (Roman Urdu) ──
  { value: 'surkh', boost: 12 },
  { value: 'neela', boost: 12 },
  { value: 'safaid', boost: 12 },
  { value: 'kala', boost: 12 },
  { value: 'peela', boost: 12 },
  { value: 'sabz', boost: 12 },
  { value: 'gulabi', boost: 12 },
  { value: 'asmani', boost: 10 },
  // ── Bilingual multi-word phrases ──
  { value: 'white kameez', boost: 25 },
  { value: 'white kurta', boost: 25 },
  { value: 'black abaya', boost: 22 },
  { value: 'red lehenga', boost: 22 },
  { value: 'blue shalwar', boost: 22 },
  { value: 'pink kurti', boost: 22 },
  { value: 'golden earrings', boost: 22 },
  { value: 'silver necklace', boost: 22 },
  { value: 'casual kurta', boost: 20 },
  { value: 'bridal lehenga', boost: 20 },
  { value: 'party wear', boost: 18 },
  { value: 'casual wear', boost: 15 },
  { value: 'formal wear', boost: 15 },
  // ── Price filters ──
  { value: 'se kam', boost: 12 },
  { value: 'under 500', boost: 12 },
  { value: 'under 1000', boost: 12 },
  { value: 'under 2000', boost: 12 },
  { value: 'under 5000', boost: 12 },
  { value: 'sasta', boost: 15 },
  { value: 'mehenga', boost: 12 },
  { value: 'naya', boost: 10 },
  { value: 'affordable', boost: 10 },
];


export default {
  fastApiUrl: process.env.FASTAPI_URL || 'https://walrus-app-w43ss.ondigitalocean.app/eain-stt-service',
  uploadDir: './uploads/audio',
  maxFileSize: 50 * 1024 * 1024,
  allowedFormats: [
    'audio/wav', 'audio/mpeg', 'audio/webm',
    'audio/ogg', 'audio/x-wav',
  ],
  defaultConfig: {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    languageCode: 'en-IN',
    alternativeLanguageCodes: ['en-US'],
    model: 'latest_long',
    useEnhanced: true,
    speechContexts: [{ phrases: FASHION_PHRASES }],
  },
  supportedLanguages: {
    'en': 'en-US',
    'ur': 'ur-PK',
    'hi': 'hi-IN',
    'pa': 'pa-IN',
  },
};