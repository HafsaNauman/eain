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
  TextInput,
  Switch,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getAllVendors, updateVendorStatus, deleteVendor } from '../../api/adminService';

const VendorsManagementScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingVendorId, setUpdatingVendorId] = useState(null);
  const [isActiveOnly, setIsActiveOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [reasonText, setReasonText] = useState('');

  const LIMIT = 20;

  const fetchVendors = useCallback(async (isRefresh = false, append = false) => {
    try {
      if (isRefresh) setRefreshing(true), setPage(0);
      else setLoading(true);
      setError(null);

      const params = {
        limit: LIMIT,
        offset: isRefresh ? 0 : page * LIMIT,
        is_active: isActiveOnly ? true : undefined,
      };

      const result = await getAllVendors(params);
      if (result.success) {
        const newVendors = result.data.vendors;
        setVendors(append ? [...vendors, ...newVendors] : newVendors);
        setHasMore(result.data.pagination?.hasMore ?? newVendors.length === LIMIT);
      } else {
        setError(result.error);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Fetch vendors error:', err);
      setError('Network error');
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setUpdatingVendorId(null);
    }
  }, [page, isActiveOnly, vendors]);

  useEffect(() => {
    fetchVendors(true);
  }, [isActiveOnly]);

  const handleStatusChange = async (vendorId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'approve';
    Alert.alert(
      t('admin.confirmVendorAction'),
      t('admin.confirmVendorActionMsg', { action }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            setSelectedVendor({ id: vendorId, currentStatus });
            setReasonText('');
            setShowReasonModal(true);
          },
        },
      ]
    );
  };

  const confirmStatusChange = async () => {
    if (!selectedVendor || !reasonText.trim()) {
      Alert.alert(t('admin.reasonRequired'));
      return;
    }

    setUpdatingVendorId(selectedVendor.id);
    try {
      const result = await updateVendorStatus(
        selectedVendor.id,
        !selectedVendor.currentStatus,
        reasonText.trim()
      );
      if (result.success) {
        Alert.alert(t('admin.vendorStatusUpdated'));
        fetchVendors(true);
      } else {
        Alert.alert(t('common.error'), result.error);
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.serverError'));
    }
    setShowReasonModal(false);
  };

  const handleDelete = async (vendorId, vendorName) => {
    Alert.alert(
      t('admin.confirmDelete'),
      `${t('admin.deleteVendor')} ${vendorName || vendorId}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.delete'),
          style: 'destructive',
          onPress: async () => {
            setUpdatingVendorId(vendorId);
            try {
              const result = await deleteVendor(vendorId);
              if (result.success) {
                Alert.alert(t('admin.vendorDeleted'));
                fetchVendors(true);
              } else {
                Alert.alert(t('common.error'), result.error);
              }
            } catch (err) {
              Alert.alert(t('common.error'), t('errors.serverError'));
            }
          },
        },
      ]
    );
  };

  const renderVendorCard = ({ item: vendor }) => {
    const isUpdating = updatingVendorId === vendor.vendor_id;
    const statusColor = vendor.is_active ? '#4CAF50' : '#F44336';

    return (
      <View style={styles.vendorCard}>
        {/* Header */}
        <View style={styles.vendorHeader}>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{vendor.business_name_en || 'N/A'}</Text>
            <Text style={styles.vendorId}>ID: {vendor.vendor_id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {vendor.is_active ? t('admin.active') : t('admin.inactive')}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.vendorDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{vendor.User?.full_name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{vendor.User?.phone_number || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{vendor.User?.email || 'N/A'}</Text>
          </View>
          <Text style={styles.createdDate}>
            {t('admin.created')}: {new Date(vendor.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton]}
            onPress={() => handleStatusChange(vendor.vendor_id, vendor.is_active)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={vendor.is_active ? 'toggle-off-outline' : 'toggle-outline'}
                size={18}
                color="#fff"
              />
            )}
            <Text style={styles.actionButtonText}>
              {vendor.is_active ? t('admin.deactivate') : t('admin.approve')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(vendor.vendor_id, vendor.business_name_en)}
            disabled={isUpdating}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>{t('admin.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReasonModal = () => (
    <Modal visible={showReasonModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {t('admin.vendorReasonTitle', {
              action: selectedVendor?.currentStatus ? 'Deactivate' : 'Approve',
            })}
          </Text>
          <TextInput
            style={styles.reasonInput}
            placeholder={t('admin.reasonPlaceholder')}
            multiline
            numberOfLines={4}
            value={reasonText}
            onChangeText={setReasonText}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowReasonModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirm}
              onPress={confirmStatusChange}
            >
              <Text style={styles.modalConfirmText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>{t('admin.noVendors')}</Text>
      <Text style={styles.emptySubtitle}>{t('admin.noVendorsMessage')}</Text>
    </View>
  );

  const onRefresh = () => fetchVendors(true);
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(page + 1);
      fetchVendors(false, true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#036c5f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.vendorsManagement')}</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#036c5f" />
        </TouchableOpacity>
      </View>

      {/* Active Filter */}
      <View style={styles.activeFilterRow}>
        <Text style={styles.activeFilterLabel}>{t('admin.activeOnly')}</Text>
        <Switch
          value={isActiveOnly}
          onValueChange={setIsActiveOnly}
          trackColor={{ true: '#4CAF50', false: '#f5f5f5' }}
          thumbColor={isActiveOnly ? '#fff' : '#f7f7f7'}
        />
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>{t('myOrders.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={vendors}
        renderItem={renderVendorCard}
        keyExtractor={(item) => `vendor-${item.vendor_id}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#036c5f']} />
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
          <Text style={styles.loadingText}>Loading more vendors...</Text>
        </View>
      )}

      {renderReasonModal()}
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
  activeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  activeFilterLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
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
  vendorCard: {
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
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  vendorId: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  vendorDetails: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: { fontSize: 14, color: '#666', marginLeft: 8, flex: 1 },
  createdDate: { fontSize: 12, color: '#999', marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  statusButton: { backgroundColor: '#2196F3' },
  deleteButton: { backgroundColor: '#F44336' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: { marginLeft: 8, fontSize: 14, color: '#666' },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCancelText: { fontSize: 16, color: '#666' },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
});

export default VendorsManagementScreen;