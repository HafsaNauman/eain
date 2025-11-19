import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import SpeechInputField from '../components/SpeechInputField';
import TextInputField from '../components/TextInputField';
import authService from '../services/auth.service.js';
import { useAuth } from '../context/AuthContext';

const SignupScreen = ({ navigation }) => {
  const { signup } = useAuth();
  
  // Step tracking
  const [step, setStep] = useState(1); // 1: OTP Send, 2: OTP Verify, 3: Complete Signup
  
  // Form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [literacyLevel, setLiteracyLevel] = useState('');
  
  const [loading, setLoading] = useState(false);

  // STEP 1: Send OTP
  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    try {
      setLoading(true);
      await authService.sendOTP(phoneNumber);
      Alert.alert('Success', 'OTP sent to your phone number');
      setStep(2);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOTP(phoneNumber, otpCode);
      Alert.alert('Success', 'OTP verified successfully');
      setStep(3);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Complete Signup
  const handleSignup = async () => {
    // Validation
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!gender.trim() || !preferredLanguage.trim() || !literacyLevel.trim()) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        phone_number: phoneNumber,
        full_name: fullName,
        email: email,
        password: password,
        gender: gender,
        preferred_language: preferredLanguage,
        literacy_level: literacyLevel,
      };

      await signup(userData);
      Alert.alert('Success', 'Account created successfully!');
      // Navigation handled by AuthContext
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Step {step} of 3
        </Text>

        {/* STEP 1: Phone Number */}
        {step === 1 && (
          <>
            <SpeechInputField
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <>
            <Text style={styles.infoText}>
              OTP sent to {phoneNumber}
            </Text>

            <TextInputField
              label="OTP Code"
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.linkText}>← Back to phone number</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3: Complete Registration */}
        {step === 3 && (
          <>
            <SpeechInputField
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />

            <SpeechInputField
              label="Email *"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInputField
              label="Password *"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            <SpeechInputField
              label="Gender *"
              value={gender}
              onChangeText={setGender}
              placeholder="Male/Female/Other"
            />

            <SpeechInputField
              label="Preferred Language *"
              value={preferredLanguage}
              onChangeText={setPreferredLanguage}
              placeholder="e.g., English, Urdu"
            />

            <SpeechInputField
              label="Literacy Level *"
              value={literacyLevel}
              onChangeText={setLiteracyLevel}
              placeholder="Basic/Intermediate/Advanced"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(2)}>
              <Text style={styles.linkText}>← Back to OTP</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default SignupScreen;
