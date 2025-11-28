
// import React, { useState, useRef } from 'react';
// import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
// import { COLORS } from '../../constants/colors';
// import { startRecording, stopRecording, getRecordingDuration } from '../../utils/audioRecorder';
// import { transcribeAudio } from '../../api/sttService';

// const MINIMUM_RECORDING_DURATION = 1000; // 1 second minimum

// import { useTranslation } from 'react-i18next';

// const VoiceInputButton = ({ onTranscriptionComplete, disabled = false }) => {
//   const { i18n } = useTranslation();
//   const [isRecording, setIsRecording] = useState(false);
//   const [recording, setRecording] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const recordingStartTime = useRef(null);

//   const handleMicPress = async () => {
//     if (isRecording) {
//       await handleStopRecording();
//     } else {
//       await handleStartRecording();
//     }
//   };

//   const handleStartRecording = async () => {
//     try {
//       console.log('🎤 Starting recording...');
//       const newRecording = await startRecording();
//       setRecording(newRecording);
//       setIsRecording(true);
//       recordingStartTime.current = Date.now();
//       console.log('✅ Recording started at:', recordingStartTime.current);
//     } catch (error) {
//       console.error('❌ Recording start error:', error);
//       Alert.alert('Recording Error', error.message || 'Failed to start recording');
//     }
//   };

//   const handleStopRecording = async () => {
//     try {
//       // Check minimum duration
//       const recordingDuration = Date.now() - (recordingStartTime.current || 0);
//       console.log('⏱️ Recording duration:', recordingDuration, 'ms');

//       if (recordingDuration < MINIMUM_RECORDING_DURATION) {
//         Alert.alert(
//           'Recording Too Short',
//           'Please record for at least 1 second. Try speaking a bit longer.',
//           [{ text: 'OK' }]
//         );

//         // Cancel the recording
//         if (recording) {
//           await recording.stopAndUnloadAsync();
//         }
//         setIsRecording(false);
//         setRecording(null);
//         recordingStartTime.current = null;
//         return;
//       }

//       setIsRecording(false);
//       setIsProcessing(true);

//       console.log('⏹️ Stopping recording...');
//       const audioUri = await stopRecording(recording);
//       console.log('📁 Audio saved at:', audioUri);

//       // Read current language directly from i18n to avoid stale closure
//       const currentLanguage = i18n.language;
//       const languageCode = currentLanguage === 'en' ? 'en-US' : 'ur-PK';
//       console.log(`🔄 Starting transcription in ${currentLanguage === 'en' ? 'English' : 'Urdu'}...`);
//       console.log(`📤 Current i18n.language: ${currentLanguage}`); // DEBUG LOG
//       console.log(`📤 Sending languageCode: ${languageCode}`); // DEBUG LOG
//       const result = await transcribeAudio(audioUri, {
//         encoding: 'LINEAR16',
//         sampleRateHertz: 44100,
//         languageCode: languageCode,
//       });

//       setIsProcessing(false);

//       if (result.success) {
//         const transcribedText = result.data?.transcript || '';
//         console.log('✅ Transcription result:', transcribedText);

//         if (transcribedText && transcribedText.trim()) {
//           onTranscriptionComplete(transcribedText.trim());
//         } else {
//           Alert.alert(
//             'No Speech Detected',
//             'Could not detect any speech. Please try again and speak clearly.'
//           );
//         }
//       } else {
//         console.error('❌ Transcription failed:', result.error);
//         Alert.alert('Transcription Error', result.error || 'Failed to transcribe');
//       }

//       // Reset
//       setRecording(null);
//       recordingStartTime.current = null;

//     } catch (error) {
//       console.error('❌ Stop recording error:', error);
//       setIsProcessing(false);
//       setIsRecording(false);
//       Alert.alert('Error', 'Failed to process recording');
//     }
//   };

//   const getButtonText = () => {
//     if (isProcessing) return '🔄';
//     if (isRecording) return '⏹️';
//     return '🎤';
//   };

//   const getButtonStyle = () => {
//     if (disabled || isProcessing) return [styles.button, styles.buttonDisabled];
//     if (isRecording) return [styles.button, styles.buttonRecording];
//     return styles.button;
//   };

