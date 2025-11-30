// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons, FontAwesome } from '@expo/vector-icons';
// import { useAuth } from '../context/AuthContext';
// import { COLORS } from '../constants/colors';
// import { getVendorProfile } from '../api/VendorService';

// const ProfileScreen = ({ navigation }) => {
//   const { user, logout, isAuthenticated } = useAuth();
//   const [checkingVendor, setCheckingVendor] = useState(false);

//   // ✅ Check if vendor has completed business registration
//   useEffect(() => {
//     const checkVendorStatus = async () => {
//       if (isAuthenticated && user?.role === 'vendor') {
//         setCheckingVendor(true);
//         try {
//           const profileCheck = await getVendorProfile();

//           if (!profileCheck.success) {
//             // No profile = incomplete registration
//             navigation.navigate('BusinessRegistration', {
//               userId: user.user_id,
//               userRole: 'vendor'
//             });
//           } else {
//             // Profile exists = go to dashboard
//             navigation.navigate('VendorDashboard', { 
//               userId: user.user_id,
//               vendorProfile: profileCheck.data.data?.profile || profileCheck.data.profile
//             });
//           }
//         } catch (error) {
//           // Error means no profile = incomplete registration
//           navigation.navigate('BusinessRegistration', {
//             userId: user.user_id,
//             userRole: 'vendor'
//           });
//         } finally {
//           setCheckingVendor(false);
//         }
//       }
//     };

//     checkVendorStatus();
//   }, [isAuthenticated, user, navigation]);

//   const handleLogout = async () => {
//     await logout();
//     navigation.navigate('Home');
//   };

//   // ✅ NOT LOGGED IN: Show Create Account + Login
//   if (!isAuthenticated) {
//     return (
//       <SafeAreaView style={styles.container} edges={['top']}>
//         <View style={styles.centerContent}>
//           <Text style={styles.title}>Welcome!</Text>

//           <TouchableOpacity
//             style={styles.loginBtn}
//             onPress={() => navigation.navigate('Login')}
//           >
//             <Text style={styles.loginText}>Login</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.createBtn}
//             onPress={() => navigation.navigate('PhoneNumber')}
//           >
//             <Text style={styles.createText}>Create Account</Text>
//           </TouchableOpacity>
//         </View>

//         {/* ✅ BOTTOM NAVIGATION */}
//         <View style={styles.bottomNav}>
//           <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Home')}>
//             <Ionicons name="home-outline" size={24} color="#999" />
//             <Text style={styles.navLabel}>Home</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.navBtn}>
//             <Ionicons name="cart-outline" size={24} color="#999" />
//             <Text style={styles.navLabel}>Cart</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.navBtn}>
//             <FontAwesome name="heart-o" size={22} color="#999" />
//             <Text style={styles.navLabel}>Wishlist</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.navBtn}>
//             <Ionicons name="person" size={24} color="#036c5f" />
//             <Text style={[styles.navLabel, { color: '#036c5f', fontWeight: '600' }]}>Profile</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ✅ VENDOR: Show loading while checking/redirecting
//   if (isAuthenticated && user?.role === 'vendor' && checkingVendor) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   // ✅ CUSTOMER: Show Customer Profile
//   return (
//     <SafeAreaView style={styles.authenticatedContainer} edges={['top']}>
//       <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
//         <View style={styles.header}>
//           <View style={styles.avatar}>
//             <Ionicons name="person" size={40} color={COLORS.primary} />
//           </View>
//           <Text style={styles.name}>
//             {user?.first_name} {user?.last_name}
//           </Text>
//           <Text style={styles.email}>{user?.email || user?.phone_number}</Text>
//           <Text style={styles.role}>Role: Customer</Text>
//         </View>

//         <View style={styles.menuSection}>
//           <TouchableOpacity style={styles.menuItem}>
//             <Ionicons name="person-outline" size={24} color="#666" />
//             <Text style={styles.menuText}>Edit Profile</Text>
//             <Ionicons name="chevron-forward" size={20} color="#999" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.menuItem}>
//             <Ionicons name="settings-outline" size={24} color="#666" />
//             <Text style={styles.menuText}>Settings</Text>
//             <Ionicons name="chevron-forward" size={20} color="#999" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.menuItem}>
//             <Ionicons name="help-circle-outline" size={24} color="#666" />
//             <Text style={styles.menuText}>Help & Support</Text>
//             <Ionicons name="chevron-forward" size={20} color="#999" />
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
//           <Ionicons name="log-out-outline" size={24} color="#fff" />
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </ScrollView>

