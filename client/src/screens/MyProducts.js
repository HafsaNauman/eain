/**
 * My Products Screen
 * Shows all vendor's products/listings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';
import { getVendorListings, deleteListing } from '../api/VendorService';
import StockIndicator from '../components/StockIndicator';  // ✅ NEW


const MyProductsScreen = ({ route, navigation }) => {
  const { i18n, t } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      console.log('📦 Loading all products...');
      const result = await getVendorListings();

      if (result.success) {
        const listings = result.data.data?.listings || result.data.listings || [];
        console.log('✅ Loaded products:', listings.length);
        setProducts(listings);
      } else {
        console.error('❌ Failed to load products:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleDeleteProduct = (item) => {
    const productTitle = isUrdu && item.title_ur ? item.title_ur : item.title_en;

    Alert.alert(
      t('myProducts.confirmDelete'),
      `${t('myProducts.deleteMessage')} "${productTitle}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('myProducts.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteListing(item.listing_id);
              if (!result.success) {
                Alert.alert(t('common.error'), result.error || t('addProduct.errors.updateFailed'));
              } else {
                setProducts(prev =>
                  prev.filter(p => p.listing_id !== item.listing_id)
                );
                Alert.alert(t('common.success'), t('myProducts.productDeleted'));
              }
            } catch (e) {
              Alert.alert(t('common.error'), t('addProduct.errors.updateFailed'));
            }
          },
        },
      ]
    );
  };

  const renderProductCard = ({ item }) => {
  const productTitle = isUrdu && item.title_ur ? item.title_ur : item.title_en;
  const productDescription = isUrdu && item.description_ur ? item.description_ur : item.title_en;
  
  // ✅ STOCK: Calculate availability
  const availableStock = item.track_inventory 
    ? Math.max(0, (item.stock_quantity || 0) - (item.reserved_quantity || 0))
    : null;
  const isLowStock = availableStock !== null && availableStock <= 5 && availableStock > 0;
  const isOutOfStock = availableStock === 0 && item.track_inventory;

  return (
    <TouchableOpacity
      style={[
        styles.productCard,
        isOutOfStock && styles.outOfStockCard  // ✅ Visual OOS
      ]}
      onPress={() => navigation.navigate('VendorProductDetail', { product: item })}
    >
      <View style={styles.productImageContainer}>
        {/* Your existing image code */}
        {item.media && item.media.length > 0 && item.media[0].image_url ? (
          <Image source={{ uri: item.media[0].image_url }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}

        {/* ✅ REPLACE activeBadge with StockIndicator */}
        <StockIndicator
          stockQuantity={item.stock_quantity}
          reservedQuantity={item.reserved_quantity || 0}
          trackInventory={item.track_inventory || false}
          style={styles.stockBadge}
        />

        {/* ✅ LOW STOCK WARNING */}
        {isLowStock && (
          <View style={styles.lowStockWarning}>
            <Text style={styles.lowStockText}>Low Stock!</Text>
          </View>
        )}
      </View>

      {/* Your existing productInfo */}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{productTitle}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {productDescription || t('addProduct.productDescription')}
        </Text>

        <View style={styles.productFooter}>
          <View>
            <Text style={styles.productPrice}>Rs {item.price?.toLocaleString()}</Text>
            <Text style={styles.productType}>
              {item.listing_type === 'product' ? t('businessReg.product') : t('businessReg.service')}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('VendorProductDetail', { product: item })}
            >
              <Ionicons name="create-outline" size={20} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteProduct(item)}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};


  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>{t('myProducts.noProducts')}</Text>
      <Text style={styles.emptyText}>{t('myProducts.noProductsMessage')}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct', route.params)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>{t('myProducts.addProduct')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('myProducts.title')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('myProducts.loadingProducts')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myProducts.title')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddProduct', route.params)}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {products.length} {products.length === 1
            ? t('vendorOrders.product')
            : t('vendorDashboard.totalProducts')}
        </Text>
        <TouchableOpacity onPress={() => Alert.alert(t('common.success'), 'Coming Soon!')}>
          <Ionicons name="filter-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.listing_id.toString()}
        contentContainerStyle={[
          styles.listContent,
          products.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  productType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  outOfStockCard: {
  opacity: 0.7,
  borderColor: '#fee2e2',
  borderWidth: 1,
},
lowStockWarning: {
  position: 'absolute',
  top: 8,
  left: 8,
  backgroundColor: '#fef3c7',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
},
lowStockText: {
  color: '#d97706',
  fontSize: 11,
  fontWeight: 'bold',
},
stockBadge: {
  position: 'absolute',
  top: 8,
  right: 8,
},


});

export default MyProductsScreen;
