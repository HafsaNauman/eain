/**
 * Login Screen - EAIN Design with i18n
 * Password without voice input
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import ErrorAlert from '../components/common/ErrorAlert';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { COLORS } from '../constants/colors';
import { validatePhoneNumber } from '../utils/validation';
import { login } from '../api/authService';
import { saveTokens, saveUserData } from '../utils/storage';
import { startRecording, stopRecording } from '../utils/audioRecorder';
import { transcribeAudio } from '../api/sttService';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordingField, setRecordingField] = useState(null);
  const [recording, setRecording] = useState(null);

  const handleLogin = async () => {
    setError('');

    const fullPhoneNumber = `+92${phoneNumber.replace(/\s/g, '')}`;
    
    if (!validatePhoneNumber(fullPhoneNumber)) {
      setError(t('errors.invalidPhone'));
      return;
    }

    if (!password) {
      setError(t('errors.passwordRequired'));
      return;
    }

    setLoading(true);

    try {
      const result = await login(fullPhoneNumber, password);

      if (result.success) {
        const { accessToken, refreshToken, user } = result.data.data;
        await saveTokens(accessToken, refreshToken);
        await saveUserData(user);

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
          if (field === 'phoneNumber') {
            const digits = transcribedText.replace(/\D/g, '');
            if (digits.length >= 10) {
              const phoneDigits = digits.slice(0, 10);
              const formatted = `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3)}`;
              setPhoneNumber(formatted);
            }
          }
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
              <Text style={styles.appName}>{t('login.appName')}</Text>
              <LanguageSwitcher />
            </View>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          <ErrorAlert message={error} />

          {/* Phone Number Label */}
          <Text style={styles.label}>{t('login.phoneNumber')}</Text>

          {/* Phone Number Input Container with Inline Mic */}
          <View style={[
            styles.phoneInputContainer, 
            error && !phoneNumber && styles.inputError
          ]}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefix}>+92</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="300 1234567"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="phone-pad"
              maxLength={11}
            />
            <TouchableOpacity 
              style={styles.micIcon}
              onPress={() => handleVoiceInput('phoneNumber')}
            >
              <Ionicons 
                name={recordingField === 'phoneNumber' ? 'mic' : 'mic-outline'} 
                size={20} 
                color={recordingField === 'phoneNumber' ? COLORS.error : COLORS.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          {error && !phoneNumber && (
            <Text style={styles.errorText}>{t('errors.phoneRequired')}</Text>
          )}

          {/* Password Input - Only Eye Icon, No Mic */}
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

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => console.log('Forgot password clicked')}
          >
            <Text style={styles.forgotPasswordText}>
              {t('login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <CustomButton
            title={t('login.loginButton')}
            onPress={handleLogin}
            loading={loading}
            disabled={!phoneNumber || !password || loading}
            style={styles.loginButton}
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    marginBottom: 4,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  prefixContainer: {
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    marginRight: 12,
  },
  prefix: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  micIcon: {
    padding: 8,
    marginLeft: 8,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 4,
    marginBottom: 12,
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
