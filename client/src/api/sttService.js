/**
 * Speech-to-Text Service
 * 
 * Handles audio recording and transcription:
 * - Record audio using expo-av
 * - Send to Node backend which forwards to FastAPI
 * - Returns transcribed text
 * 
 * Audio config matches backend expectations:
 * - encoding: "linear16"
 * - sampleRateHertz: 44100
 * - languageCode: "en-US"
 */

import axios from 'axios';
import API_CONFIG from './config';
import { getAccessToken } from '../utils/storage';

/**
 * Transcribe audio file
 * 
 * @param {string} audioUri - Local file URI from expo-av recording
 * @param {Object} config - Audio configuration
 * @returns {Promise} Response with transcribed text
 * 
 * Backend endpoint: POST /api/stt/transcribe
 * Content-Type: multipart/form-data
 * Body: { file: audio file, encoding, sampleRateHertz, languageCode }
 */
export const transcribeAudio = async (audioUri, config = {}) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append audio file
    formData.append('file', {
      uri: audioUri,
      type: 'audio/wav',
      name: 'recording.wav',
    });
    
    // Append audio configuration (matches backend expectations)
    formData.append('encoding', config.encoding || 'linear16');
    formData.append('sampleRateHertz', config.sampleRateHertz || '44100');
    formData.append('languageCode', config.languageCode || 'en-US');
    
    // Get auth token if available
    const token = await getAccessToken();
    
    // Send request with custom headers for multipart/form-data
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STT.TRANSCRIBE}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 30000, // 30 second timeout for audio processing
      }
    );
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Transcription error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to transcribe audio',
    };
  }
};

/**
 * Check STT service health
 * 
 * @returns {Promise} Health status of Node and FastAPI services
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