//       {/* ✅ BOTTOM NAVIGATION */}
//       <View style={styles.bottomNav}>
//         <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Home')}>
//           <Ionicons name="home-outline" size={24} color="#999" />
//           <Text style={styles.navLabel}>Home</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navBtn}>
//           <Ionicons name="cart-outline" size={24} color="#999" />
//           <Text style={styles.navLabel}>Cart</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navBtn}>
//           <FontAwesome name="heart-o" size={22} color="#999" />
//           <Text style={styles.navLabel}>Wishlist</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navBtn}>
//           <Ionicons name="person" size={24} color="#036c5f" />
//           <Text style={[styles.navLabel, { color: '#036c5f', fontWeight: '600' }]}>Profile</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   centerContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 24,
//   },
//   authenticatedContainer: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 32,
//     color: COLORS.text,
//   },
//   loginBtn: {
//     backgroundColor: COLORS.primary,
//     padding: 16,
//     borderRadius: 12,
//     width: '100%',
//     marginBottom: 12,
//   },
//   loginText: {
//     color: '#fff',
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   createBtn: {
//     backgroundColor: '#f0f0f0',
//     padding: 16,
//     borderRadius: 12,
//     width: '100%',
//   },
//   createText: {
//     color: COLORS.primary,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   header: {
//     alignItems: 'center',
//     padding: 24,
//     backgroundColor: '#fff',
//     marginBottom: 16,
//   },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#E0F2FE',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   name: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   email: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 4,
//   },
//   role: {
//     fontSize: 12,
//     color: '#999',
//     textTransform: 'capitalize',
//   },
//   menuSection: {
//     backgroundColor: '#fff',
//     marginBottom: 16,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   menuText: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//     marginLeft: 12,
//   },
//   logoutBtn: {
//     flexDirection: 'row',
//     backgroundColor: '#EF4444',
//     margin: 20,
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   logoutText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   bottomNav: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     paddingVertical: 10,
//   },
//   navBtn: {
//     alignItems: 'center',
//   },
//   navLabel: {
//     fontSize: 12,
//     color: '#999',
//     marginTop: 4,
//   },
// });

// export default ProfileScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { getVendorProfile } from '../api/VendorService';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [checkingVendor, setCheckingVendor] = useState(false);

  // ✅ Check vendor status when screen loads
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (isAuthenticated && user?.role === 'vendor') {
        setCheckingVendor(true);
        try {
          const profileCheck = await getVendorProfile();

          if (profileCheck?.success && profileCheck.data) {
            // ✅ Vendor with business → go to dashboard
            navigation.reset({
              index: 0,
              routes: [{
                name: 'VendorDashboard',
                params: {
                  userId: user.user_id,
                  vendorProfile: profileCheck.data.data?.profile || profileCheck.data.profile,
                },
              }],
            });
          } else {
            // ✅ Vendor without business → go to registration
            navigation.reset({
              index: 0,
              routes: [{
                name: 'BusinessRegistration',
                params: { userId: user.user_id, userRole: 'vendor' },
              }],
            });
          }
        } catch (error) {
          // On error, assume needs registration
          navigation.reset({
            index: 0,
            routes: [{
              name: 'BusinessRegistration',
              params: { userId: user.user_id, userRole: 'vendor' },
            }],
          });
        } finally {
          setCheckingVendor(false);
        }
      }
    };

     checkVendorStatus();
  }, [isAuthenticated, user, navigation]);

    const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };


  const handleVendorDashboard = async () => {
    try {
      const profileCheck = await getVendorProfile();
      
      if (profileCheck.success && profileCheck.data) {
        navigation.navigate('VendorDashboard', {
          userId: user.user_id,
          vendorProfile: profileCheck.data.data?.profile || profileCheck.data.profile
        });
      } else {
        navigation.navigate('BusinessRegistration', {
          userId: user.user_id,
          userRole: 'vendor'
        });
      }
    } catch (error) {
      console.error('Error navigating to dashboard:', error);
      navigation.navigate('BusinessRegistration', {
        userId: user.user_id,
        userRole: 'vendor'
      });
    }
  };

  // ✅ NOT LOGGED IN: Show Login/Create Account
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Login or create an account</Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('PhoneNumber')}
          >
            <Text style={styles.createText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.navBtn}>
            <Ionicons name="home-outline" size={24} color="#999" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="cart-outline" size={24} color="#999" />
            <Text style={styles.navLabel}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="heart-outline" size={24} color="#999" />
            <Text style={styles.navLabel}>Wishlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="person" size={24} color={COLORS.primary} />
            <Text style={[styles.navLabel, { color: COLORS.primary }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // // ✅ VENDOR CHECKING: Show loading
  // if (checkingVendor) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" color={COLORS.primary} />
  //       <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>Loading...</Text>
  //     </View>
  //   );
  // }
  // ✅ VENDOR: we are redirecting; show loader while deciding
if (isAuthenticated && user?.role === 'vendor' && checkingVendor) {
  return (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text>Checking your business status...</Text>
    </View>
  );
}

  // ✅ LOGGED IN: Show Profile (Customer or Vendor)
  return (
    <SafeAreaView style={styles.authenticatedContainer} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.email}>{user?.email || user?.phone_number}</Text>
          <Text style={styles.role}>Role: {user?.role}</Text>
        </View>

        <View style={styles.menuSection}>
          {user?.role === 'vendor' && (
            <TouchableOpacity style={styles.menuItem} onPress={handleVendorDashboard}>
              <Ionicons name="storefront" size={24} color={COLORS.primary} />
              <Text style={styles.menuText}>Vendor Dashboard</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.navBtn}>
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Ionicons name="cart-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Ionicons name="heart-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>Wishlist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Ionicons name="person" size={24} color={COLORS.primary} />
          <Text style={[styles.navLabel, { color: COLORS.primary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  authenticatedContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  loginText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  createBtn: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  createText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  role: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
  },
  navBtn: {
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default ProfileScreen;