//   return (
//     <TouchableOpacity
//       style={getButtonStyle()}
//       onPress={handleMicPress}
//       disabled={disabled || isProcessing}
//     >
//       <Text style={styles.buttonText}>{getButtonText()}</Text>
//       {isRecording && <Text style={styles.recordingText}>Recording...</Text>}
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   button: {
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: 42,
//     marginTop: 4,
//     marginBottom: 8,
//     backgroundColor: COLORS.secondary,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   buttonRecording: {
//     backgroundColor: COLORS.errorBackground,
//     borderColor: COLORS.error,
//   },
//   buttonDisabled: {
//     backgroundColor: COLORS.disabled,
//     opacity: 0.6,
//   },
//   buttonText: {
//     fontSize: 18,
//   },
//   recordingText: {
//     fontSize: 10,
//     color: COLORS.error,
//     marginTop: 2,
//   },
// });

// export default VoiceInputButton;

import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../../constants/colors';
import { startRecording, stopRecording, getRecordingDuration } from '../../utils/audioRecorder';
import { transcribeAudio } from '../../api/sttService';
import { useTranslation } from 'react-i18next';

const MINIMUM_RECORDING_DURATION = 1000;

// ✅ ADD fieldType prop
const VoiceInputButton = ({ onTranscriptionComplete, disabled = false, fieldType = 'default' }) => {
  const { i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingStartTime = useRef(null);

  const handleMicPress = async () => {
    if (isRecording) {
      await handleStopRecording();
    } else {
      await handleStartRecording();
    }
  };

  const handleStartRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      const newRecording = await startRecording();
      setRecording(newRecording);
      setIsRecording(true);
      recordingStartTime.current = Date.now();
      console.log('✅ Recording started at:', recordingStartTime.current);
    } catch (error) {
      console.error('❌ Recording start error:', error);
      Alert.alert('Recording Error', error.message || 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      const recordingDuration = Date.now() - (recordingStartTime.current || 0);
      console.log('⏱️ Recording duration:', recordingDuration, 'ms');

      if (recordingDuration < MINIMUM_RECORDING_DURATION) {
        Alert.alert(
          'Recording Too Short',
          'Please record for at least 1 second. Try speaking a bit longer.',
          [{ text: 'OK' }]
        );

        if (recording) {
          await recording.stopAndUnloadAsync();
        }
        setIsRecording(false);
        setRecording(null);
        recordingStartTime.current = null;
        return;
      }

      setIsRecording(false);
      setIsProcessing(true);

      console.log('⏹️ Stopping recording...');
      const audioUri = await stopRecording(recording);
      console.log('📁 Audio saved at:', audioUri);

      const currentLanguage = i18n.language;
      const languageCode = currentLanguage === 'en' ? 'en-US' : 'ur-PK';

      console.log(`🔄 Starting transcription in ${currentLanguage === 'en' ? 'English' : 'Urdu'}...`);
      console.log(`📤 Current i18n.language: ${currentLanguage}`);
      console.log(`📤 Sending languageCode: ${languageCode}`);

      // ✅ PASS fieldType to transcribeAudio
      const result = await transcribeAudio(audioUri, {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
        languageCode: languageCode,
        fieldType: fieldType, // ✅ Pass field type for proper formatting
      });

      setIsProcessing(false);

      if (result.success) {
        const transcribedText = result.data?.transcript || '';
        console.log('✅ Transcription result:', transcribedText);

        if (transcribedText && transcribedText.trim()) {
          onTranscriptionComplete(transcribedText.trim());
        } else {
          Alert.alert(
            'No Speech Detected',
            'Could not detect any speech. Please try again and speak clearly.'
          );
        }
      } else {
        console.error('❌ Transcription failed:', result.error);
        Alert.alert('Transcription Error', result.error || 'Failed to transcribe');
      }

      setRecording(null);
      recordingStartTime.current = null;

    } catch (error) {
      console.error('❌ Stop recording error:', error);
      setIsProcessing(false);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to process recording');
    }
  };

  const getButtonText = () => {
    if (isProcessing) return '🔄';
    if (isRecording) return '⏹️';
    return '🎤';
  };

  const getButtonStyle = () => {
    if (disabled || isProcessing) return [styles.button, styles.buttonDisabled];
    if (isRecording) return [styles.button, styles.buttonRecording];
    return styles.button;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleMicPress}
      disabled={disabled || isProcessing}
    >
      <Text style={styles.buttonText}>{getButtonText()}</Text>
      {isRecording && <Text style={styles.recordingText}>Recording...</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonRecording: {
    backgroundColor: COLORS.errorBackground,
    borderColor: COLORS.error,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
  },
  recordingText: {
    fontSize: 10,
    color: COLORS.error,
    marginTop: 2,
  },
});

export default VoiceInputButton;
