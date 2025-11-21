/**
 * Splash Screen - EAIN Design
 * 
 * Beautiful splash screen with image-based wave shape
 * Matches the EAIN branding exactly
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  Animated, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAccessToken, getUserData } from '../utils/storage';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth status after animation
    setTimeout(() => {
      checkAuthStatus();
    }, 2500);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getAccessToken();
      const userData = await getUserData();

      if (token && userData) {
        navigation.replace('Home');
      } else {
        navigation.replace('PhoneNumber');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      navigation.replace('PhoneNumber');
    }
  };

  return (
    <LinearGradient
      colors={['#7AB8A6', '#8DC4B4', '#A5CFC3']}
      style={styles.container}
    >
      {/* Wave Shape Background Image */}
      <ImageBackground
        source={require('../../assets/wave-shape.png')}
        style={styles.waveImage}
        resizeMode="contain"
        imageStyle={styles.waveImageStyle}
      >
        {/* Main Content Container with Animation */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* EAIN Logo Text */}
          <Text style={styles.appName}>EAIN</Text>

          {/* Urdu Tagline */}
          <Text style={styles.taglineUrdu}>عورت کی پہچان ، بے سے آغاز</Text>
        </Animated.View>

        {/* Bottom Language Selector */}
        <Animated.View
          style={[
            styles.bottomContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.languageText}>English | اردو</Text>
        </Animated.View>
      </ImageBackground>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  waveImage: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveImageStyle: {
    opacity: 0.85,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  appName: {
    fontSize: 72,
    fontWeight: '300',
    color: '#2C5F5D',
    letterSpacing: 8,
    marginBottom: 20,
    textAlign: 'center',
    // If you add custom font, use it here:
    // fontFamily: 'PlayfairDisplay-Regular',
  },
  taglineUrdu: {
    fontSize: 18,
    color: '#2C5F5D',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 1,
    lineHeight: 28,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  languageText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 2,
  },
});

export default SplashScreen;
