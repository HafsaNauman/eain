/**
 * Splash Screen - EAIN Design
 * Exact color matching with proper opacity
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image,
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
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth status after 2.5 seconds
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
    <View style={styles.container}>
      {/* Gradient Background - Muted teal tones */}
      <LinearGradient
        colors={['#89B5A8', '#99BFB3', '#A8C8BC']}
        locations={[0, 0.5, 1]}
        style={styles.gradientBackground}
      />

      {/* Wave Shape Overlay with Transparency */}
      <Image
        source={require('../../assets/wave-shape.png')}
        style={styles.waveImage}
        resizeMode="cover"
      />

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* EAIN Logo */}
        <Text style={styles.appName}>EAIN</Text>

        {/* Urdu Tagline */}
        <Text style={styles.taglineUrdu}>عورت کی پہچان ، بے سے آغاز</Text>
      </Animated.View>

      {/* Language Selector at Bottom */}
      <Animated.View
        style={[
          styles.bottomContainer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.languageText}>English | اردو</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#89B5A8', // Fallback color
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  waveImage: {
    position: 'absolute',
    width: width,
    height: height,
    opacity: 0.65, // Reduced opacity to let gradient show through
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  appName: {
    fontSize: 68,
    fontWeight: '400',
    color: '#2F5D5D',
    letterSpacing: 10,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  taglineUrdu: {
    fontSize: 16,
    color: '#2F5D5D',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.5,
    lineHeight: 26,
    opacity: 0.9,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    zIndex: 10,
  },
  languageText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default SplashScreen;
