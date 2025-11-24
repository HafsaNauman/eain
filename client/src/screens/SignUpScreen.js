/**
 * Sign Up Screen - EAIN Design with i18n
 * Inline voice input icons
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import ErrorAlert from '../components/common/ErrorAlert';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { COLORS } from '../constants/colors';
import { validateEmail, validatePassword, validateName } from '../utils/validation';
import { signUp } from '../api/authService';
import { saveTokens, saveUserData } from '../utils/storage';
import { startRecording, stopRecording } from '../utils/audioRecorder';
import { transcribeAudio } from '../api/sttService';

const SignUpScreen = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  const { t } = useTranslation();
  
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
  const [showPassword, setShowPassword] = useState(false);
  const [recordingField, setRecordingField] = useState(null);
  const [recording, setRecording] = useState(null);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    setGeneralError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('errors.firstNameRequired');
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = t('errors.invalidName');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('errors.lastNameRequired');
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = t('errors.invalidName');
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired');
    } else if (!validatePassword(formData.password)) {
      newErrors.password = t('errors.invalidPassword');
    }

    if (!formData.gender) {
      newErrors.gender = t('errors.genderRequired');
    }

    if (!formData.role) {
      newErrors.role = t('errors.roleRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
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
        const { accessToken, refreshToken, user } = result.data.data;
        await saveTokens(accessToken, refreshToken);
        await saveUserData(user);

        if (formData.role === 'vendor' || formData.role === 'service_provider') {
          navigation.navigate('BusinessRegistration', {
            userId: user.id,
            userRole: formData.role,
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      } else {
        setGeneralError(result.error);
      }
    } catch (err) {
      setGeneralError(t('errors.signupFailed'));
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async (field) => {
    if (recordingField === field) {
      await stopVoiceRecording(field);
    } else {
      await startVoiceRecording(field);
    }
  };

  const startVoiceRecording = async (field) => {
    try {
      const newRecording = await startRecording();
      setRecording(newRecording);
      setRecordingField(field);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopVoiceRecording = async (field) => {
    try {
      setRecordingField(null);
      const audioUri = await stopRecording(recording);
      
      const result = await transcribeAudio(audioUri, {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
        languageCode: 'en-US',
      });

      if (result.success) {
        const transcribedText = 
          result.data?.data?.transcription ||
          result.data?.transcription ||
          result.data?.text ||
          '';
        
        if (transcribedText && transcribedText.trim()) {
          updateField(field, transcribedText.trim());
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} login clicked`);
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
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.appName}>{t('signUp.appName')}</Text>
              <LanguageSwitcher />
            </View>
            <Text style={styles.title}>{t('signUp.title')}</Text>
          </View>

          {generalError ? <ErrorAlert message={generalError} /> : null}

          {/* First Name with Inline Mic */}
          <CustomInput
            value={formData.firstName}
            onChangeText={(text) => updateField('firstName', text)}
            placeholder={t('signUp.firstName')}
            error={errors.firstName}
            autoCapitalize="words"
            rightIcon={
              <TouchableOpacity onPress={() => handleVoiceInput('firstName')}>
                <Ionicons 
                  name={recordingField === 'firstName' ? 'mic' : 'mic-outline'} 
                  size={20} 
                  color={recordingField === 'firstName' ? COLORS.error : COLORS.textSecondary} 
                />
              </TouchableOpacity>
            }
          />

          {/* Last Name with Inline Mic */}
          <CustomInput
            value={formData.lastName}
            onChangeText={(text) => updateField('lastName', text)}
            placeholder={t('signUp.lastName')}
            error={errors.lastName}
            autoCapitalize="words"
            rightIcon={
              <TouchableOpacity onPress={() => handleVoiceInput('lastName')}>
                <Ionicons 
                  name={recordingField === 'lastName' ? 'mic' : 'mic-outline'} 
                  size={20} 
                  color={recordingField === 'lastName' ? COLORS.error : COLORS.textSecondary} 
                />
              </TouchableOpacity>
            }
          />

          {/* Email */}
          <CustomInput
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder={t('signUp.email')}
            error={errors.email}
            keyboardType="email-address"
          />

          {/* Password */}
          <CustomInput
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            placeholder={t('signUp.password')}
            error={errors.password}
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? 'eye' : 'eye-off'} 
                  size={20} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            }
          />

          {/* Gender Dropdown */}
          <View style={styles.pickerContainer}>
            <View style={[styles.pickerWrapper, errors.gender && styles.pickerError]}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => updateField('gender', value)}
                style={styles.picker}
              >
                <Picker.Item label={t('signUp.genderPlaceholder')} value="" color={COLORS.placeholder} />
                <Picker.Item label={t('signUp.male')} value="male" />
                <Picker.Item label={t('signUp.female')} value="female" />
              </Picker>
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          {/* Role Dropdown */}
          <View style={styles.pickerContainer}>
            <View style={[styles.pickerWrapper, errors.role && styles.pickerError]}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => updateField('role', value)}
                style={styles.picker}
              >
                <Picker.Item label={t('signUp.rolePlaceholder')} value="" color={COLORS.placeholder} />
                <Picker.Item label={t('signUp.customer')} value="customer" />
                <Picker.Item label={t('signUp.serviceProvider')} value="service_provider" />
                <Picker.Item label={t('signUp.vendor')} value="vendor" />
              </Picker>
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </View>

          <Text style={styles.termsText}>
            {t('signUp.terms', { action: t('signUp.register') })}
          </Text>

          <CustomButton
            title={t('signUp.createAccount')}
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.createButton}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('signUp.orContinue')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Google')}
            >
              <AntDesign name="google" size={24} color="#DB4437" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Apple')}
            >
              <AntDesign name="apple1" size={26} color="#000000" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Facebook')}
            >
              <FontAwesome name="facebook" size={26} color="#1877F2" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              {t('signUp.alreadyHave')} <Text style={styles.loginTextBold}>{t('signUp.login')}</Text>
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
    backgroundColor: COLORS.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerWrapper: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
    justifyContent: 'center',
  },
  pickerError: {
    borderColor: COLORS.error,
  },
  picker: {
    height: 56,
    color: COLORS.text,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 4,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'left',
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 18,
  },
  createButton: {
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginHorizontal: 10,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 24,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    fontWeight: '700',
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
