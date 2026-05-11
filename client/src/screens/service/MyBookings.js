/**
 * MyBookings.js  → src/screens/service/MyBookings.js
 * API:
 *   GET /api/bookings/my?status=...   → customer bookings list
 *   PUT /api/bookings/:id/cancel      → cancel booking
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyBookings, cancelMyBooking } from '../../api/bookingService';
import { useAuth } from '../../context/AuthContext';

const PRIMARY = '#036c5f';
const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_MAP = {
  pending:   { bg: '#FEF3C7', color: '#D97706', label: 'Pending',   icon: 'time-outline' },
  confirmed: { bg: '#D1FAE5', color: '#059669', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  completed: { bg: '#E0E7FF', color: '#4F46E5', label: 'Completed', icon: 'ribbon-outline' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled', icon: 'close-circle-outline' },
  rejected:  { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected',  icon: 'close-circle-outline' },
};

const MyBookings = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings]       = useState([]);
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [cancelling, setCancelling]   = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) return;
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await getMyBookings(params);
      if (res.success) {
        const raw = res.data?.data;
        setBookings(Array.isArray(raw) ? raw : (raw?.bookings ?? []));
      } else {
        Alert.alert('Error', res.error);
      }
    } catch { Alert.alert('Error', 'Failed to load bookings.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter, isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = (id) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(id);
          const res = await cancelMyBooking(id, 'Cancelled by customer');
          setCancelling(null);
          if (res.success) { Alert.alert('Done', 'Booking cancelled.'); load(); }
          else Alert.alert('Error', res.error);
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const s = STATUS_MAP[item.status] || STATUS_MAP.pending;
    const isCancelling = cancelling === item.booking_id;
    return (
      <View style={styles.card}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.providerName} numberOfLines={1}>
              {item.vendor_name || item.business_name_en || 'Service Provider'}
            </Text>
            {item.service_name && (
              <Text style={styles.serviceName} numberOfLines={1}>{item.service_name}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={12} color={s.color} />
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Details */}
        <View style={{ gap: 6 }}>
          <InfoRow icon="calendar-outline" text={item.slot_date || '—'} />
          <InfoRow icon="time-outline"     text={item.slot_time?.slice(0,5) || '—'} />
          <InfoRow icon="location-outline" text={item.city || item.address || '—'} />
          {item.notes && <InfoRow icon="chatbubble-outline" text={item.notes} />}
          {item.total_amount && (
            <InfoRow icon="wallet-outline" text={'PKR ' + Number(item.total_amount).toLocaleString()} />
          )}
        </View>

        {/* Actions */}
        {isCancelling
          ? <ActivityIndicator style={{ marginTop: 14 }} color={PRIMARY} />
          : item.status === 'pending' || item.status === 'confirmed'
            ? (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.booking_id)}>
                <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              </TouchableOpacity>
            ) : null}

        {/* Booking ID */}
        <Text style={styles.bookingId}>Booking #{item.booking_id}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ServiceBrowse')} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Login prompt if not authenticated */}
      {!isAuthenticated ? (
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={56} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 }}>
            Please log in to view and manage your bookings.
          </Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.browseBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <>
      {/* Filter tabs */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View>
        : (
          <FlatList
            data={bookings}
            keyExtractor={(item, i) => (item.booking_id?.toString() ?? i.toString())}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[PRIMARY]} />}
            ListEmptyComponent={() => (
              <View style={styles.center}>
                <Ionicons name="calendar-outline" size={52} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No {filter !== 'all' ? filter + ' ' : ''}bookings yet</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('ServiceBrowse')}>
                  <Text style={styles.browseBtnText}>Browse Services</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </>
      )}
    </SafeAreaView>
  );
};

const InfoRow = ({ icon, text }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
    <Ionicons name={icon} size={14} color="#6B7280" style={{ marginTop: 1 }} />
    <Text style={{ fontSize: 13, color: '#374151', flex: 1 }} numberOfLines={2}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F3F4F6' },
  header:         { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  tab:            { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  tabActive:      { backgroundColor: PRIMARY },
  tabText:        { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  tabTextActive:  { color: '#fff', fontWeight: '700' },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  providerName:   { fontSize: 15, fontWeight: '700', color: '#111827' },
  serviceName:    { fontSize: 12, color: PRIMARY, marginTop: 2, fontWeight: '600' },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText:     { fontSize: 11, fontWeight: '700' },
  divider:        { height: 1, backgroundColor: '#F3F4F6', marginBottom: 10 },
  cancelBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14, paddingVertical: 10, backgroundColor: '#FEF2F2', borderRadius: 10 },
  cancelBtnText:  { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  bookingId:      { fontSize: 11, color: '#9CA3AF', marginTop: 10, textAlign: 'right' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle:     { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  browseBtn:      { marginTop: 16, backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default MyBookings;
