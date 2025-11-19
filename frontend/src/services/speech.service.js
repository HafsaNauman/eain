import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import apiClient from './api.service.js';
import { API_ENDPOINTS, API_CONFIG } from '../config/api.config.js';

class SpeechService {
  constructor() {
    this.recording = null;
    this.isRecording = false;
  }

  // Request microphone permissions
  async requestPermissions() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }

  // Start recording
  async startRecording() {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      
      console.log('🎤 Recording started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  // Stop recording and get URI
  async stopRecording() {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.recording = null;
      this.isRecording = false;

      console.log('🎤 Recording stopped. File:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  // Convert audio to WAV and transcribe
  async transcribeAudio(audioUri) {
    try {
      if (!audioUri) {
        throw new Error('No audio file provided');
      }

      // Read audio file
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Create FormData
      const formData = new FormData();
      
      // Append audio file
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'recording.wav',
      });

      // Append audio config
      formData.append('encoding', API_CONFIG.AUDIO_CONFIG.encoding);
      formData.append('sampleRateHertz', API_CONFIG.AUDIO_CONFIG.sampleRateHertz.toString());
      formData.append('languageCode', API_CONFIG.AUDIO_CONFIG.languageCode);

      // Send to backend
      const response = await apiClient.post(
        API_ENDPOINTS.TRANSCRIBE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ Transcription:', response.data?.transcript);
      return response.data?.transcript || '';
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  // Complete flow: Record + Transcribe
  async recordAndTranscribe() {
    try {
      // Start recording
      await this.startRecording();
      
      // Return control to caller (they'll call stopAndTranscribe when ready)
      return true;
    } catch (error) {
      throw error;
    }
  }

  async stopAndTranscribe() {
    try {
      // Stop recording
      const audioUri = await this.stopRecording();
      
      // Transcribe
      const transcript = await this.transcribeAudio(audioUri);
      
      // Clean up file
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
      
      return transcript;
    } catch (error) {
      throw error;
    }
  }

  // Get recording status
  getRecordingStatus() {
    return this.isRecording;
  }
}

export default new SpeechService();
