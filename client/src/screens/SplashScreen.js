
//  Splash Screen - EAIN Design with i18n
 

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
// import { getAccessToken, getUserData } from '../utils/storage';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
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
      const timer = setTimeout(() => {
      // ✅ ALWAYS go to Home after splash
      navigation.replace('Home');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);


  //   setTimeout(() => {
  //     checkAuthStatus();
  //   }, 2500);
  // }, []);

  // const checkAuthStatus = async () => {
  //   try {
  //     const token = await getAccessToken();
  //     const userData = await getUserData();

  //     if (token && userData) {
  //       navigation.replace('Home');
  //     } else {
  //       navigation.replace('PhoneNumber');
  //     }
  //   } catch (error) {
  //     console.error('Error checking auth status:', error);
  //     navigation.replace('PhoneNumber');
  //   }
  // };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
        locations={[0, 0.5, 1]}
        style={styles.gradientBackground}
      />

      <Image
        source={require('../../assets/wave-shape.png')}
        style={styles.waveImage}
        resizeMode="cover"
      />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>{t('splash.appName')}</Text>
        <Text style={styles.taglineUrdu}>{t('splash.tagline')}</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomContainer,
          { opacity: fadeAnim }
        ]}
      >
        <LanguageSwitcher />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gradientStart,
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
    opacity: 0.65,
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
    color: COLORS.primaryDark,
    letterSpacing: 10,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  taglineUrdu: {
    fontSize: 16,
    color: COLORS.primaryDark,
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
});

export default SplashScreen;


/**
 * Splash Screen - Proper Role-Based Navigation
 */

/**
 * Splash Screen - Proper Role-Based Navigation
 */
/**
 * Splash Screen - Proper Role-Based Navigation
 */
/**
 * Splash Screen - Proper Role-Based Navigation
 */
// import React, { useEffect, useRef } from 'react';
// import { View, Text, StyleSheet, Animated } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useTranslation } from 'react-i18next';
// import LanguageSwitcher from '../components/common/LanguageSwitcher';
// import { getAccessToken, getUserData } from '../utils/storage';
// import { getVendorProfile } from '../api/VendorService';
// import { COLORS } from '../constants/colors';

// const SplashScreen = ({ navigation }) => {
//   const { t } = useTranslation();
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.8)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1200,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         tension: 20,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     setTimeout(() => {
//       checkAuthStatus();
//     }, 2500);
//   }, []);

//   const checkAuthStatus = async () => {
//     try {
//       const token = await getAccessToken();
//       const userData = await getUserData();

//       console.log('🔍 Splash check:', { token: !!token, userData });

//       // ✅ If no token or userData, go to Home
//       if (!token || !userData) {
//         console.log('❌ No auth data, going to Home');
//         navigation.replace('Home');
//         return;
//       }

//       // ✅ If CUSTOMER, go to Home
//       if (userData.role !== 'vendor') {
//         console.log('✅ Customer user, going to Home');
//         navigation.replace('Home');
//         return;
//       }

//       // ✅ If VENDOR, check profile
//       console.log('🔍 Checking vendor profile...');
//       let profileCheck;
//       try {
//         profileCheck = await getVendorProfile();
//       } catch (profileError) {
//         // ✅ Error thrown = token expired or invalid
//         console.error('❌ Profile check error (401):', profileError.message);
        
//         const AsyncStorage = require('@react-native-async-storage/async-storage').default;
//         await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
//         console.log('🗑️ Cleared auth data, going to Home');
        
//         navigation.replace('Home');
//         return;
//       }

//       // ✅ No error thrown, check success
//       if (profileCheck && profileCheck.success && profileCheck.data) {
//         console.log('✅ Vendor has profile, going to Dashboard');
//         navigation.replace('VendorDashboard', {
//           userId: userData.user_id,
//           vendorProfile: profileCheck.data.data?.profile || profileCheck.data.profile
//         });
//       } else {
//         console.log('⚠️ Profile incomplete, going to BusinessReg');
//         navigation.replace('BusinessRegistration', {
//           userId: userData.user_id,
//           userRole: 'vendor'
//         });
//       }
//     } catch (error) {
//       console.error('❌ Splash error:', error);
//       navigation.replace('Home');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <LinearGradient
//         colors={[COLORS.gradientStart, COLORS.gradientEnd]}
//         style={styles.gradientBackground}
//       />
//       <Animated.View
//         style={[
//           styles.contentContainer,
//           {
//             opacity: fadeAnim,
//             transform: [{ scale: scaleAnim }],
//           },
//         ]}
//       >
//         <Text style={styles.appName}>{t('splash.appName')}</Text>
//         <Text style={styles.taglineUrdu}>{t('splash.tagline')}</Text>
//       </Animated.View>

//       <View style={styles.bottomContainer}>
//         <LanguageSwitcher />
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.gradientStart,
//   },
//   gradientBackground: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//   },
//   contentContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 40,
//     zIndex: 10,
//   },
//   appName: {
//     fontSize: 68,    
//     fontWeight: '400',
//     color: COLORS.primaryDark,
//     letterSpacing: 10,
//     marginBottom: 16,
//     textAlign: 'center',
//     textShadowColor: 'rgba(255, 255, 255, 0.4)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   taglineUrdu: {
//     fontSize: 16,
//     color: COLORS.primaryDark,
//     textAlign: 'center',
//     fontWeight: '400',
//     letterSpacing: 0.5,
//     lineHeight: 26,
//     opacity: 0.9,
//   },
//   bottomContainer: {
//     position: 'absolute',
//     bottom: 50,
//     alignSelf: 'center',
//     zIndex: 10,
//   },
// });

// export default SplashScreen;
