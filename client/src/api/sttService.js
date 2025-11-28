
import axios from 'axios';
import API_CONFIG from './config';
import { getAccessToken } from '../utils/storage';
import { Platform } from 'react-native';

/**
 * Transcribe audio file
 * 
 * @param {string} audioUri - Local file URI from expo-av recording
 * @param {Object} config - Audio configuration
 * @returns {Promise<Object>} Response with transcribed text
 */
export const transcribeAudio = async (audioUri, config = {}) => {
  try {
    console.log('📤 Starting transcription...');
    console.log('📁 Audio URI:', audioUri);

    // Validate audio URI
    if (!audioUri) {
      throw new Error('No audio file to transcribe');
    }

    // Create FormData for file upload
    const formData = new FormData();

    // Append audio file with proper configuration
    const audioFile = {
      uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
      type: 'audio/wav', // FastAPI expects WAV
      name: 'recording.wav',
    };

    console.log('🎵 Audio file config:', audioFile);
    formData.append('audio', audioFile);

    // Append audio configuration (must match FastAPI expectations)
    formData.append('encoding', config.encoding || 'LINEAR16');
    formData.append('sampleRateHertz', String(config.sampleRateHertz || 44100));
    formData.append('languageCode', config.languageCode || 'en-US');

    console.log('⚙️ Transcription config:', {
      encoding: config.encoding || 'LINEAR16',
      sampleRateHertz: config.sampleRateHertz || 44100,
      languageCode: config.languageCode || 'en-US',
    });

    // Get auth token if available
    const token = await getAccessToken();

    // Send request to Node backend (which forwards to FastAPI)
    console.log('🚀 Sending to backend:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.TRANSCRIBE}`);

    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.TRANSCRIBE}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('✅ Transcription response:', response.data);

    // Extract transcript from response
    const transcript =
      response.data?.data?.transcript ||
      response.data?.transcript ||
      '';

    const confidence =
      response.data?.data?.confidence ||
      response.data?.confidence ||
      0;

    return {
      success: true,
      data: {
        transcript,
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

/**
 * Check STT service health
 * 
 * @returns {Promise<Object>} Health status
 */
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
