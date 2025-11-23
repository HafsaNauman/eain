/**
 * Login Screen - EAIN Design with i18n
 * 
 * User login with phone number and password
 * - Multi-language support (English/Urdu)
 * - Phone number input (formatted)
 * - Password input with visibility toggle
 * - Social login options
 * - Voice input support
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
import { Ionicons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import PhoneNumberInput from '../components/phone/PhoneNumberInput';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import VoiceInputButton from '../components/voice/VoiceInputButton';
import ErrorAlert from '../components/common/ErrorAlert';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { COLORS } from '../constants/colors';
import { validatePhoneNumber } from '../utils/validation';
import { login } from '../api/authService';
import { saveTokens, saveUserData } from '../utils/storage';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    // Validate phone number
    const fullPhoneNumber = `+92${phoneNumber.replace(/\s/g, '')}`;
    
    if (!validatePhoneNumber(fullPhoneNumber)) {
      setError(t('errors.invalidPhone'));
      return;
    }

    // Validate password
    if (!password) {
      setError(t('errors.passwordRequired'));
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
      setError(t('errors.loginFailed'));
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
      setError(t('errors.voiceInputFailed'));
    }
  };

  const handlePasswordVoiceTranscription = (transcribedText) => {
    setPassword(transcribedText);
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} login clicked`);
    // TODO: Implement social login
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
          {/* Header with Language Switcher */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.appName}>{t('login.appName')}</Text>
              <LanguageSwitcher />
            </View>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          {/* Error Alert */}
          <ErrorAlert message={error} />

          {/* Phone Number Input with Voice */}
          <PhoneNumberInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            error={error && !phoneNumber ? t('errors.phoneRequired') : ''}
          />
          <VoiceInputButton
            onTranscriptionComplete={handlePhoneVoiceTranscription}
            disabled={loading}
          />

          {/* Password Input with Voice */}
          <CustomInput
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.password')}
            error={error && !password ? t('errors.passwordRequired') : ''}
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
          <VoiceInputButton
            onTranscriptionComplete={handlePasswordVoiceTranscription}
            disabled={loading}
          />

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => {
              // TODO: Navigate to forgot password screen
              console.log('Forgot password clicked');
            }}
          >
            <Text style={styles.forgotPasswordText}>
              {t('login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <CustomButton
            title={t('login.loginButton')}
            onPress={handleLogin}
            loading={loading}
            disabled={!phoneNumber || !password || loading}
            style={styles.loginButton}
          />

          {/* Social Login Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('signUp.orContinue')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
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

          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('PhoneNumber')}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              {t('login.dontHave')} <Text style={styles.signupTextBold}>{t('login.signUp')}</Text>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 32,
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
  signupLink: {
    alignItems: 'center',
    marginBottom: 16,
  },
  signupText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signupTextBold: {
    fontWeight: '700',
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
