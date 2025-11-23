/**
 * Phone Number Screen
 * 
 * OTP verification ENABLED - Updated Design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/common/CustomButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { COLORS } from '../constants/colors';
import { validatePhoneNumber } from '../utils/validation';
import { sendOTP } from '../api/authService';

const PhoneNumberScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

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

  const handleVoiceInput = () => {
    // Toggle listening state
    setIsListening(!isListening);
    
    // TODO: Implement actual voice recognition
    // This is a placeholder - you'll need to integrate with voice recognition API
    console.log('Voice input triggered');
    
    // Simulate voice input (remove this in production)
    setTimeout(() => {
      setIsListening(false);
      // Example: setPhoneNumber('300 1234567');
    }, 2000);
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as XXX XXXXXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 10)}`;
    }
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    if (error) setError('');
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
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.brandText}>EAIN</Text>
    
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>OTP Verification</Text>
          </View>

          {/* Error Alert */}
          {error ? <ErrorAlert message={error} /> : null}

          {/* Phone Label */}
          <Text style={styles.inputLabel}>Phone Number</Text>

          {/* Phone Number Input with Voice Button */}
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCodeText}>+92</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              placeholder="300 1234567"
              placeholderTextColor={COLORS.placeholder || '#999'}
              keyboardType="phone-pad"
              maxLength={11} // 3 digits + space + 7 digits
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={handleVoiceInput}
              disabled={loading}
            >
              <Ionicons 
                name={isListening ? "mic" : "mic-outline"} 
                size={24} 
                color={isListening ? COLORS.primary : COLORS.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            We will send you a 6-digit verification code
          </Text>

          {/* Send OTP Button */}
          <CustomButton
            title="Send OTP"
            onPress={handleSendOTP}
            loading={loading}
            disabled={!phoneNumber || loading || phoneNumber.replace(/\s/g, '').length < 10}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary || '#036c5f',
    letterSpacing: 2,
  },
  skipText: {
    fontSize: 14,
    color: '#999',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  countryCodeContainer: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  voiceButton: {
    padding: 8,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 24,
    lineHeight: 18,
  },
  button: {
    marginTop: 8,
    color: '#036c5f',
  },
});

export default PhoneNumberScreen;