// import FormData from 'form-data';
// import fetch from 'node-fetch';
// import fs from 'fs';
// import sttConfig from '../config/stt.config.js';
// import { successResponse, errorResponse } from '../utils/responseBuilder.js';


// //  Speech-to-Text endpoint
// //  POST /api/stt/transcribe
// //  Accepts audio file and forwards to FastAPI

// export const transcribeAudio = async (req, res) => {
//   let audioFilePath = null;

//   try {
//     // Check if file was uploaded
//     if (!req.file) {
//       return errorResponse(res, 400, 'No audio file provided');
//     }

//     audioFilePath = req.file.path;
//     console.log('🎤 Audio file received:', req.file.filename);
//     console.log('📊 File size:', (req.file.size / 1024).toFixed(2), 'KB');

//     console.log('🔍 Request Body:', JSON.stringify(req.body, null, 2)); // DEBUG LOG
//     console.log('🔍 req.body.languageCode:', req.body.languageCode); // DEBUG LOG
//     console.log('🔍 All req.body keys:', Object.keys(req.body)); // DEBUG LOG

//     // Get audio configuration from request body
//     const audioConfig = {
//       encoding: req.body.encoding || sttConfig.defaultConfig.encoding,
//       sampleRateHertz: parseInt(req.body.sampleRateHertz) || sttConfig.defaultConfig.sampleRateHertz,
//       languageCode: req.body.languageCode || sttConfig.defaultConfig.languageCode
//     };

//     // If user provides a language preference, map it
//     if (req.body.language && sttConfig.supportedLanguages[req.body.language]) {
//       audioConfig.languageCode = sttConfig.supportedLanguages[req.body.language];
//     }

//     console.log('⚙️  Audio config:', audioConfig);

//     // Read audio file
//     const audioBuffer = fs.readFileSync(audioFilePath);

//     // Create FormData for FastAPI
//     const formData = new FormData();
//     formData.append('file', audioBuffer, {
//       filename: req.file.filename,
//       contentType: req.file.mimetype
//     });
//     formData.append('config', JSON.stringify(audioConfig));

//     console.log('🚀 Sending to FastAPI:', sttConfig.fastApiUrl);

//     // Send to FastAPI
//     const fastApiResponse = await fetch(`${sttConfig.fastApiUrl}/transcribe`, {
//       method: 'POST',
//       body: formData,
//       headers: formData.getHeaders()
//     });

//     if (!fastApiResponse.ok) {
//       const errorText = await fastApiResponse.text();
//       console.error(' FastAPI error:', errorText);
//       throw new Error(`FastAPI returned ${fastApiResponse.status}: ${errorText}`);
//     }

//     const result = await fastApiResponse.json();
//     console.log(' Transcription result:', result);

//     // Clean up uploaded file
//     fs.unlinkSync(audioFilePath);
//     console.log('🗑️  Temporary file deleted');

//     // Return result to frontend
//     return successResponse(
//       res,
//       200,
//       'Audio transcribed successfully',
//       {
//         transcript: result.transcript,
//         confidence: result.confidence,
//         languageCode: audioConfig.languageCode
//       }
//     );

//   } catch (error) {
//     console.error('Transcription error:', error.message);

//     // Clean up file if exists
//     if (audioFilePath && fs.existsSync(audioFilePath)) {
//       fs.unlinkSync(audioFilePath);
//     }

//     return errorResponse(
//       res,
//       500,
//       'Failed to transcribe audio',
//       error.message
//     );
//   }
// };


// // Health check for STT service
// // GET /api/stt/health

// export const checkSTTHealth = async (req, res) => {
//   try {
//     const response = await fetch(`${sttConfig.fastApiUrl}/health`);
//     const data = await response.json();

