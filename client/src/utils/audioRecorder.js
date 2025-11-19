/**
 * Audio Recording Utilities
 * 
 * Uses expo-av to record audio with configuration
 * matching backend expectations
 */

import { Audio } from 'expo-av';

/**
 * Request audio recording permissions
 */
export const requestAudioPermissions = async () => {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      throw new Error('Audio recording permission denied');
    }
    return true;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

/**
 * Start audio recording
 * 
 * Configuration matches backend expectations:
 * - encoding: linear16
 * - sampleRateHertz: 44100
 * - languageCode: en-US
 * 
 * @returns {Promise<Audio.Recording>} Recording instance
 */
export const startRecording = async () => {
  try {
    // Request permissions
    const hasPermission = await requestAudioPermissions();
    if (!hasPermission) {
      throw new Error('Audio permission required');
    }
    
    // Set audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    
    // Create recording with configuration
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android: {
        extension: '.wav',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav',
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/wav',
        bitsPerSecond: 128000,
      },
    });
    
    await recording.startAsync();
    console.log('🎤 Recording started');
    
    return recording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
};

/**
 * Stop audio recording and get file URI
 * 
 * @param {Audio.Recording} recording - Recording instance
 * @returns {Promise<string>} File URI of recorded audio
 */
export const stopRecording = async (recording) => {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log('🎤 Recording stopped. File:', uri);
    return uri;
  } catch (error) {
    console.error('Failed to stop recording:', error);
    throw error;
  }
};
