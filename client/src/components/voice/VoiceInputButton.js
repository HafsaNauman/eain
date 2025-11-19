/**
 * Voice Input Button Component
 * 
 * Microphone button that records audio and transcribes it
 * 
 * Flow:
 * 1. User presses mic button
 * 2. Start recording audio (.wav)
 * 3. User presses again to stop
 * 4. Send audio to Node backend
 * 5. Node forwards to FastAPI for speech-to-text
 * 6. Transcribed text returned to frontend
 * 
 * Props:
 * - onTranscriptionComplete: Callback with transcribed text
 * - disabled: Disable button
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../../constants/colors';
import { startRecording, stopRecording } from '../../utils/audioRecorder';
import { transcribeAudio } from '../../api/sttService';

const VoiceInputButton = ({ onTranscriptionComplete, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMicPress = async () => {
    if (isRecording) {
      // Stop recording
      await handleStopRecording();
    } else {
      // Start recording
      await handleStartRecording();
    }
  };

  const handleStartRecording = async () => {
    try {
      const newRecording = await startRecording();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert(
        'Recording Error',
        error.message || 'Failed to start recording. Please check microphone permissions.'
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Stop recording and get file URI
      const audioUri = await stopRecording(recording);
      
      // Send to backend for transcription
      const result = await transcribeAudio(audioUri, {
        encoding: 'linear16',
        sampleRateHertz: 44100,
        languageCode: 'en-US',
      });

      setIsProcessing(false);

      if (result.success) {
        // Extract transcribed text from response
        const transcribedText = result.data?.data?.transcription || '';
        
        if (transcribedText) {
          onTranscriptionComplete(transcribedText);
        } else {
          Alert.alert('No Speech Detected', 'Could not transcribe audio. Please try again.');
        }
      } else {
        Alert.alert('Transcription Error', result.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process recording');
      console.error('Recording error:', error);
    }
  };

  const getButtonText = () => {
    if (isProcessing) return '🔄 Processing...';
    if (isRecording) return '⏹️ Stop';
    return '🎤 Voice Input';
  };

  const getButtonStyle = () => {
    if (disabled || isProcessing) return [styles.button, styles.buttonDisabled];
    if (isRecording) return [styles.button, styles.buttonRecording];
    return [styles.button, styles.buttonDefault];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleMicPress}
      disabled={disabled || isProcessing}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>{getButtonText()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  buttonDefault: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonRecording: {
    backgroundColor: COLORS.error,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default VoiceInputButton;
