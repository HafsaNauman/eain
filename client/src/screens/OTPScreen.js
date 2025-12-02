/**
 * OTP Verification Screen
 * 
 * Second step in authentication flow:
 * - User enters 6-digit OTP code
 * - Validates OTP with backend
 * - On success, navigates to signup
 * - Shows resend OTP option
 * 
 * Supports voice input for OTP
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import CustomButton from '../components/common/CustomButton';
import VoiceInputButton from '../components/voice/VoiceInputButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { COLORS } from '../constants/colors';
import { validateOTP } from '../utils/validation';
import { verifyOTP, sendOTP } from '../api/authService';

const OTPScreen = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Refs for OTP inputs
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOTPChange = (text, index) => {
    // Only allow digits
    const digit = text.replace(/\D/g, '');

    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1); // Only take last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setError('');

    // Combine OTP digits
    const otpCode = otp.join('');

    // Validate OTP
    if (!validateOTP(otpCode)) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP with backend
      const result = await verifyOTP(phoneNumber, otpCode);

      if (result.success) {
        // Navigate to signup screen
        navigation.navigate('SignUp', {
          phoneNumber: phoneNumber,
        });
      } else {
        setError(result.error);
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
      console.error('Verify OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await sendOTP(phoneNumber);

      if (result.success) {
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscription = (transcribedText) => {
    // Extract 6 digits from transcribed text
    const digits = transcribedText.replace(/\D/g, '').slice(0, 6);

    if (digits.length === 6) {
      const newOtp = digits.split('');
      setOtp(newOtp);
    } else {
      setError('Could not extract valid OTP from voice input');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verification Code </Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </Text>
        </View>

        {/* Error Alert */}
        <ErrorAlert message={error} />

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                error && styles.otpInputError,
              ]}
              value={digit}
              onChangeText={(text) => handleOTPChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Voice Input */}
        {/* <VoiceInputButton
          onTranscriptionComplete={handleVoiceTranscription}
          disabled={loading}
        />  */}

        {/* Verify Button */}
        <CustomButton
          title="Verify & Continue"
          onPress={handleVerifyOTP}
          loading={loading}
          disabled={otp.join('').length !== 6 || loading}
          style={styles.button}
        />

        {/* Resend OTP */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend code in {resendTimer}s
            </Text>
          )}
        </View>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Change Phone Number</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    backgroundColor: COLORS.inputBackground,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  otpInputError: {
    borderColor: COLORS.error,
  },
  button: {
    marginTop: 24,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 32,
  },
  backText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default OTPScreen;
