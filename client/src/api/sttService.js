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

    const backendSearchQuery = response.data?.data?.searchQuery || response.data?.searchQuery || '';

    // ✅ Also clean the backend's searchQuery — it can have trailing punctuation too (e.g. "white kurta.")
    const cleanedSearchQuery = backendSearchQuery
      ? cleanTranscribedText(backendSearchQuery, 'search')
      : cleanedTranscript;

    return {
      success: true,
      data: {
        transcript: cleanedTranscript,
        rawTranscript: rawTranscript,
        searchQuery: cleanedSearchQuery,
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
