/**
 * Vendor Dashboard Screen
 * Profile-style layout for vendors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import { getVendorListings, getVendorProfile, updateVendorProfile } from '../api/VendorService';
import { useAuth } from '../context/AuthContext';

const VendorDashboardScreen = ({ route, navigation }) => {
  const { vendorProfile: initialProfile, businessData, userId, userRole } = route.params || {};
  const [profile, setProfile] = useState(initialProfile || businessData || {});
  const { i18n, t } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading vendor data...');

      // Load vendor profile
      const profileResult = await getVendorProfile();
      if (profileResult.success) {
        const profileData = profileResult.data.data?.profile || profileResult.data.profile;
        setProfile(profileData);
        console.log('✅ Profile loaded:', profileData);
      }

      // Load listings
      const listingsResult = await getVendorListings();
      if (listingsResult.success) {
        const listings = listingsResult.data.data?.listings || listingsResult.data.listings || [];
        console.log('✅ Loaded listings:', listings.length);

        setRecentProducts(listings.slice(0, 5));
        setStats(prev => ({
          ...prev,
          totalProducts: listings.length,
        }));
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (route?.params?.refreshListings) {
      console.log('🔄 Refresh flag detected, reloading...');
      loadDashboardData();
      navigation.setParams({ refreshListings: false });
    }
  }, [route?.params?.refreshListings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Profile' }],
            });
          },
        },
      ]
    );
  };

  const handleSwitchAccount = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Profile' }],
    });
  };

  const handleEditLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          t('businessReg.alerts.permissionDenied'),
          t('businessReg.alerts.permissionMessage')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingLogo(true);

        const updateResult = await updateVendorProfile({
          media: {
            logo_url: result.assets[0].uri,
          },
        });

        if (updateResult.success) {
          setProfile(prev => ({
            ...prev,
            media: {
              ...prev.media,
              logo_url: result.assets[0].uri,
            },
          }));
          Alert.alert(t('common.success'), t('vendorInfo.updateSuccess'));
        } else {
          Alert.alert(t('common.error'), updateResult.error || t('vendorInfo.updateFailed'));
        }
      }
    } catch (error) {
      console.error('Error updating logo:', error);
      Alert.alert(t('common.error'), t('vendorInfo.updateFailed'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const MenuItem = ({ icon, title, value, onPress, showArrow = true, color = "#333" }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {showArrow && <Ionicons name="chevron-forward" size={20} color="#999" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('vendorDashboard.title')}</Text>
          <TouchableOpacity onPress={() => Alert.alert(t('common.success'), 'Coming Soon!')}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {(profile?.media?.logo_url || businessData?.logo) ? (
              <Image
                source={{ uri: profile?.media?.logo_url || businessData?.logo }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="business" size={40} color={COLORS.primary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.editBadge}
              onPress={handleEditLogo}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <Text style={{ color: '#fff', fontSize: 10 }}>...</Text>
              ) : (
                <Ionicons name="pencil" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.businessName}>
            {isUrdu && profile?.business_name_ur
              ? profile.business_name_ur
              : profile?.business_name_en || businessData?.businessName || t('vendorDashboard.title')}
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalProducts}</Text>
              <Text style={styles.statLabel}>{t('vendorDashboard.totalProducts')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.activeOrders}</Text>
              <Text style={styles.statLabel}>{t('vendorDashboard.totalOrders')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Rs {stats.totalRevenue}</Text>
              <Text style={styles.statLabel}>{t('vendorDashboard.revenue')}</Text>
            </View>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="cube-outline"
            title={t('vendorDashboard.myProducts')}
            value={`${stats.totalProducts} ${t('myProducts.loadingProducts')}`}
            onPress={() => navigation.navigate('MyProducts', {
              businessId: profile?.vendor_id || businessData?.id,
              vendorProfile: profile,
              userId: userId,
            })}
          />
          <MenuItem
            icon="add-circle-outline"
            title={t('vendorDashboard.addProduct')}
            value={t('addProduct.title')}
            onPress={() => navigation.navigate('AddProduct', {
              businessId: profile?.vendor_id || businessData?.id,
              vendorProfile: profile,
              userId: userId,
            })}
          />
        </View>

        {/* Orders Management */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="receipt-outline"
            title={t('vendorOrders.title')}
            value={stats.activeOrders > 0 ? `${stats.activeOrders} ${t('vendorOrders.all')}` : t('vendorDashboard.viewAll')}
            onPress={() => navigation.navigate('VendorOrders')}
          />
          <MenuItem
            icon="time-outline"
            title={t('vendorOrders.pending')}
            value={stats.pendingOrders > 0 ? stats.pendingOrders.toString() : '0'}
            color="#f59e0b"
            onPress={() => navigation.navigate('VendorOrders', { initialFilter: 'pending' })}
          />
          <MenuItem
            icon="checkmark-circle-outline"
            title={t('vendorOrders.confirmed')}
            color="#10b981"
            onPress={() => navigation.navigate('VendorOrders', { initialFilter: 'confirmed' })}
          />
        </View>

        {/* Vendor Information */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="information-circle-outline"
            title={t('vendorInfo.title')}
            onPress={() => navigation.navigate('VendorInfo', {
              profile: profile,
              businessData: businessData,
            })}
          />
        </View>

        {/* Support Section */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="help-circle-outline"
            title={t('supportInfo.helpCenter')}
            onPress={() => navigation.navigate('SupportInfo', { initialTab: 'help' })}
          />
          <MenuItem
            icon="mail-outline"
            title={t('supportInfo.contactUs')}
            onPress={() => navigation.navigate('SupportInfo', { initialTab: 'contact' })}
          />
          <MenuItem
            icon="document-text-outline"
            title={t('supportInfo.feedback')}
            onPress={() => navigation.navigate('SupportInfo', { initialTab: 'privacy' })}
          />
        </View>

        {/* Language Selection */}
        <View style={styles.menuSection}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="language-outline" size={22} color="#333" />
              <Text style={styles.menuTitle}>{t('profile.language')}</Text>
            </View>
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

        {/* Account Section */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="swap-horizontal-outline"
            title={t('profile.editProfile')}
            onPress={handleSwitchAccount}
          />
          <MenuItem
            icon="log-out-outline"
            title={t('profile.logout')}
            color="#EF4444"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>

        {/* Recent Products Section */}
        {recentProducts.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>{t('vendorDashboard.recentOrders')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyProducts', {
                businessId: profile?.vendor_id || businessData?.id,
                vendorProfile: profile,
                userId: userId,
              })}>
                <Text style={styles.viewAllText}>{t('vendorDashboard.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            {recentProducts.map((product) => (
              <View key={product.listing_id} style={styles.productRow}>
                {product.media && product.media.length > 0 && product.media[0].image_url ? (
                  <Image
                    source={{ uri: product.media[0].image_url }}
                    style={styles.productThumb}
                  />
                ) : (
                  <View style={styles.productThumbPlaceholder}>
                    <Ionicons name="image-outline" size={20} color="#999" />
                  </View>
                )}
                <View style={styles.productDetails}>
                  <Text style={styles.productTitle}>
                    {isUrdu && product.title_ur ? product.title_ur : product.title_en}
                  </Text>
                  <Text style={styles.productPrice}>Rs {product.price?.toLocaleString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            ))}
          </View>
        )}

        {/* App Version */}
        <Text style={styles.versionText}>{t('profile.version')} 1.0.0</Text>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>{t('homeScreen.home')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="cart-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>{t('homeScreen.orders')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="heart-outline" size={24} color="#999" />
          <Text style={styles.navLabel}>{t('homeScreen.wishlist')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color={COLORS.primary} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>{t('homeScreen.profile')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  businessName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F0F0F0',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 8,
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
  recentSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  productThumbPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: COLORS.primary,
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 8,
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default VendorDashboardScreen;
