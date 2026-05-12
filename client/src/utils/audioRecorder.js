import { Audio } from 'expo-av';
import { Platform } from 'react-native';
// ✅ Import from legacy path to avoid deprecation warning
import * as FileSystem from 'expo-file-system';

/**
 * Start audio recording
 */
export const startRecording = async () => {
  try {
    console.log('🎤 Requesting permissions...');

    const permission = await Audio.requestPermissionsAsync();

    if (permission.status !== 'granted') {
      throw new Error('Microphone permission required');
    }

    console.log('✅ Permission granted');

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    console.log('🎙️ Creating recording...');

    const recording = new Audio.Recording();

    // Recording options with both platform configs
    const recordingOptions = {
      isMeteringEnabled: true,
      android: {
        extension: '.wav',
        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav',
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        audioQuality: Audio.IOSAudioQuality.HIGH,
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
    };

    console.log('🔧 Recording config for platform:', Platform.OS);

    await recording.prepareToRecordAsync(recordingOptions);
    await recording.startAsync();

    console.log('✅ Recording STARTED');
    return recording;

  } catch (error) {
    console.error('❌ Start recording error:', error);
    throw error;
  }
};

/**
 * Stop recording and return URI
 */
export const stopRecording = async (recording) => {
  try {
    if (!recording) {
      throw new Error('No active recording');
    }

    console.log('⏹️ Stopping recording...');

    await recording.stopAndUnloadAsync();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();

    if (!uri) {
      throw new Error('No recording URI');
    }

    console.log('📁 Recording URI:', uri);

    // ✅ FIXED: Use legacy API - getInfoAsync now works
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('📊 File info:', {
        exists: fileInfo.exists,
        size: fileInfo.size,
      });

      if (!fileInfo.exists) {
        console.warn('⚠️ Warning: Recording file does not exist');
      } else if (fileInfo.size < 1000) {
        console.warn('⚠️ Warning: Recording file very small (<1KB)');
      }
    } catch (fileCheckError) {
      // Don't fail if file check fails - just log warning
      console.warn('⚠️ Could not verify file:', fileCheckError.message);
    }

    console.log('✅ Recording stopped successfully');
    return uri;

  } catch (error) {
    console.error('❌ Stop recording error:', error);
    throw error;
  }
};

/**
 * Get recording duration in milliseconds
 */
export const getRecordingDuration = async (recording) => {
  try {
    if (!recording) return 0;
    const status = await recording.getStatusAsync();
    return status.durationMillis || 0;
  } catch (error) {
    console.error('⚠️ Error getting duration:', error);
    return 0;
  }
};
