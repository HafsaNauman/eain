/**
 * Language Switcher Component
 * Toggle between English and Urdu
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';

const LanguageSwitcher = ({ style }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggleLanguage}
      activeOpacity={0.7}
    >
      <Text style={[styles.lang, currentLang === 'en' && styles.activeLang]}>
        English
      </Text>
      <Text style={styles.separator}>|</Text>
      <Text style={[styles.lang, currentLang === 'ur' && styles.activeLang]}>
        اردو
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  lang: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
    letterSpacing: 2,
  },
  activeLang: {
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  separator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: COLORS.white,
  },
});

export default LanguageSwitcher;
