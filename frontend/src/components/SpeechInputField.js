import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import speechService from '../services/speech.service.js';

const SpeechInputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleMicPress = async () => {
    try {
      if (!isRecording) {
        // Start recording
        await speechService.startRecording();
        setIsRecording(true);
      } else {
        // Stop and transcribe
        setIsRecording(false);
        setIsTranscribing(true);
        
        const transcript = await speechService.stopAndTranscribe();
        onChangeText(transcript);
        
        setIsTranscribing(false);
      }
    } catch (error) {
      console.error('Speech input error:', error);
      alert(error.message || 'Failed to process speech');
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!isRecording && !isTranscribing}
        />
        
        <TouchableOpacity
          style={[
            styles.micButton,
            isRecording && styles.micButtonRecording,
          ]}
          onPress={handleMicPress}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.micIcon}>
              {isRecording ? '⏹' : '🎤'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {isRecording && (
        <Text style={styles.recordingText}>
          Recording... Tap to stop
        </Text>
      )}
      
      {isTranscribing && (
        <Text style={styles.recordingText}>
          Transcribing...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  micButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  micIcon: {
    fontSize: 24,
  },
  recordingText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default SpeechInputField;
