/**
 * ServiceBookingsScreen.js
 * API §7 — provider-side booking management
 *   GET /api/service/bookings?status=pending  OR  ?date=2026-04-10
 *   PUT /api/service/bookings/:id/confirm    body: { total_amount }
 *   PUT /api/service/bookings/:id/reject     body: { reason }
 *   PUT /api/service/bookings/:id/complete   body: { payment_status }
 *   PUT /api/service/bookings/:id/cancel     body: { reason }
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal,
  TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import {
  getServiceBookings, confirmBooking, rejectBooking,
  completeBooking, cancelBookingByProvider,
} from '../api/serviceService';
import { StatusBadge, ServiceBottomNav } from './ServiceDashboardScreen';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

const ServiceBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings]           = useState([]);
  const [filter, setFilter]               = useState('all');
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [modal, setModal]                 = useState({ visible: false, type: null, id: null });
  const [modalInput, setModalInput]       = useState('');

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await getServiceBookings(params);
      if (res.success) {
        const raw = res.data?.data;
        setBookings(Array.isArray(raw) ? raw : (raw?.bookings ?? []));
      } else {
        Alert.alert('Error', res.error);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openModal = (type, id) => { setModalInput(''); setModal({ visible: true, type, id }); };
  const closeModal = () => setModal({ visible: false, type: null, id: null });

  const submitModal = async () => {
    const { type, id } = modal;
    closeModal();
    setActionLoading(id);
    let res;
    if (type === 'confirm') {
      const amount = parseFloat(modalInput);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Invalid', 'Enter a valid amount.'); setActionLoading(null); return;
      }
      res = await confirmBooking(id, amount);        // body: { total_amount }
    } else if (type === 'reject') {
      if (!modalInput.trim()) {
        Alert.alert('Required', 'Enter a rejection reason.'); setActionLoading(null); return;
      }
      res = await rejectBooking(id, modalInput.trim());  // body: { reason }
    } else if (type === 'cancel') {
      res = await cancelBookingByProvider(id, modalInput.trim() || 'Cancelled by provider');  // body: { reason }
    }
    setActionLoading(null);
    if (res?.success) { Alert.alert('Success', 'Done.'); load(); }
    else Alert.alert('Error', res?.error || 'Action failed.');
  };

  const handleComplete = (id) => {
    Alert.alert('Complete Booking', 'Mark as complete and confirm payment received?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setActionLoading(id);
          const res = await completeBooking(id, 'completed');  // body: { payment_status: "completed" }
          setActionLoading(null);
          if (res.success) { Alert.alert('Done', 'Booking completed!'); load(); }
          else Alert.alert('Error', res.error);
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const acting = actionLoading === item.booking_id;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customer_name || 'Customer'}</Text>
            {item.customer_phone ? <Text style={styles.subText}>{item.customer_phone}</Text> : null}
          </View>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.divider} />
        <View style={{ gap: 5 }}>
          <Row icon="calendar-outline" text={(item.slot_date || '—') + '  ' + (item.slot_time?.slice(0,5) || '')} />
          <Row icon="time-outline"     text={(item.duration_mins || 60) + ' mins'} />
          <Row icon="location-outline" text={item.city || item.address || '—'} />
          {item.notes       ? <Row icon="chatbubble-outline" text={item.notes} /> : null}
          {item.total_amount ? <Row icon="wallet-outline" text={'PKR ' + Number(item.total_amount).toLocaleString()} /> : null}
        </View>
        {acting
          ? <ActivityIndicator style={{ marginTop: 14 }} color={COLORS.primary} />
          : (
            <View style={styles.actionRow}>
              {item.status === 'pending' && (
                <>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => openModal('confirm', item.booking_id)}>
                    <Text style={styles.btnPrimaryText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDanger} onPress={() => openModal('reject', item.booking_id)}>
                    <Text style={styles.btnDangerText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.status === 'confirmed' && (
                <>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => handleComplete(item.booking_id)}>
                    <Text style={styles.btnPrimaryText}>Mark Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDanger} onPress={() => openModal('cancel', item.booking_id)}>
                    <Text style={styles.btnDangerText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
      </View>
    );
  };

  const mc = {
    confirm: { title: 'Total Amount (PKR)', placeholder: 'e.g. 5000', keyboard: 'numeric' },
    reject:  { title: 'Rejection Reason',   placeholder: 'e.g. Not available',  keyboard: 'default' },
    cancel:  { title: 'Cancellation Reason', placeholder: 'e.g. Emergency',     keyboard: 'default' },
  }[modal.type] || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:8,right:8,bottom:8,left:8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Filter tabs */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading
        ? <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        : (
          <FlatList
            data={bookings}
            keyExtractor={(item, i) => (item.booking_id?.toString() ?? i.toString())}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={50} color="#9CA3AF" />
                <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 12 }}>No {filter !== 'all' ? filter + ' ' : ''}bookings</Text>
              </View>
            )}
          />
        )}

      {/* Modal */}
      <Modal visible={modal.visible} transparent animationType="slide" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{mc.title}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={mc.placeholder}
              placeholderTextColor="#9CA3AF"
              keyboardType={mc.keyboard}
              value={modalInput}
              onChangeText={setModalInput}
              autoFocus
              multiline={modal.type !== 'confirm'}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.mCancelBtn} onPress={closeModal}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mSubmitBtn} onPress={submitModal}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ServiceBottomNav navigation={navigation} active="bookings" />
    </SafeAreaView>
  );
};

const Row = ({ icon, text }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
    <Ionicons name={icon} size={14} color="#6B7280" />
    <Text style={{ fontSize: 13, color: '#374151', flex: 1 }} numberOfLines={2}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F3F4F6' },
  header:       { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle:  { color: '#fff', fontSize: 18, fontWeight: '700' },
  tab:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  tabActive:    { backgroundColor: COLORS.primary },
  tabText:      { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  tabTextActive:{ color: '#fff', fontWeight: '700' },
  loadingBox:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subText:      { fontSize: 12, color: '#6B7280', marginTop: 2 },
  divider:      { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  actionRow:    { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnPrimary:   { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  btnPrimaryText:{ color: '#fff', fontSize: 13, fontWeight: '700' },
  btnDanger:    { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  btnDangerText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  emptyBox:     { paddingTop: 80, alignItems: 'center' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalInput:   { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 16, minHeight: 52 },
  mCancelBtn:   { flex: 1, backgroundColor: '#F3F4F6', padding: 14, borderRadius: 12, alignItems: 'center' },
  mSubmitBtn:   { flex: 1, backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
});

export default ServiceBookingsScreen;
