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
  // Garments
  { value: 'kameez', boost: 15 },
  { value: 'shalwar', boost: 15 },
  { value: 'kurta', boost: 15 },
  { value: 'dupatta', boost: 15 },
  { value: 'gharara', boost: 15 },
  { value: 'lehenga', boost: 15 },
  { value: 'abaya', boost: 15 },
  { value: 'jora', boost: 12 },
  { value: 'kamiz', boost: 12 },
  // Jewellery
  { value: 'haar', boost: 15 },
  { value: 'kangan', boost: 15 },
  { value: 'jhumka', boost: 15 },
  { value: 'angoothi', boost: 15 },
  { value: 'necklace', boost: 10 },
  { value: 'earring', boost: 10 },
  // Colors (Roman Urdu)
  { value: 'surkh', boost: 10 },
  { value: 'neela', boost: 10 },
  { value: 'safaid', boost: 10 },
  { value: 'kala', boost: 10 },
  { value: 'peela', boost: 10 },
  { value: 'sabz', boost: 10 },
  // Price filters
  { value: 'se kam', boost: 10 },
  { value: 'under 500', boost: 10 },
  { value: 'under 1000', boost: 10 },
  { value: 'under 2000', boost: 10 },
  { value: 'under 5000', boost: 10 },
  { value: 'sasta', boost: 12 },
  { value: 'mehenga', boost: 10 },
  { value: 'naya', boost: 8 },
];

export default {
  fastApiUrl: process.env.FASTAPI_URL || 'http://localhost:8000',
  uploadDir: './uploads/audio',
  maxFileSize: 50 * 1024 * 1024,
  allowedFormats: [
    'audio/wav', 'audio/mpeg', 'audio/webm',
    'audio/ogg', 'audio/x-wav',
  ],
  defaultConfig: {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    // Primary: Urdu-Pakistan. alternativeLanguageCodes handles English + code-switching.
    languageCode: 'ur-PK',
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
  // Post-processing normalization (Roman Urdu → searchable English)
  queryNormalizations: {
    'kamiz': 'kameez',
    'jora': 'outfit suit',
    'kapra': 'clothes fabric',
    'sasta': 'affordable cheap',
    'mehenga': 'premium expensive',
    'naya': 'new latest',
    'purana': 'old vintage',
    'rang': 'color',
    'surkh': 'red',
    'neela': 'blue',
    'safaid': 'white',
    'kala': 'black',
    'peela': 'yellow',
    'sabz': 'green',
    'haar': 'necklace',
    'kangan': 'bracelet',
    'jhumka': 'earrings',
    'angoothi': 'ring',
    'se kam': 'under',
    'tak': 'up to',
  },
};