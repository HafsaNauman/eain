/**
 * UsersManagementScreen.js - Complete admin user management
 * Pagination + Status Toggle + Role Changer + Delete
 * Matches your EAIN theme & VendorOrdersScreen styling
 */

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
  Switch,
  ActionSheetIOS,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  getAllUsers,
  updateUserStatus,
  changeUserRole,
  deleteUser,
} from '../../api/adminService';

const UsersManagementScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [isActiveOnly, setIsActiveOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const fetchUsers = useCallback(async (isRefresh = false, append = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(0);
      } else {
        setLoading(true);
      }
      setError('');

      const params = {
        limit: LIMIT,
        offset: isRefresh ? 0 : page * LIMIT,
        role: filterRole === 'all' ? undefined : filterRole,
        is_active: isActiveOnly !== undefined ? isActiveOnly : undefined,
      };

      const result = await getAllUsers(params);
      if (result.success) {
        const newUsers = result.data.users || [];
        setUsers(append ? [...users, ...newUsers] : newUsers);
        setHasMore(result.data.pagination?.hasMore || newUsers.length === LIMIT);
      } else {
        setError(result.error);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(t('errors.networkError'));
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setUpdatingUserId(null);
    }
  }, [page, filterRole, isActiveOnly, users, t]);

  useEffect(() => {
    fetchUsers(true);
  }, [filterRole, isActiveOnly]);

  const handleStatusToggle = async (userId, currentStatus) => {
    Alert.alert(
      t('admin.confirmStatusChange'),
      currentStatus ? t('admin.deactivateUser') : t('admin.activateUser'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: currentStatus ? t('admin.deactivate') : t('admin.activate'),
          style: 'destructive',
          onPress: async () => {
            setUpdatingUserId(userId);
            try {
              const result = await updateUserStatus(userId, !currentStatus);
              if (result.success) {
                Alert.alert(t('admin.statusUpdated'));
                fetchUsers(true);
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

  const handleRoleChange = async (userId, newRole) => {
    Alert.alert(
      t('admin.confirmRoleChange'),
      `${t('admin.changeTo')} ${newRole}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setUpdatingUserId(userId);
            try {
              const result = await changeUserRole(userId, newRole);
              if (result.success) {
                Alert.alert(t('admin.roleUpdated'));
                fetchUsers(true);
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

  const handleDelete = async (userId, userName) => {
    Alert.alert(
      t('admin.confirmDelete'),
      `${t('admin.deleteUser')} ${userName}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.delete'),
          style: 'destructive',
          onPress: async () => {
            setUpdatingUserId(userId);
            try {
              const result = await deleteUser(userId);
              if (result.success) {
                Alert.alert(t('admin.userDeleted'));
                fetchUsers(true);
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

  const renderUserCard = ({ item: user }) => {
    const isUpdating = updatingUserId === user.user_id;
    const roleColor = {
      admin: '#e91e63',
      vendor: '#4CAF50',
      customer: '#2196F3',
      service_provider: '#9C27B0',
    }[user.role?.toLowerCase()] || '#999';

    return (
      <View style={styles.userCard}>
        {/* Header */}
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.full_name || 'N/A'}</Text>
            <Text style={styles.userId}>ID: {user.user_id}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
            <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{user.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{user.phone_number}</Text>
          </View>
          <Text style={[styles.statusText, { color: user.is_active ? '#4CAF50' : '#F44336' }]}>
            {user.is_active ? t('admin.active') : t('admin.inactive')}
          </Text>
          <Text style={styles.createdDate}>
            {t('admin.created')}: {new Date(user.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton]}
            onPress={() => handleStatusToggle(user.user_id, user.is_active)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={user.is_active ? "toggle-off-outline" : "toggle-outline"}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.actionButtonText}>
                  {user.is_active ? t('admin.deactivate') : t('admin.activate')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.roleButton]}
            onPress={() => {
              const roles = ['vendor', 'customer', 'admin', 'service_provider'].filter(r => r !== user.role);
              Alert.alert(
                t('admin.changeRole'),
                t('admin.selectRole'),
                roles.map(role => ({
                  text: role.toUpperCase(),
                  onPress: () => handleRoleChange(user.user_id, role)
                })).concat({ text: t('common.cancel'), style: 'cancel' })
              );
            }}
            disabled={isUpdating}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>{t('admin.changeRole')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(user.user_id, user.full_name)}
            disabled={isUpdating}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>{t('admin.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filterRole === 'all' && styles.filterTabActive]}
          onPress={() => setFilterRole('all')}
        >
          <Text style={[styles.filterTabText, filterRole === 'all' && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterRole === 'vendor' && styles.filterTabActive]}
          onPress={() => setFilterRole('vendor')}
        >
          <Text style={[styles.filterTabText, filterRole === 'vendor' && styles.filterTabTextActive]}>
            Vendors
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterRole === 'customer' && styles.filterTabActive]}
          onPress={() => setFilterRole('customer')}
        >
          <Text style={[styles.filterTabText, filterRole === 'customer' && styles.filterTabTextActive]}>
            Custs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterRole === 'service_provider' && styles.filterTabActive]}
          onPress={() => setFilterRole('service_provider')}
        >
          <Text style={[styles.filterTabText, filterRole === 'service_provider' && styles.filterTabTextActive]}>
            Provs
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activeFilterRow}>
        <Text style={styles.activeFilterLabel}>{t('admin.activeOnly')}</Text>
        <Switch
          value={isActiveOnly}
          onValueChange={setIsActiveOnly}
          trackColor={{ true: '#4CAF50', false: '#f5f5f5' }}
          thumbColor={isActiveOnly ? '#fff' : '#f7f7f7'}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>{t('admin.noUsers')}</Text>
      <Text style={styles.emptySubtitle}>{t('admin.noUsersMessage')}</Text>
    </View>
  );

  const onRefresh = () => fetchUsers(true);
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(page + 1);
      fetchUsers(false, true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#036c5f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.usersManagement')}</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#036c5f" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>{t('myOrders.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* List */}
      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={(item) => `user-${item.user_id}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#036c5f']} />}
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#036c5f" />
          <Text style={styles.loadingText}>Loading more users...</Text>
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
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
  },
  filterTabActive: {
    backgroundColor: '#036c5f',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeFilterLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#c62828',
  },
  retryText: {
    fontSize: 14,
    color: '#036c5f',
    fontWeight: 'bold',
  },
  listContent: { padding: 16, paddingBottom: 100 },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  userId: { fontSize: 13, color: '#666', marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  userDetails: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  createdDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
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
  roleButton: { backgroundColor: '#FF9800' },
  deleteButton: { backgroundColor: '#F44336' },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
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
    color: '#666',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default UsersManagementScreen;