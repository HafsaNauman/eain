/**
 * ServiceAvailabilityScreen.js
 * API §7:
 *   GET    /api/service/availability
 *   POST   /api/service/availability
 *     Weekly: { day_of_week, start_time, end_time, slot_duration_mins, is_available: true }
 *     Block:  { specific_date, start_time: "00:00:00", end_time: "23:59:00", is_available: false }
 *   DELETE /api/service/availability/:availability_id
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { getMyAvailability, addAvailabilitySlot, removeAvailabilitySlot } from '../api/serviceService';
import { ServiceBottomNav } from './ServiceDashboardScreen';

// day_of_week values per guide: 0=Sunday, 1=Monday ... 6=Saturday
const DAYS      = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIMES     = ['07:00:00','08:00:00','09:00:00','10:00:00','11:00:00','12:00:00',
                   '13:00:00','14:00:00','15:00:00','16:00:00','17:00:00','18:00:00','19:00:00','20:00:00','21:00:00'];
const DURATIONS = [30, 45, 60, 90, 120];
const NEXT_DATES = Array.from({ length: 60 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i + 1); return d.toISOString().split('T')[0];
});

const ServiceAvailabilityScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [slots, setSlots]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [isBlockDate, setIsBlockDate] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm] = useState({
    day_of_week: 1, start_time: '10:00:00', end_time: '18:00:00',
    slot_duration_mins: 60, specific_date: NEXT_DATES[0],
  });

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) navigation.replace('Login');
  }, [isAuthenticated, navigation]);

  const load = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) return;
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await getMyAvailability();
      if (res.success) {
        const raw = res.data?.data;
        setSlots(Array.isArray(raw) ? raw : (raw?.slots ?? raw?.availability ?? []));
      } else Alert.alert('Error', res.error);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!isBlockDate && form.start_time >= form.end_time) {
      Alert.alert('Invalid Times', 'End time must be after start time.'); return;
    }
    setSaving(true);
    const payload = isBlockDate
      ? { specific_date: form.specific_date, start_time: '00:00:00', end_time: '23:59:00', is_available: false }
      : { day_of_week: form.day_of_week, start_time: form.start_time, end_time: form.end_time,
          slot_duration_mins: form.slot_duration_mins, is_available: true };
    const res = await addAvailabilitySlot(payload);
    setSaving(false);
    if (res.success) {
      Alert.alert('Success', isBlockDate ? 'Date blocked.' : 'Slot added.');
      setShowModal(false); load();
    } else Alert.alert('Error', res.error);
  };

  const handleRemove = (id) => Alert.alert('Remove', 'Remove this slot?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      const res = await removeAvailabilitySlot(id);
      if (res.success) load(); else Alert.alert('Error', res.error);
    }},
  ]);

  const weekly  = slots.filter(s => !s.specific_date && s.is_available !== false);
  const blocked = slots.filter(s => s.specific_date  || s.is_available === false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:8,right:8,bottom:8,left:8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Availability</Text>
        <TouchableOpacity onPress={() => { setIsBlockDate(false); setShowModal(true); }} hitSlop={{ top:8,right:8,bottom:8,left:8 }}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading
        ? <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={styles.blockBtn} onPress={() => { setIsBlockDate(true); setShowModal(true); }}>
              <Ionicons name="calendar-clear-outline" size={18} color="#DC2626" />
              <Text style={styles.blockBtnText}>Block a Date</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>📅 Weekly Schedule</Text>
            {weekly.length === 0
              ? <View style={styles.emptyCard}><Ionicons name="calendar-outline" size={36} color="#9CA3AF" /><Text style={styles.emptyText}>No weekly slots. Tap + to add.</Text></View>
              : weekly.map((s, i) => (
                <View key={s.availability_id ?? i} style={styles.slotCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayText}>{DAYS[s.day_of_week] || 'Day ' + s.day_of_week}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.primary, marginTop: 2 }}>
                      {s.start_time?.slice(0,5)}  –  {s.end_time?.slice(0,5)}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s.slot_duration_mins} min slots</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(s.availability_id)} hitSlop={{ top:8,right:8,bottom:8,left:8 }}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🚫 Blocked Dates</Text>
            {blocked.length === 0
              ? <View style={styles.emptyCard}><Text style={styles.emptyText}>No blocked dates</Text></View>
              : blocked.map((s, i) => (
                <View key={s.availability_id ?? i} style={[styles.slotCard, { borderLeftWidth: 4, borderLeftColor: '#DC2626' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayText}>{s.specific_date || 'Blocked'}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>All day unavailable</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(s.availability_id)} hitSlop={{ top:8,right:8,bottom:8,left:8 }}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
        )}

      {/* Add / Block Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>{isBlockDate ? 'Block a Date' : 'Add Slot'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={22} color="#374151" /></TouchableOpacity>
            </View>

            {/* Toggle */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Block specific date</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Mark a full day as unavailable</Text>
              </View>
              <Switch value={isBlockDate} onValueChange={setIsBlockDate} trackColor={{ true: '#DC2626', false: '#D1D5DB' }} thumbColor="#fff" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isBlockDate ? (
                <>
                  <Text style={styles.fieldLabel}>Select Date</Text>
                  <View style={styles.pickerWrap}>
                    <Picker selectedValue={form.specific_date} onValueChange={(v) => upd('specific_date', v)} style={{ height: 50, color: '#111827' }}>
                      {NEXT_DATES.map(d => <Picker.Item key={d} label={d} value={d} />)}
                    </Picker>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Day of Week</Text>
                  <View style={styles.pickerWrap}>
                    <Picker selectedValue={form.day_of_week} onValueChange={(v) => upd('day_of_week', v)} style={{ height: 50, color: '#111827' }}>
                      {DAYS.map((d, i) => <Picker.Item key={i} label={d} value={i} />)}
                    </Picker>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Start Time</Text>
                      <View style={styles.pickerWrap}>
                        <Picker selectedValue={form.start_time} onValueChange={(v) => upd('start_time', v)} style={{ height: 50, color: '#111827' }}>
                          {TIMES.map(t => <Picker.Item key={t} label={t.slice(0,5)} value={t} />)}
                        </Picker>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>End Time</Text>
                      <View style={styles.pickerWrap}>
                        <Picker selectedValue={form.end_time} onValueChange={(v) => upd('end_time', v)} style={{ height: 50, color: '#111827' }}>
                          {TIMES.map(t => <Picker.Item key={t} label={t.slice(0,5)} value={t} />)}
                        </Picker>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.fieldLabel}>Slot Duration</Text>
                  <View style={styles.pickerWrap}>
                    <Picker selectedValue={form.slot_duration_mins} onValueChange={(v) => upd('slot_duration_mins', v)} style={{ height: 50, color: '#111827' }}>
                      {DURATIONS.map(d => <Picker.Item key={d} label={d + ' minutes'} value={d} />)}
                    </Picker>
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isBlockDate ? 'Block Date' : 'Add Slot'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ServiceBottomNav navigation={navigation} active="availability" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F3F4F6' },
  header:       { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle:  { color: '#fff', fontSize: 18, fontWeight: '700' },
  loadingBox:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  blockBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  blockBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  slotCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  dayText:      { fontSize: 15, fontWeight: '700', color: '#111827' },
  emptyCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 28, alignItems: 'center', marginBottom: 10 },
  emptyText:    { color: '#6B7280', fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#111827' },
  toggleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 16 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  pickerWrap:   { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  saveBtn:      { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ServiceAvailabilityScreen;
