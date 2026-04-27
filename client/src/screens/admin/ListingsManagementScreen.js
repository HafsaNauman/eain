import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Switch,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getAllListingsAdmin } from '../../api/adminService';

const ListingsManagementScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isActiveOnly, setIsActiveOnly] = useState(false);
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  const fetchListings = useCallback(async (isRefresh = false, append = false) => {
    try {
      if (isRefresh) setRefreshing(true), setPage(0);
      else setLoading(true);
      setError(null);

      const params = {
        limit: LIMIT,
        offset: isRefresh ? 0 : page * LIMIT,
        is_active: isActiveOnly ? true : undefined,
        is_featured: isFeaturedOnly ? true : undefined,
        category: categoryFilter || undefined,
      };

      const result = await getAllListingsAdmin(params);
      if (result.success) {
        const newListings = result.data.listings;
        setListings(append ? [...listings, ...newListings] : newListings);
        setHasMore(result.data.pagination?.hasMore ?? newListings.length === LIMIT);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Fetch listings error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, isActiveOnly, isFeaturedOnly, categoryFilter, listings]);

  useEffect(() => {
    fetchListings(true);
  }, [isActiveOnly, isFeaturedOnly, categoryFilter]);

  const clearFilters = () => {
    setIsActiveOnly(false);
    setIsFeaturedOnly(false);
    setCategoryFilter('');
  };

  const renderListingCard = ({ item: listing }) => {
    const statusColor = listing.is_active ? '#4CAF50' : '#F44336';
    const featuredColor = listing.is_featured ? '#FF9800' : '#666';

    return (
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => navigation.navigate('ProductDetailScreen', { listing })}
      >
        {/* Header */}
        <View style={styles.listingHeader}>
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {listing.title_en || 'No Title'}
            </Text>
            <Text style={styles.listingId}>ID: {listing.listing_id}</Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {listing.is_active ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* Vendor Info */}
        <View style={styles.vendorSection}>
          <Ionicons name="storefront-outline" size={16} color="#666" />
          <Text style={styles.vendorText}>
            {listing.Vendor?.business_name_en || 'N/A'}
          </Text>
        </View>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={14} color="#666" />
            <Text style={styles.detailText}>PKR {listing.price?.toLocaleString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="list-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{listing.category}</Text>
          </View>
        </View>

        {/* Featured Badge */}
        {listing.is_featured && (
          <View style={[styles.featuredBadge, { backgroundColor: featuredColor }]}>
            <Ionicons name="star-outline" size={12} color="#fff" />
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, styles.viewButton]}>
            <Ionicons name="eye-outline" size={16} color="#036c5f" />
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.statsButton]}>
            <Ionicons name="bar-chart-outline" size={16} color="#666" />
            <Text style={styles.statsButtonText}>Stats</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterSection = () => (
    <View style={styles.filterContainer}>
      {/* Active Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Active Only</Text>
        <Switch
          value={isActiveOnly}
          onValueChange={setIsActiveOnly}
          trackColor={{ true: '#4CAF50', false: '#f5f5f5' }}
          thumbColor={isActiveOnly ? '#fff' : '#f7f7f7'}
        />
      </View>

      {/* Featured Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Featured Only</Text>
        <Switch
          value={isFeaturedOnly}
          onValueChange={setIsFeaturedOnly}
          trackColor={{ true: '#FF9800', false: '#f5f5f5' }}
          thumbColor={isFeaturedOnly ? '#fff' : '#f7f7f7'}
        />
      </View>

      {/* Category Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Category</Text>
        <View style={styles.categoryInputContainer}>
          <Ionicons name="search-outline" size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.categoryInput}
            placeholder="e.g. electronics, clothing..."
            value={categoryFilter}
            onChangeText={setCategoryFilter}
          />
        </View>
      </View>

      {/* Clear Filters */}
      <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
        <Ionicons name="close-circle-outline" size={18} color="#666" />
        <Text style={styles.clearButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="layers-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Listings Found</Text>
      <Text style={styles.emptySubtitle}>
        No listings match your current filters
      </Text>
    </View>
  );

  const onRefresh = () => fetchListings(true);
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(page + 1);
      fetchListings(false, true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#036c5f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listings Management</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#036c5f" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {renderFilterSection()}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={listings}
        renderItem={renderListingCard}
        keyExtractor={(item) => `listing-${item.listing_id}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#036c5f']}
          />
        }
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading More */}
      {loading && (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#036c5f" />
          <Text style={styles.loadingText}>Loading more listings...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },

  // Filters
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterLabel: { fontSize: 15, fontWeight: '500', color: '#333' },
  categoryInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  searchIcon: { marginRight: 8 },
  categoryInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  clearButtonText: { marginLeft: 6, fontSize: 15, color: '#666' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: { flex: 1, marginLeft: 8, fontSize: 14, color: '#c62828' },
  retryText: { fontSize: 14, color: '#036c5f', fontWeight: 'bold' },

  listContent: { padding: 16, paddingBottom: 100 },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listingInfo: { flex: 1 },
  listingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  listingId: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  vendorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendorText: { fontSize: 14, color: '#036c5f', marginLeft: 8, fontWeight: '500' },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: { fontSize: 13, color: '#666', marginLeft: 4 },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  featuredText: { fontSize: 10, fontWeight: 'bold', color: '#fff', marginLeft: 2 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  viewButton: { backgroundColor: '#f0f8ff' },
  viewButtonText: { fontSize: 13, color: '#036c5f', fontWeight: '500' },
  statsButton: { backgroundColor: '#f9f9f9' },
  statsButtonText: { fontSize: 13, color: '#666' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { marginLeft: 8, fontSize: 14, color: '#666' },
});

export default ListingsManagementScreen;