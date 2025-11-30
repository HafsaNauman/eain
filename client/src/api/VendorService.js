/**
 * Vendor Service - Business Registration & Profile Management
 */

import apiClient from './authService';
import { getAccessToken } from '../utils/storage';

/**
 * Create or update vendor profile
 * POST /api/vendor/profile
 */
// export const createVendorProfile = async (profileData) => {
//   try {
//     const token = await getAccessToken();
    
//     const response = await apiClient.post(
//       '/api/vendor/profile',
//       {
//         vendor_type: profileData.businessType, // 'product' or 'service'
//         business_name_en: profileData.businessName,
//         business_name_ur: profileData.businessNameUrdu || null,
//         description_en: profileData.businessDescription,
//         description_ur: profileData.businessDescriptionUrdu || null,
//         category: profileData.businessCategory,
//         city: profileData.city || null,
//         area: profileData.area || null,
//         location: profileData.location || null,
//         is_female_only: profileData.isFemaleOnly || false,
//         media: profileData.media || null,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Create Vendor Profile Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to create vendor profile',
//     };
//   }
// };
// VendorService.js
export const createVendorProfile = async (profileData) => {
  try {
    const token = await getAccessToken();

    const response = await apiClient.post(
      '/api/vendor/profile',
      profileData, // <-- send as-is (already in backend format)
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Create Vendor Profile Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create vendor profile',
    };
  }
};


/**
 * Get vendor profile
 * GET /api/vendor/profile
 */
export const getVendorProfile = async () => {
  try {
    const token = await getAccessToken();
    
    const response = await apiClient.get('/api/vendor/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Get Vendor Profile Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to get vendor profile',
    };
  }
};

/**
 * Update vendor profile
 * PUT /api/vendor/profile
 */
export const updateVendorProfile = async (updates) => {
  try {
    const token = await getAccessToken();
    
    const response = await apiClient.put('/api/vendor/profile', updates, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Update Vendor Profile Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update vendor profile',
    };
  }
};

/**
 * Create listing
 * POST /api/vendor/listings
 */
export const createListing = async (listingData) => {
  try {
    const token = await getAccessToken();
    
    const response = await apiClient.post('/api/vendor/listings', listingData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Create Listing Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create listing',
    };
  }
};
// VendorService.js
export const updateListing = async (listingId, updates) => {
  try {
    const token = await getAccessToken();
    const response = await apiClient.put(
      `/api/vendor/listings/${listingId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Update Listing Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update listing',
    };
  }
};
// DELETE /api/vendor/listings/:id
export const deleteListing = async (listingId) => {
  try {
    const token = await getAccessToken();
    const response = await apiClient.delete(`/api/vendor/listings/${listingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Delete Listing Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete listing',
    };
  }
};


/**
 * Get vendor listings
 * GET /api/vendor/listings
 */
export const getVendorListings = async () => {
  try {
    const token = await getAccessToken();
    
    const response = await apiClient.get('/api/vendor/listings', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Get Vendor Listings Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to get listings',
    };
  }
};


// /**
//  * Vendor Service - Business Registration & Profile Management
//  */

// import axios from 'axios';
// import API_CONFIG from './config';
// import { getAccessToken } from '../utils/storage';

// /**
//  * Create or update vendor profile
//  * POST /api/vendor/profile
//  */
// export const createVendorProfile = async (profileData) => {
//   try {
//     const token = await getAccessToken();
    
//     console.log('🔑 Access Token:', token);
    
//     if (!token) {
//       return {
//         success: false,
//         error: 'No access token found. Please login again.',
//       };
//     }

//     const response = await axios.post(
//       `${API_CONFIG.BASE_URL}/api/vendor/profile`,
//       profileData,
//       {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     console.log('✅ Vendor profile created:', response.data);
//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('❌ Create Vendor Profile Error:', error.response?.data || error.message);
//     return {
//       success: false,
//       error: error.response?.data?.message || error.message || 'Failed to create vendor profile',
//     };
//   }
// };

// /**
//  * Get vendor profile
//  * GET /api/vendor/profile
//  */
// export const getVendorProfile = async () => {
//   try {
//     const token = await getAccessToken();
    
//     if (!token) {
//       return {
//         success: false,
//         error: 'No access token found',
//       };
//     }
    
//     const response = await axios.get(
//       `${API_CONFIG.BASE_URL}/api/vendor/profile`,
//       {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       }
//     );

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Get Vendor Profile Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to get vendor profile',
//     };
//   }
// };

// /**
//  * Update vendor profile
//  * PUT /api/vendor/profile
//  */
// export const updateVendorProfile = async (updates) => {
//   try {
//     const token = await getAccessToken();
    
//     const response = await axios.put(
//       `${API_CONFIG.BASE_URL}/api/vendor/profile`,
//       updates,
//       {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       }
//     );

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Update Vendor Profile Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to update vendor profile',
//     };
//   } 
// };
// export const createListing = async (listingData) => {
//     try {
//     const token = await getAccessToken();
//     if (!token) {
//    return { success: false, error: 'No access token found. Please login again.' };
//     }

// text
//     const response = await axios.post(
//       `${API_CONFIG.BASE_URL}/api/vendor/listings`,
//         listingData,
//       {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     },
//   }
// );

// return { success: true, data: response.data };
//     } catch (error) {
// console.error('Create Listing Error:', error.response?.data || error.message);
// return {
// success: false,
// error: error.response?.data?.message || error.message || 'Failed to create listing',
// };
// }
// };

// export const getVendorListings = async () => {
// try {
// const token = await getAccessToken();
// if (!token) {
// return { success: false, error: 'No access token found' };
// }

// text
// const response = await axios.get(
//   `${API_CONFIG.BASE_URL}/api/vendor/listings`,
//   {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   }
// );

// return { success: true, data: response.data };
// } catch (error) {
// console.error('Get Vendor Listings Error:', error.response?.data || error.message);
// return {
// success: false,
// error: error.response?.data?.message || error.message || 'Failed to get listings',
// };
// }
// };
/**
 * Vendor Service - Business Registration & Profile Management
 */

/**
 * Splash Screen - Always go to Home
 */
// import React, { useEffect, useRef } from 'react';
// import { View, Text, StyleSheet, Animated } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useTranslation } from 'react-i18next';
// import LanguageSwitcher from '../components/common/LanguageSwitcher';
// import { getAccessToken, getUserData } from '../utils/storage';
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

//       // ✅ ALWAYS go to Home - let ProfileScreen handle the logic
//       navigation.replace('Home');
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
