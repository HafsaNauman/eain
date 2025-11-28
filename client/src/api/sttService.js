
// import axios from 'axios';
// import API_CONFIG from './config';
// import { getAccessToken } from '../utils/storage';
// import { Platform } from 'react-native';

// /**
//  * Transcribe audio file
//  * 
//  * @param {string} audioUri - Local file URI from expo-av recording
//  * @param {Object} config - Audio configuration
//  * @returns {Promise<Object>} Response with transcribed text
//  */
// export const transcribeAudio = async (audioUri, config = {}) => {
//   try {
//     console.log('📤 Starting transcription...');
//     console.log('📁 Audio URI:', audioUri);

//     if (!audioUri) {
//       throw new Error('No audio file to transcribe');
//     }

//     const formData = new FormData();

//     const audioFile = {
//       uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
//       type: 'audio/wav',
//       name: 'recording.wav',
//     };

//     console.log('🎵 Audio file config:', audioFile);
//     formData.append('audio', audioFile);

//     // ✅ DEBUG: Log what config we received
//     console.log('🔍 STTSERVICE - Config received:', config);
//     console.log('🔍 STTSERVICE - languageCode:', config.languageCode);
//     console.log('🔍 STTSERVICE - encoding:', config.encoding);
//     console.log('🔍 STTSERVICE - sampleRateHertz:', config.sampleRateHertz);

//     // Append configuration
//     const encodingToSend = config.encoding || 'LINEAR16';
//     const sampleRateToSend = config.sampleRateHertz || 44100;
//     const languageCodeToSend = config.languageCode || 'en-US';

//     console.log('📨 STTSERVICE - Values to send:');
//     console.log('   encoding:', encodingToSend);
//     console.log('   sampleRate:', sampleRateToSend);
//     console.log('   languageCode:', languageCodeToSend);

//     formData.append('encoding', encodingToSend);
//     formData.append('sampleRateHertz', String(sampleRateToSend));
//     formData.append('languageCode', languageCodeToSend);

//     const token = await getAccessToken();

//     console.log('🚀 Sending to backend:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.TRANSCRIBE}`);

//     const response = await axios.post(
//       `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.TRANSCRIBE}`,
//       formData,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           ...(token && { Authorization: `Bearer ${token}` }),
//         },
//         timeout: 30000,
//       }
//     );

//     console.log('✅ Transcription response:', response.data);

//     const transcript = response.data?.data?.transcript || response.data?.transcript || '';
//     const confidence = response.data?.data?.confidence || response.data?.confidence || 0;

//     return {
//       success: true,
//       data: { transcript, confidence, fullResponse: response.data },
//     };

//   } catch (error) {
//     console.error('❌ Transcription error:', {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status,
//     });

//     return {
//       success: false,
//       error: error.response?.data?.message || error.message || 'Failed to transcribe audio',
//     };
//   }
// };

// /**
//  * Check STT service health
//  * 
//  * @returns {Promise<Object>} Health status
//  */
// export const checkSTTHealth = async () => {
//   try {
//     const response = await axios.get(
//       `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.HEALTH}`
//     );
//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: 'STT service unavailable',
//     };
//   }
// };
import axios from 'axios';
import API_CONFIG from './config';
import { getAccessToken } from '../utils/storage';
import { Platform } from 'react-native';
import { cleanTranscribedText } from '../utils/textUtils'; // ✅ ADD THIS

export const transcribeAudio = async (audioUri, config = {}) => {
  try {
    console.log('📤 Starting transcription...');
    console.log('📁 Audio URI:', audioUri);

    if (!audioUri) {
      throw new Error('No audio file to transcribe');
    }

    const formData = new FormData();

    const audioFile = {
      uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
      type: 'audio/wav',
      name: 'recording.wav',
    };

    console.log('🎵 Audio file config:', audioFile);
    formData.append('audio', audioFile);

    const languageCode = config.languageCode || 'en-US';

    formData.append('encoding', config.encoding || 'LINEAR16');
    formData.append('sampleRateHertz', String(config.sampleRateHertz || 44100));
    formData.append('languageCode', languageCode);

    console.log('⚙️ Transcription config:', {
      encoding: config.encoding || 'LINEAR16',
      sampleRateHertz: config.sampleRateHertz || 44100,
      languageCode: languageCode,
    });

    const token = await getAccessToken();

    console.log('🚀 Sending to backend:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.TRANSCRIBE}`);

    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.TRANSCRIBE}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 30000,
      }
    );

    console.log('✅ Transcription response:', response.data);

    // Extract raw transcript
    const rawTranscript =
      response.data?.data?.transcript ||
      response.data?.transcript ||
      '';

    // ✅ CLEAN THE TRANSCRIPT
    const cleanedTranscript = cleanTranscribedText(rawTranscript, config.fieldType || 'default');

    console.log('📝 Raw transcript:', rawTranscript);
    console.log('✨ Cleaned transcript:', cleanedTranscript);

    const confidence =
      response.data?.data?.confidence ||
      response.data?.confidence ||
      0;

    return {
      success: true,
      data: {
        transcript: cleanedTranscript, // ✅ Return cleaned version
        rawTranscript: rawTranscript,   // Keep original if needed
        confidence,
        fullResponse: response.data,
      },
    };

  } catch (error) {
    console.error('❌ Transcription error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to transcribe audio',
    };
  }
};

export const checkSTTHealth = async () => {
  try {
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.HEALTH}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'STT service unavailable',
    };
  }
};
