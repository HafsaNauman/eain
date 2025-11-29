// /**
//  * Splash Screen - EAIN Design with i18n
//  */

// import React, { useEffect, useRef } from 'react';
// import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useTranslation } from 'react-i18next';
// import LanguageSwitcher from '../components/common/LanguageSwitcher';
// import { getAccessToken, getUserData } from '../utils/storage';
// import { COLORS } from '../constants/colors';

// const { width, height } = Dimensions.get('window');

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

//       if (token && userData) {
//         navigation.replace('Home');
//       } else {
//         navigation.replace('PhoneNumber');
//       }
//     } catch (error) {
//       console.error('Error checking auth status:', error);
//       navigation.replace('PhoneNumber');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <LinearGradient
//         colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
//         locations={[0, 0.5, 1]}
//         style={styles.gradientBackground}
//       />

//       <Image
//         source={require('../../assets/wave-shape.png')}
//         style={styles.waveImage}
//         resizeMode="cover"
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

//       <Animated.View
//         style={[
//           styles.bottomContainer,
//           { opacity: fadeAnim }
//         ]}
//       >
//         <LanguageSwitcher />
//       </Animated.View>
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
//   waveImage: {
//     position: 'absolute',
//     width: width,
//     height: height,
//     opacity: 0.65,
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


/**
 * Splash Screen - Proper Role-Based Navigation
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { getAccessToken, getUserData } from '../utils/storage';
import { getVendorProfile } from '../api/VendorService';
import { COLORS } from '../constants/colors';

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

    setTimeout(() => {
      checkAuthStatus();
    }, 2500);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getAccessToken();
      const userData = await getUserData();

      console.log('🔍 Splash check:', { token: !!token, userData });

      if (token && userData) {
        // User is authenticated - check role
        if (userData.role === 'vendor') {
          // Check if vendor has completed registration
          try {
            const profileCheck = await getVendorProfile();
            if (profileCheck.success) {
              // Vendor with profile → Dashboard
              navigation.replace('VendorDashboard', {
                userId: userData.user_id,
                vendorProfile: profileCheck.data.data?.profile || profileCheck.data.profile
              });
            } else {
              // Vendor without profile → Business Registration
              navigation.replace('BusinessRegistration', {
                userId: userData.user_id,
                userRole: 'vendor'
              });
            }
          } catch (error) {
            // Error getting profile → Business Registration
            navigation.replace('BusinessRegistration', {
              userId: userData.user_id,
              userRole: 'vendor'
            });
          }
        } else {
          // Customer → Home
          navigation.replace('Home');
        }
      } else {
        // Not authenticated → Home (guest mode)
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      navigation.replace('Home');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
        style={styles.gradientBackground}
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

      <View style={styles.bottomContainer}>
        <LanguageSwitcher />
      </View>
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
