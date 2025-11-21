/**
 * Login Screen
 * 
 * User login with phone number and password
 * - Phone number input (formatted)
 * - Password input
 * - Login button
 * - Link to sign up
 * 
 * Supports voice input for both fields
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import PhoneNumberInput from '../components/phone/PhoneNumberInput';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import VoiceInputButton from '../components/voice/VoiceInputButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { COLORS } from '../constants/colors';
import { validatePhoneNumber } from '../utils/validation';
import { parsePhoneNumber } from '../utils/formatters';
import { login } from '../api/authService';
import { saveTokens, saveUserData } from '../utils/storage';

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    // Validate phone number
    const fullPhoneNumber = `+92${phoneNumber.replace(/\s/g, '')}`;
    
    if (!validatePhoneNumber(fullPhoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    // Validate password
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      // Login with backend
      const result = await login(fullPhoneNumber, password);

      if (result.success) {
        // Save tokens and user data
        const { accessToken, refreshToken, user } = result.data.data;
        await saveTokens(accessToken, refreshToken);
        await saveUserData(user);

        // Navigate to home
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVoiceTranscription = (transcribedText) => {
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

  const handlePasswordVoiceTranscription = (transcribedText) => {
    setPassword(transcribedText);
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
            <Text style={styles.title}>Welcome Back! 👋</Text>
            <Text style={styles.subtitle}>
              Login to your account to continue
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
          <VoiceInputButton
            onTranscriptionComplete={handlePhoneVoiceTranscription}
            disabled={loading}
          />

          {/* Password Input */}
          <CustomInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            error={error && !password ? 'Password is required' : ''}
            secureTextEntry
          />
          <VoiceInputButton
            onTranscriptionComplete={handlePasswordVoiceTranscription}
            disabled={loading}
          />

          {/* Login Button */}
          <CustomButton
            title="Login"
            onPress={handleLogin}
            loading={loading}
            disabled={!phoneNumber || !password || loading}
            style={styles.button}
          />

          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('PhoneNumber')}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
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
  signupLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signupTextBold: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default LoginScreen;
