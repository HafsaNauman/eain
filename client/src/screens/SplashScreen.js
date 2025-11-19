/**
 * Splash Screen
 * 
 * Initial screen shown when app launches
 * - Displays app logo/branding
 * - Checks authentication status
 * - Navigates to appropriate screen
 */

import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { getAccessToken, getUserData } from '../utils/storage';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Wait 2 seconds to show splash screen
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if user is logged in
      const token = await getAccessToken();
      const userData = await getUserData();

      if (token && userData) {
        // User is logged in, go to home
        navigation.replace('Home');
      } else {
        // User not logged in, go to phone number entry
        navigation.replace('PhoneNumber');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      navigation.replace('PhoneNumber');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>📱</Text>
        <Text style={styles.appName}>Mobile App</Text>
        <Text style={styles.tagline}>Your Tagline Here</Text>
      </View>
      
      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.6,
  },
});

export default SplashScreen;
