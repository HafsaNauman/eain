/**
 * Sign Up Screen
 * 
 * Third step in authentication flow:
 * - User fills registration form
 * - Fields: First Name, Last Name, Email (optional), Password, Gender, Role
 * - Phone number pre-filled (non-editable) from OTP verification
 * - Validates all inputs
 * - Creates user account
 * - Navigates to home on success
 * 
 * Supports voice input for all text fields
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
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import VoiceInputButton from '../components/voice/VoiceInputButton';
import ErrorAlert from '../components/common/ErrorAlert';
import PhoneNumberInput from '../components/phone/PhoneNumberInput';
import { COLORS } from '../constants/colors';
import { validateEmail, validatePassword, validateName } from '../utils/validation';
import { signUp } from '../api/authService';
import { saveTokens, saveUserData } from '../utils/storage';
import { Picker } from '@react-native-picker/picker';

const SignUpScreen = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: '',
    role: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [activeVoiceField, setActiveVoiceField] = useState(null);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = 'First name should only contain letters';
    }

    // Last Name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Last name should only contain letters';
    }

    // Email (optional but must be valid if provided)
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters and include a number';
    }

    // Gender
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    // Role
    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    setGeneralError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sign up with backend
      const result = await signUp({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: phoneNumber,
        email: formData.email.trim() || null,
        password: formData.password,
        gender: formData.gender,
        role: formData.role,
      });

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
        setGeneralError(result.error);
      }
    } catch (err) {
      setGeneralError('Failed to create account. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscription = (transcribedText, field) => {
    // Update the field with transcribed text
    updateField(field, transcribedText);
    setActiveVoiceField(null);
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account 📝</Text>
            <Text style={styles.subtitle}>
              Fill in your details to complete registration
            </Text>
          </View>

          {/* Error Alert */}
          <ErrorAlert message={generalError} />

          {/* Phone Number (Non-editable) */}
          <PhoneNumberInput
            value={phoneNumber.replace('+92', '').replace(/(\d{3})(\d{7})/, '$1 $2')}
            onChangeText={() => {}}
            editable={false}
          />

          {/* First Name */}
          <View>
            <CustomInput
              label="First Name *"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              placeholder="Enter your first name"
              error={errors.firstName}
              autoCapitalize="words"
            />
            <VoiceInputButton
              onTranscriptionComplete={(text) => handleVoiceTranscription(text, 'firstName')}
              disabled={loading}
            />
          </View>

          {/* Last Name */}
          <View>
            <CustomInput
              label="Last Name *"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              placeholder="Enter your last name"
              error={errors.lastName}
              autoCapitalize="words"
            />
            <VoiceInputButton
              onTranscriptionComplete={(text) => handleVoiceTranscription(text, 'lastName')}
              disabled={loading}
            />
          </View>

          {/* Email (Optional) */}
          <View>
            <CustomInput
              label="Email (Optional)"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="your.email@example.com"
              error={errors.email}
              keyboardType="email-address"
            />
            <VoiceInputButton
              onTranscriptionComplete={(text) => handleVoiceTranscription(text, 'email')}
              disabled={loading}
            />
          </View>

          {/* Password */}
          <View>
            <CustomInput
              label="Password *"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              placeholder="Minimum 6 characters, include a number"
              error={errors.password}
              secureTextEntry
            />
            <VoiceInputButton
              onTranscriptionComplete={(text) => handleVoiceTranscription(text, 'password')}
              disabled={loading}
            />
          </View>

          {/* Gender Dropdown */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Gender *</Text>
            <View style={[styles.pickerWrapper, errors.gender && styles.pickerError]}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => updateField('gender', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          {/* Role Dropdown */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Role *</Text>
            <View style={[styles.pickerWrapper, errors.role && styles.pickerError]}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => updateField('role', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Role" value="" />
                <Picker.Item label="Customer" value="customer" />
                <Picker.Item label="Service Provider" value="service_provider" />
                <Picker.Item label="Vendor" value="vendor" />
              </Picker>
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </View>

          {/* Sign Up Button */}
          <CustomButton
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.button}
          />

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Login</Text>
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
    marginBottom: 32,
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
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerError: {
    borderColor: COLORS.error,
  },
  picker: {
    height: 56,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.error,
  },
  button: {
    marginTop: 24,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default SignUpScreen;
