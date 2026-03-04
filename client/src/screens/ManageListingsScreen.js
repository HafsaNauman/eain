/**
 * ManageListingsScreen.js - VENDOR PRODUCT TABLE + STOCK MANAGEMENT
 * Shows all vendor listings with stock column + bulk actions
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StockIndicator from '../components/StockIndicator';
import { getVendorListings, bulkUpdateStock } from '../api/VendorService';
const TEAL = '#036c5f';
const ManageListingsScreen = ({ navigation , route }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all, low-stock, out-of-stock
  const [bulkStock, setBulkStock] = useState('');

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const result = await getVendorListings({ stock_filter: filter });
      if (result.success) {
  setListings(Array.isArray(result.data) ? result.data : []);
} else {
  setListings([]);
}
    } catch (err) {
      Alert.alert('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (listingId) => {
    setSelectedItems(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleBulkUpdate = async () => {
    if (!bulkStock || selectedItems.length === 0) return;

    Alert.alert(
      'Bulk Update Stock',
      `Add ${bulkStock} stock to ${selectedItems.length} products?`,
      [
        { text: 'Cancel' },
        {
          text: 'Update',
          onPress: async () => {
            const result = await bulkUpdateStock(selectedItems, parseInt(bulkStock));
            if (result.success) {
              Alert.alert('Success', 'Stock updated for all selected products');
              setSelectedItems([]);
              setBulkStock('');
              fetchListings();
            }
          }
        }
      ]
    );
  };

  const getStockStatus = (listing) => {
    if (!listing.track_inventory) return 'untracked';
    const available = (listing.stock_quantity || 0) - (listing.reserved_quantity || 0);
    if (available === 0) return 'out-of-stock';
    if (available <= (listing.low_stock_threshold || 5)) return 'low-stock';
    return 'in-stock';
  };

  const renderListing = ({ item }) => {
    const stockStatus = getStockStatus(item);
    const isSelected = selectedItems.includes(item.listing_id);
    const isLowStock = stockStatus === 'low-stock';
    const isOutOfStock = stockStatus === 'out-of-stock';

    return (
      <TouchableOpacity
        style={[
          styles.listingRow,
          isSelected && styles.selectedRow,
          isLowStock && styles.lowStockRow,
          isOutOfStock && styles.outOfStockRow
        ]}
        onPress={() => toggleSelection(item.listing_id)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleSelection(item.listing_id)}
        >
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          ) : (
            <View style={styles.checkboxEmpty} />
          )}
        </TouchableOpacity>

        {/* Image */}
        <Image
          source={{ uri: item.media?.[0]?.image_url || 'https://via.placeholder.com/60' }}
          style={styles.rowImage}
        />

        {/* Product Info */}
        <View style={styles.infoColumn}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.title_en}
          </Text>
          <Text style={styles.productPrice}>
            PKR {item.price?.toLocaleString()}
          </Text>
        </View>

        {/* Stock Column */}
        <View style={styles.stockColumn}>
          <StockIndicator
            stockQuantity={item.stock_quantity}
            reservedQuantity={item.reserved_quantity}
            trackInventory={item.track_inventory}
            size="small"
          />
          {isLowStock && (
            <Text style={styles.lowStockLabel}>LOW STOCK</Text>
          )}
        </View>

        {/* Orders Column */}
        <View style={styles.ordersColumn}>
          <Text style={styles.ordersText}>
            {item.pending_orders || 0}
          </Text>
        </View>

        {/* Status */}
        <View style={[
          styles.statusBadge,
          stockStatus === 'in-stock' && { backgroundColor: '#D4EDDA' },
          stockStatus === 'low-stock' && { backgroundColor: '#FFF3CD' },
          stockStatus === 'out-of-stock' && { backgroundColor: '#F8D7DA' }
        ]}>
          <Text style={styles.statusText}>
            {stockStatus.replace('-', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('VendorProductDetail', { product: item })}
          >
            <Ionicons name="create-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={styles.headerText}>Select</Text>
      <Text style={styles.headerText}>Product</Text>
      <Text style={styles.headerText}>Stock</Text>
      <Text style={styles.headerText}>Orders</Text>
      <Text style={styles.headerText}>Status</Text>
      <Text style={styles.headerText}>Actions</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TEAL} />
        <Text style={styles.loadingText}>Loading your products...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Manage Products ({listings.length})
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {['all', 'low-stock', 'out-of-stock'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filter === status && styles.activeFilter
            ]}
            onPress={() => setFilter(status)}
          >
            <Text style={[
              styles.filterText,
              filter === status && styles.activeFilterText
            ]}>
              {status.replace('-', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkText}>
            {selectedItems.length} selected
          </Text>
          <View style={styles.bulkInputRow}>
            <TextInput
              style={styles.bulkInput}
              value={bulkStock}
              onChangeText={setBulkStock}
              placeholder="Add stock"
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.bulkUpdateButton}
              onPress={handleBulkUpdate}
            >
              <Text style={styles.bulkUpdateText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Table */}
      <FlatList
        data={Array.isArray(listings) ? listings : []}
        renderItem={renderListing}
        keyExtractor={item => item.listing_id}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Stats Footer */}
      {/* Stats Footer - Line ~420 */}
<View style={styles.statsFooter}>
  <Text style={styles.statsText}>
    Low Stock: {(Array.isArray(listings) ? listings : []).filter(l => getStockStatus(l) === 'low-stock').length}
  </Text>
  {/* ✅ ADD INVENTORY DASHBOARD BUTTON */}
  <TouchableOpacity 
    style={styles.exportButton}
    onPress={() => navigation.navigate('InventoryManagement', { 
      vendorId: route?.params?.vendorId 
    })}
  >
    <Text style={styles.exportText}>📊 Inventory Dashboard</Text>
  </TouchableOpacity>
</View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#036c5f',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addButton: { padding: 8 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilter: { backgroundColor: '#036c5f' },
  filterText: { fontSize: 14, color: '#666' },
  activeFilterText: { color: '#fff', fontWeight: 'bold' },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bulkText: { fontSize: 16, fontWeight: 'bold', marginRight: 12 },
  bulkInputRow: { flexDirection: 'row', flex: 1 },
  bulkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  bulkUpdateButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkUpdateText: { color: '#fff', fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  headerText: { flex: 0.8, fontWeight: 'bold', color: '#666' },
  listingRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedRow: { backgroundColor: '#E0F2FE' },
  lowStockRow: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  outOfStockRow: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  checkbox: { padding: 4 },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  rowImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  infoColumn: { flex: 2 },
  productTitle: { fontSize: 16, fontWeight: '600' },
  productPrice: { fontSize: 14, color: '#666' },
  stockColumn: { flex: 1.5, alignItems: 'center' },
  lowStockLabel: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: 'bold',
    marginTop: 4,
  },
  ordersColumn: { flex: 0.8, alignItems: 'center' },
  ordersText: { fontSize: 14, fontWeight: '500' },
  statusBadge: {
    flex: 1.2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  actionsColumn: { flex: 0.8, alignItems: 'flex-end' },
  quickAction: { padding: 4 },
  listContent: { paddingBottom: 100 },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statsText: { fontSize: 14, color: '#666' },
  exportButton: { paddingVertical: 8 },
  exportText: { color: '#036c5f', fontWeight: 'bold' },
});

export default ManageListingsScreen;
