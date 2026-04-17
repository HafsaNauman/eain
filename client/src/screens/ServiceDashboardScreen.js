/**
 * ServiceDashboardScreen.js
 * API: GET /api/service/dashboard  (guide §7)
 *      GET /api/service/profile    (guide §7)
 * Exports: StatusBadge, ServiceBottomNav  (shared across all 4 screens)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getServiceDashboard, getServiceProfile } from '../api/serviceService';
import { COLORS } from '../constants/colors';

const ServiceDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard]     = useState(null);
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      const [dashRes, profRes] = await Promise.all([
        getServiceDashboard(),
        getServiceProfile(),
      ]);
      if (dashRes.success) setDashboard(dashRes.data.data);
      else setError(dashRes.error || 'Failed to load dashboard data.');
      // profile may not exist yet — show null but don't crash
      if (profRes.success) setProfile(profRes.data.data?.profile ?? null);
      else setProfile(null); // profile not found — show gracefully
    } catch (e) { setError('Failed to load dashboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => Alert.alert('Logout', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Logout', style: 'destructive', onPress: logout },
  ]);

  const overview = dashboard?.overview || {};
  const statCards = [
    { label: 'Pending',          value: overview.pending_approvals ?? 0,  icon: 'time-outline',             color: '#F59E0B' },
    { label: 'Today',            value: overview.today_bookings    ?? 0,  icon: 'calendar-outline',         color: COLORS.primary },
    { label: 'Completed',        value: overview.monthly_completed ?? 0,  icon: 'checkmark-circle-outline', color: '#10B981' },
    { label: 'Active Services',  value: overview.active_services   ?? 0,  icon: 'storefront-outline',       color: '#6366F1' },
    {
      label: 'Monthly Earnings',
      value: 'PKR ' + (Number(overview.monthly_earnings) || 0).toLocaleString(),
      icon: 'wallet-outline', color: '#8B5CF6', wide: true,
    },
  ];

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.businessName}>Service Dashboard</Text></View>
      <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.businessName} numberOfLines={1}>
            {profile?.business_name_en || user?.full_name || 'Service Provider'}
          </Text>
          {profile && (
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: profile.is_active ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.statusText}>{profile.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {error.toLowerCase().includes('profile') && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('ServiceProfile')}
                  style={[styles.retryBtn, { backgroundColor: COLORS.primary }]}
                >
                  <Text style={styles.retryText}>Set Up Profile</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => loadData()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats */}
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.statsGrid}>
          {statCards.map((c) => (
            <View key={c.label} style={[styles.statCard, c.wide && styles.statCardWide]}>
              <View style={[styles.statIconWrap, { backgroundColor: c.color + '20' }]}>
                <Ionicons name={c.icon} size={22} color={c.color} />
              </View>
              <View style={c.wide ? { flex: 1 } : {}}>
                <Text style={styles.statValue}>{c.value}</Text>
                <Text style={styles.statLabel}>{c.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {[
            { label: 'Bookings', icon: 'calendar', screen: 'ServiceBookings' },
            { label: 'Schedule', icon: 'time',      screen: 'ServiceAvailability' },
            { label: 'Profile',  icon: 'person',    screen: 'ServiceProfile' },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => navigation.navigate(a.screen)}>
              <Ionicons name={a.icon} size={26} color={COLORS.primary} style={{ marginBottom: 6 }} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today */}
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {(dashboard?.todays_schedule?.length ?? 0) > 0
          ? dashboard.todays_schedule.map((b, i) => (
              <TouchableOpacity key={b.booking_id ?? i} style={styles.scheduleCard} onPress={() => navigation.navigate('ServiceBookings')}>
                <View style={[styles.timeTag, { backgroundColor: COLORS.primary + '15' }]}>
                  <Text style={styles.timeText}>{b.slot_time?.slice(0, 5) || '--:--'}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.customerName}>{b.customer_name || 'Customer'}</Text>
                  <Text style={styles.scheduleNote} numberOfLines={1}>{b.notes || 'No notes'}</Text>
                </View>
                <StatusBadge status={b.status} />
              </TouchableOpacity>
            ))
          : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>No bookings today</Text>
            </View>
          )}

        {/* Upcoming */}
        {(dashboard?.upcoming_bookings?.length ?? 0) > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {dashboard.upcoming_bookings.slice(0, 4).map((b, i) => (
              <TouchableOpacity key={b.booking_id ?? i} style={styles.scheduleCard} onPress={() => navigation.navigate('ServiceBookings')}>
                <View style={[styles.timeTag, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.timeText, { color: '#D97706' }]}>{b.slot_date}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.customerName}>{b.customer_name || 'Customer'}</Text>
                  <Text style={styles.scheduleNote}>{b.slot_time?.slice(0, 5) || ''}</Text>
                </View>
                <StatusBadge status={b.status} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
      <ServiceBottomNav navigation={navigation} active="dashboard" />
    </SafeAreaView>
  );
};

// ── Shared exports ───────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    pending:   { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
    confirmed: { bg: '#D1FAE5', color: '#059669', label: 'Confirmed' },
    completed: { bg: '#E0E7FF', color: '#4F46E5', label: 'Completed' },
    cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
    rejected:  { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: s.bg }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: s.color }}>{s.label}</Text>
    </View>
  );
};

export const ServiceBottomNav = ({ navigation, active }) => {
  const items = [
    { key: 'dashboard',    label: 'Home',     icon: 'grid-outline',     screen: 'ServiceDashboard' },
    { key: 'bookings',     label: 'Bookings', icon: 'calendar-outline', screen: 'ServiceBookings' },
    { key: 'availability', label: 'Schedule', icon: 'time-outline',     screen: 'ServiceAvailability' },
    { key: 'profile',      label: 'Profile',  icon: 'person-outline',   screen: 'ServiceProfile' },
  ];
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
                   backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 10 }}>
      {items.map((item) => {
        const a = active === item.key;
        return (
          <TouchableOpacity key={item.key} style={{ flex: 1, alignItems: 'center' }} onPress={() => navigation.navigate(item.screen)}>
            <Ionicons name={item.icon} size={22} color={a ? COLORS.primary : '#9CA3AF'} />
            <Text style={{ fontSize: 10, marginTop: 3, color: a ? COLORS.primary : '#9CA3AF' }}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F3F4F6' },
  loadingBox:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  greeting:     { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  businessName: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 2 },
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusText:   { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  logoutBtn:    { padding: 8 },
  scroll:       { padding: 16, paddingBottom: 88 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 8 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 14, width: '47.5%', elevation: 2 },
  statCardWide: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14 },
  statIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue:    { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel:    { fontSize: 11, color: '#6B7280', marginTop: 1 },
  actionsRow:   { flexDirection: 'row', gap: 10, marginBottom: 4 },
  actionBtn:    { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 18, alignItems: 'center', elevation: 2 },
  actionLabel:  { fontSize: 11, color: '#374151', fontWeight: '600' },
  scheduleCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1 },
  timeTag:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, minWidth: 72 },
  timeText:     { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  scheduleInfo: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  scheduleNote: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center', marginBottom: 10 },
  emptyText:    { marginTop: 8, color: '#6B7280', fontSize: 14 },
  errorBox:     { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  errorText:    { color: '#DC2626', fontSize: 13, flex: 1 },
  retryBtn:     { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryText:    { color: '#fff', fontWeight: '600', fontSize: 12 },
});

export default ServiceDashboardScreen;
