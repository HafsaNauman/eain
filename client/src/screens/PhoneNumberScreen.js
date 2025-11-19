/**
 * Phone Number Screen
 * 
 * First step in authentication flow:
 * - User enters phone number
 * - Format: +92 XXX XXXXXXX
 * - Validates format
 * - Sends OTP to phone number
 * - Navigates to OTP verification
 * 
 * Supports voice input for phone number
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import PhoneNumberInput from '../components/phone/PhoneNumberInput';
import CustomButton from '../components/common/CustomButton';
import VoiceInputButton from '../components/voice/VoiceInputButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { COLORS } from '../constants/colors';
import { validatePhoneNumber } from '../utils/validation';
import { parsePhoneNumber } from '../utils/formatters';
import { sendOTP } from '../api/authService';

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

    try {
      // Send OTP request to backend
      const result = await sendOTP(fullPhoneNumber);

      if (result.success) {
        // Navigate to OTP verification screen
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
  };

  const handleVoiceTranscription = (transcribedText) => {
    // Extract digits from transcribed text
    const digits = transcribedText.replace(/\D/g, '');
    
    // Format as phone number
    if (digits.length >= 10) {
      const phoneDigits = digits.slice(0, 10);
      const formatted = `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3)}`;
      setPhoneNumber(formatted);
    } else {
      setError('Could not extract valid phone number from voice input');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome! 👋</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to get started
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

          {/* Send OTP Button */}
          <CustomButton
            title="Send OTP"
            onPress={handleSendOTP}
            loading={loading}
            disabled={!phoneNumber || loading}
            style={styles.button}
          />

          {/* Info Text */}
          <Text style={styles.infoText}>
            You will receive a 6-digit verification code
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
  button: {
    marginTop: 24,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 24,
  },
});

export default PhoneNumberScreen;