//     return successResponse(
//       res,
//       200,
//       'STT service health check',
//       {
//         nodeBackend: 'healthy',
//         fastApi: response.ok ? 'healthy' : 'unhealthy',
//         fastApiUrl: sttConfig.fastApiUrl,
//         fastApiResponse: data
//       }
//     );
//   } catch (error) {
//     return errorResponse(
//       res,
//       503,
//       'STT service unavailable',
//       error.message
//     );
//   }
// };



import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import sttConfig from '../config/stt.config.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';

// Speech-to-Text endpoint
// POST /api/stt/transcribe
// Accepts audio file and forwards to FastAPI

export const transcribeAudio = async (req, res) => {
  let audioFilePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return errorResponse(res, 400, 'No audio file provided');
    }

    audioFilePath = req.file.path;
    console.log('🎤 Audio file received:', req.file.filename);
    console.log('📊 File size:', (req.file.size / 1024).toFixed(2), 'KB');

    console.log('🔍 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 req.body.languageCode:', req.body.languageCode);
    console.log('🔍 All req.body keys:', Object.keys(req.body));

    // Build audio config — pass ALL fields including bilingual + phrase hints
    const audioConfig = {
      encoding: req.body.encoding || sttConfig.defaultConfig.encoding,
      sampleRateHertz: parseInt(req.body.sampleRateHertz) || sttConfig.defaultConfig.sampleRateHertz,
      languageCode: req.body.languageCode || sttConfig.defaultConfig.languageCode,
      alternativeLanguageCodes: sttConfig.defaultConfig.alternativeLanguageCodes,
      model: sttConfig.defaultConfig.model,
      useEnhanced: sttConfig.defaultConfig.useEnhanced,
      speechContexts: sttConfig.defaultConfig.speechContexts,
    };

    // Override language if user passes short code e.g. "ur" or "en"
    if (req.body.language && sttConfig.supportedLanguages[req.body.language]) {
      audioConfig.languageCode = sttConfig.supportedLanguages[req.body.language];
    }

    console.log('⚙️ Audio config:', JSON.stringify(audioConfig, null, 2));

    // Read audio file
    const audioBuffer = fs.readFileSync(audioFilePath);

    // Create FormData for FastAPI
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: req.file.filename,
      contentType: req.file.mimetype,
    });
    formData.append('config', JSON.stringify(audioConfig));

    console.log('🚀 Sending to FastAPI:', sttConfig.fastApiUrl);

    // Send to FastAPI
    const fastApiResponse = await fetch(`${sttConfig.fastApiUrl}/transcribe`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!fastApiResponse.ok) {
      const errorText = await fastApiResponse.text();
      console.error('❌ FastAPI error:', errorText);
      throw new Error(`FastAPI returned ${fastApiResponse.status}: ${errorText}`);
    }

    const result = await fastApiResponse.json();
    console.log('✅ Transcription result:', result);

    // Clean up uploaded file
    fs.unlinkSync(audioFilePath);
    console.log('🗑️ Temporary file deleted');

    // Return result to frontend
    return successResponse(
      res,
      200,
      'Audio transcribed successfully',
      {
        transcript: result.transcript,
        searchQuery: result.transcript,
        confidence: result.confidence,
        languageCode: audioConfig.languageCode,
      }
    );

  } catch (error) {
    console.error('❌ Transcription error:', error.message);

    // Clean up file if exists
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }

    return errorResponse(
      res,
      500,
      'Failed to transcribe audio',
      error.message
    );
  }
};

// Health check for STT service
// GET /api/stt/health

export const checkSTTHealth = async (req, res) => {
  try {
    const response = await fetch(`${sttConfig.fastApiUrl}/health`);
    const data = await response.json();

    return successResponse(
      res,
      200,
      'STT service health check',
      {
        nodeBackend: 'healthy',
        fastApi: response.ok ? 'healthy' : 'unhealthy',
        fastApiUrl: sttConfig.fastApiUrl,
        fastApiResponse: data,
      }
    );
  } catch (error) {
    return errorResponse(
      res,
      503,
      'STT service unavailable',
      error.message
    );
  }
};