/**
 * Vendor Dashboard Screen
 * Main dashboard for vendors to manage their business
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';
// import { getVendorProducts, getVendorStats } from '../api/vendorService'; // ❌ COMMENTED - Causes error if not implemented

const VendorDashboardScreen = ({ route, navigation }) => {
  const { vendorProfile, businessData, userId, userRole } = route.params || {};
  const profile = vendorProfile || businessData || {}; // ✅ FIXED - Safe fallback
  const { t } = useTranslation();

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingReviews: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // loadDashboardData(); // ❌ COMMENTED - Causes error
  }, []);

  // ❌ COMMENTED OUT - This function causes errors because getVendorStats/getVendorProducts may not exist
  // const loadDashboardData = async () => {
  //   try {
  //     const businessId = profile?.vendor_id || profile?.id || businessData?.id;
      
  //     if (!businessId) {
  //       console.log('No business ID found');
  //       return;
  //     }

  //     const [statsData, productsData] = await Promise.all([
  //       getVendorStats(businessId),
  //       getVendorProducts(businessId, 5),
  //     ]);

  //     if (statsData.success) {
  //       setStats(statsData.data);
  //     }

  //     if (productsData.success) {
  //       setRecentProducts(productsData.data);
  //     }
  //   } catch (error) {
  //     console.error('Error loading dashboard data:', error);
  //   }
  // };

  const onRefresh = async () => {
    setRefreshing(true);
    // await loadDashboardData(); // ❌ COMMENTED
    setRefreshing(false);
  };

  const StatCard = ({ icon, title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const QuickActionButton = ({ icon, title, onPress, color }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {(profile?.media?.logo_url || businessData?.logo) ? (
              <Image 
                source={{ uri: profile?.media?.logo_url || businessData?.logo }} 
                style={styles.businessLogo}  
              />
            ) : ( 
              <View style={styles.businessLogoPlaceholder}>
                <Ionicons name="business" size={32} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.businessName}>
                {profile?.business_name_en || businessData?.businessName || 'Your Business'}
              </Text>
              <Text style={styles.businessCategory}>
                {profile?.category || businessData?.businessCategory || 'Business'} {/* ✅ FIXED */}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="cube-outline"
            title="Products"
            value={stats.totalProducts}
            color="#14b8a6"
          />
          <StatCard
            icon="cart-outline"
            title="Active Orders"
            value={stats.activeOrders}
            color="#f59e0b"
          />
          <StatCard
            icon="cash-outline"
            title="Revenue"
            value={`Rs ${stats.totalRevenue.toLocaleString()}`}
            color="#10b981"
          />
          <StatCard
            icon="star-outline"
            title="Pending Reviews"
            value={stats.pendingReviews}
            color="#f97316"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="add-circle"
              title="Add Product"
              color="#14b8a6"
              onPress={() => {
                // ❌ COMMENTED - May cause error if AddProduct screen doesn't exist
                // navigation.navigate('AddProduct', { 
                //   businessId: profile?.vendor_id || businessData?.id 
                // })
                navigation.navigate('AddProduct', { 
                    businessId: profile?.vendor_id || businessData?.id,
                    vendorProfile: profile 
                        })
              }}
            />
            <QuickActionButton
              icon="storefront"
              title="My Store"
              color="#f59e0b"
              onPress={() => {
                // ❌ COMMENTED
                // navigation.navigate('MyStore', { 
                //   businessData: profile || businessData 
                // })
                alert('My Store - Coming Soon!');
              }}
            />
            <QuickActionButton
              icon="bar-chart"
              title="Analytics"
              color="#8b5cf6"
              onPress={() => {
                // ❌ COMMENTED
                // navigation.navigate('Analytics')
                alert('Analytics - Coming Soon!');
              }}
            />
            <QuickActionButton
              icon="settings"
              title="Settings"
              color="#6b7280"
              onPress={() => {
                // ❌ COMMENTED
                // navigation.navigate('BusinessSettings', { 
                //   businessData: profile || businessData 
                // })
                alert('Settings - Coming Soon!');
              }}
            />
          </View>
        </View>

        {/* Recent Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Products</Text>
            <TouchableOpacity
              onPress={() => {
                // ❌ COMMENTED
                // navigation.navigate('MyStore', { 
                //   businessData: profile || businessData 
                // })
                alert('See All - Coming Soon!');
              }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentProducts.length > 0 ? (
            recentProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>Rs {product.price}</Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.productStock}>
                      Stock: {product.stock}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      product.status === 'active' ? styles.activeStatus : styles.inactiveStatus
                    ]}>
                      <Text style={styles.statusText}>{product.status}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    // ❌ COMMENTED
                    // navigation.navigate('EditProduct', { product })
                    navigation.navigate('AddProduct', { 
                        businessId: profile?.vendor_id || businessData?.id,
                        vendorProfile: profile 
                        })
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No products yet</Text>
              <TouchableOpacity
                style={styles.addFirstProductButton}
                onPress={() => {
                  // ❌ COMMENTED
                  // navigation.navigate('AddProduct', { 
                  //   businessId: profile?.vendor_id || businessData?.id 
                  // })
                  navigation.navigate('AddProduct', { 
                businessId: profile?.vendor_id || businessData?.id,
                vendorProfile: profile 
                    })
                }}
              >
                <Text style={styles.addFirstProductText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // ❌ COMMENTED
          // navigation.navigate('AddProduct', { 
          //   businessId: profile?.vendor_id || businessData?.id 
          // })
          navigation.navigate('AddProduct', { 
            businessId: profile?.vendor_id || businessData?.id,
            vendorProfile: profile 
            })
        }}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  businessLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productStock: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeStatus: {
    backgroundColor: '#D1FAE5',
  },
  inactiveStatus: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editButton: {
    padding: 8,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 20,
  },
  addFirstProductButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstProductText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default VendorDashboardScreen;
