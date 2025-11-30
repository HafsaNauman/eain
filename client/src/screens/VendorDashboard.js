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
  const { t } = useTranslation();
    const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback if this is the root screen
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
  ////new code for logout and signup 
  const { logout } = useAuth();

// Remove line 348 entirely

// Then in handleLogout:
const handleLogout = async () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
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
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload your logo.');
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
        
        // Update profile with new logo
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
          Alert.alert('Success', 'Logo updated successfully!');
        } else {
          Alert.alert('Error', updateResult.error || 'Failed to update logo');
        }
      }
    } catch (error) {
      console.error('Error updating logo:', error);
      Alert.alert('Error', 'Failed to update logo');
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
         <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
         <TouchableOpacity onPress={() => alert('Notifications - Coming Soon!')}>
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
            {profile?.business_name_en || businessData?.businessName || 'Your Business'}
          </Text>
          
          {/* <Text style={styles.businessEmail}>
            {profile?.business_email || 'youremail@domain.com'}
          </Text> */}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalProducts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.activeOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Rs {stats.totalRevenue}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="cube-outline"
            title="My Products"
            value={`${stats.totalProducts} items`}
            onPress={() => navigation.navigate('MyProducts', {
              businessId: profile?.vendor_id || businessData?.id,
              vendorProfile: profile,
              userId: userId,
            })}
          />
          <MenuItem
            icon="add-circle-outline"
            title="Add Product"
            value="Create new"
            onPress={() => navigation.navigate('AddProduct', {
              businessId: profile?.vendor_id || businessData?.id,
              vendorProfile: profile,
              userId: userId,
            })}
          />
        </View>

        {/* Vendor Information */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="information-circle-outline"
            title="Business Information"
            onPress={() => navigation.navigate('VendorInfo', {
              profile: profile,
              businessData: businessData,
            })}
          />
        </View>

        {/* Orders Management */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="cart-outline"
            title="All Orders"
            value={stats.activeOrders.toString()}
            onPress={() => navigation.navigate('Orders', { status: 'all' })}
          />
          <MenuItem
            icon="time-outline"
            title="Pending Orders"
            value={stats.pendingOrders.toString()}
            color="#f59e0b"
            onPress={() => navigation.navigate('Orders', { status: 'pending' })}
          />
          <MenuItem
            icon="checkmark-circle-outline"
            title="Delivered Orders"
            value={stats.deliveredOrders.toString()}
            color="#10b981"
            onPress={() => navigation.navigate('Orders', { status: 'delivered' })}
          />
        </View>

        <View style={styles.menuSection}>
  <MenuItem
    icon="help-circle-outline"
    title="Help & Support"
    onPress={() => navigation.navigate('SupportInfo', { initialTab: 'help' })}
  />
  <MenuItem
    icon="mail-outline"
    title="Contact us"
    onPress={() => navigation.navigate('SupportInfo', { initialTab: 'contact' })}
  />
  <MenuItem
    icon="document-text-outline"
    title="Privacy policy"
    onPress={() => navigation.navigate('SupportInfo', { initialTab: 'privacy' })}
  />
</View>

{/* Account Section */}
<View style={styles.menuSection}>
  <MenuItem
    icon="swap-horizontal-outline"
    title="Switch Account"
    onPress={handleSwitchAccount}
  />
  <MenuItem
    icon="log-out-outline"
    title="Logout"
    color="#EF4444"
    onPress={handleLogout}
    showArrow={false}
  />
</View>



        {/* Recent Products Section */}
        {recentProducts.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyProducts', {
                businessId: profile?.vendor_id || businessData?.id,
                vendorProfile: profile,
                userId: userId,
              })}>
                <Text style={styles.viewAllText}>View All</Text>
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
                  <Text style={styles.productTitle}>{product.title_en}</Text>
                  <Text style={styles.productPrice}>Rs {product.price?.toLocaleString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      {/* Bottom Navigation */}
<View style={styles.bottomNav}>
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
    <Ionicons name="home-outline" size={24} color="#999" />
    <Text style={styles.navLabel}>Home</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navItem}>
    <Ionicons name="cart-outline" size={24} color="#999" />
    <Text style={styles.navLabel}>Cart</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navItem}>
    <Ionicons name="heart-outline" size={24} color="#999" />
    <Text style={styles.navLabel}>Wishlist</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navItem}>
    <Ionicons name="person" size={24} color={COLORS.primary} />
    <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
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
  },
  businessEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
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
  navItemActive: {
    // Active state
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
