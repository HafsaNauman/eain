/**
 * Phone Number Screen with i18n
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
import { useTranslation } from 'react-i18next';
import PhoneNumberInput from '../components/phone/PhoneNumberInput';
import CustomButton from '../components/common/CustomButton';
import VoiceInputButton from '../components/voice/VoiceInputButton';
import ErrorAlert from '../components/common/ErrorAlert';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { COLORS } from '../constants/colors';
import { validatePhoneNumber } from '../utils/validation';
import { sendOTP } from '../api/authService';

const PhoneNumberScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    setError('');
    const fullPhoneNumber = `+92${phoneNumber.replace(/\s/g, '')}`;
    
    if (!validatePhoneNumber(fullPhoneNumber)) {
      setError(t('errors.invalidPhone'));
      return;
    }

    setLoading(true);

    try {
      const result = await sendOTP(fullPhoneNumber);
      if (result.success) {
        navigation.navigate('OTP', { phoneNumber: fullPhoneNumber });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(t('errors.otpSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscription = (transcribedText) => {
    const digits = transcribedText.replace(/\D/g, '');
    
    if (digits.length >= 10) {
      const phoneDigits = digits.slice(0, 10);
      const formatted = `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3)}`;
      setPhoneNumber(formatted);
    } else {
      setError(t('errors.voiceInputFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.languageSwitcherContainer}>
        <LanguageSwitcher />
      </View>
      
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
            <Text style={styles.title}>{t('phoneNumber.title')}</Text>
            <Text style={styles.subtitle}>{t('phoneNumber.subtitle')}</Text>
          </View>

          <ErrorAlert message={error} />

          <PhoneNumberInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            error={error && !phoneNumber ? t('errors.phoneRequired') : ''}
          />

          <VoiceInputButton
            onTranscriptionComplete={handleVoiceTranscription}
            disabled={loading}
          />

          <CustomButton
            title={t('phoneNumber.sendOTP')}
            onPress={handleSendOTP}
            loading={loading}
            disabled={!phoneNumber || loading}
            style={styles.button}
          />

          <Text style={styles.infoText}>
            {t('phoneNumber.infoText')}
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
  languageSwitcherContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
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
