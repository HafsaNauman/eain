import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { getVendorProfile } from '../api/VendorService';

const ProfileScreen = ({ navigation }) => {
  const { i18n, t } = useTranslation();
  const isUrdu = i18n.language === 'ur';
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
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>{t('login.loginButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('PhoneNumber')}
          >
            <Text style={styles.createText}>{t('signUp.createAccount')}</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.navBtn}>
            <Ionicons name="home-outline" size={24} color="#999" />
            <Text style={styles.navLabel}>{t('homeScreen.home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="cart-outline" size={24} color="#999" />
            <Text style={styles.navLabel}>{t('homeScreen.orders')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="heart-outline" size={24} color="#999" />
            <Text style={styles.navLabel}>{t('homeScreen.wishlist')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="person" size={24} color={COLORS.primary} />
            <Text style={[styles.navLabel, { color: COLORS.primary }]}>
              {t('homeScreen.profile')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ VENDOR CHECKING: Show loading
  if (isAuthenticated && user?.role === 'vendor' && checkingVendor) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          {t('common.loading')}
        </Text>
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
          <Text style={styles.role}>
            {t('home.role')}: {user?.role}
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('home.name')}</Text>
                <Text style={styles.infoValue}>
                  {user?.first_name} {user?.last_name}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('home.phone')}</Text>
                <Text style={styles.infoValue}>{user?.phone_number}</Text>
              </View>
            </View>

            {user?.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('home.email')}</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="male-female-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('home.gender')}</Text>
                <Text style={styles.infoValue}>{user?.gender}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('home.role')}</Text>
                <Text style={styles.infoValue}>{user?.role}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountSettings')}</Text>

          <View style={styles.menuSection}>
            {user?.role === 'vendor' && (
              <TouchableOpacity style={styles.menuItem} onPress={handleVendorDashboard}>
                <Ionicons name="storefront" size={24} color={COLORS.primary} />
                <Text style={styles.menuText}>{t('vendorDashboard.title')}</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={24} color="#333" />
              <Text style={styles.menuText}>{t('profile.editProfile')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="lock-closed-outline" size={24} color="#333" />
              <Text style={styles.menuText}>{t('profile.changePassword')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={24} color="#333" />
              <Text style={styles.menuText}>{t('supportInfo.title')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {/* Language Selection */}
            <View style={styles.menuItem}>
              <Ionicons name="language-outline" size={24} color="#333" />
              <Text style={styles.menuText}>{t('profile.language')}</Text>
              <View style={styles.languageButtons}>
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    i18n.language === 'en' && styles.langButtonActive,
                  ]}
                  onPress={() => i18n.changeLanguage('en')}
                >
                  <Text
                    style={[
                      styles.langButtonText,
                      i18n.language === 'en' && styles.langButtonTextActive,
                    ]}
                  >
                    {t('profile.english')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    i18n.language === 'ur' && styles.langButtonActive,
                  ]}
                  onPress={() => i18n.changeLanguage('ur')}
                >
                  <Text
                    style={[
                      styles.langButtonText,
                      i18n.language === 'ur' && styles.langButtonTextActive,
                    ]}
                  >
                    {t('profile.urdu')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>{t('profile.version')} 1.0.0</Text>
      </ScrollView>

      {/* ✅ BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.navBtn}>
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>{t('homeScreen.home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyOrders')}
          style={styles.navBtn}
        >
          <Ionicons name="receipt-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>{t('homeScreen.orders')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Ionicons name="heart-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>{t('homeScreen.wishlist')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Ionicons name="person" size={24} color={COLORS.primary} />
          <Text style={[styles.navLabel, { color: COLORS.primary }]}>
            {t('homeScreen.profile')}
          </Text>
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
    textAlign: 'center',
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
    fontSize: 16,
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
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: '#fff',
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
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  langButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  langButtonTextActive: {
    color: '#fff',
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
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
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
