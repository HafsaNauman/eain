/**
 * Phone Number Screen
 * 
 * OTP verification BYPASSED for testing
 * Goes directly to SignUp screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneNumberInput from '../components/phone/PhoneNumberInput';
import CustomButton from '../components/common/CustomButton';
import VoiceInputButton from '../components/voice/VoiceInputButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { COLORS } from '../constants/colors';
import { validatePhoneNumber } from '../utils/validation';
// import { sendOTP } from '../api/authService'; // COMMENTED OUT FOR TESTING

const PhoneNumberScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    // Clear previous errors
    setError('');

    // Validate phone number format
    const fullPhoneNumber = `+92${phoneNumber.replace(/\s/g, '')}`;
    
    if (!validatePhoneNumber(fullPhoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);

    // ============================================
    // OTP API CALL COMMENTED OUT FOR TESTING
    // ============================================
    /*
    try {
      const result = await sendOTP(fullPhoneNumber);

      if (result.success) {
        navigation.navigate('OTP', {
          phoneNumber: fullPhoneNumber,
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error('Send OTP error:', err);
    } finally {
      setLoading(false);
    }
    */

    // ============================================
    // TESTING MODE: Skip OTP, go directly to SignUp
    // ============================================
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('SignUp', {
        phoneNumber: fullPhoneNumber,
      });
    }, 500);
  };

  const handleVoiceTranscription = (transcribedText) => {
    // Extract digits from transcribed text
    const digits = transcribedText.replace(/\D/g, '');
    
    if (digits.length >= 10) {
      const phoneDigits = digits.slice(0, 10);
      const formatted = `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3)}`;
      setPhoneNumber(formatted);
    } else {
      setError('Could not extract valid phone number from voice input');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome! 👋</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to get started
            </Text>
            {/* Testing Mode Indicator */}
            <Text style={styles.testingMode}>
              🧪 Testing Mode: OTP Skipped
            </Text>
          </View>

          {/* Error Alert */}
          <ErrorAlert message={error} />

          {/* Phone Number Input */}
          <PhoneNumberInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            error={error && !phoneNumber ? 'Phone number is required' : ''}
          />

          {/* Voice Input */}
          <VoiceInputButton
            onTranscriptionComplete={handleVoiceTranscription}
            disabled={loading}
          />

          {/* Continue Button (Skips OTP) */}
          <CustomButton
            title="Continue to Sign Up"
            onPress={handleSendOTP}
            loading={loading}
            disabled={!phoneNumber || loading}
            style={styles.button}
          />

          {/* Info Text */}
          <Text style={styles.infoText}>
            Testing Mode: Skipping OTP verification
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  testingMode: {
    fontSize: 14,
    color: COLORS.warning,
    marginTop: 12,
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 24,
    fontStyle: 'italic',
  },
});

export default PhoneNumberScreen;
