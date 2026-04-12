/**
 * ServiceProviderDetail.js  → src/screens/service/ServiceProviderDetail.js
 * Params: { vendor_id, listing }
 * API:
 *   GET /api/bookings/providers/:vendor_id/availability?date=YYYY-MM-DD
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProviderAvailability } from '../../api/bookingService';

const PRIMARY = '#036c5f';

// Generate next 14 date options
const generateDates = () => {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' }),
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en-PK', { weekday: 'short' }),
    };
  });
};

const DATES = generateDates();

const ServiceProviderDetail = ({ route, navigation }) => {
  const { vendor_id, listing } = route.params;
  const [selectedDate, setSelectedDate]   = useState(null);
  const [slots, setSlots]                 = useState([]);
  const [loadingSlots, setLoadingSlots]   = useState(false);
  const [selectedSlot, setSelectedSlot]   = useState(null);
  const [slotsError, setSlotsError]       = useState('');

  const coverUrl = listing?.Vendor?.media?.cover_url || listing?.media?.[0]?.url;
  const logoUrl  = listing?.Vendor?.media?.logo_url;

  const fetchSlots = useCallback(async (dateIso) => {
    setLoadingSlots(true);
    setSlots([]);
    setSlotsError('');
    setSelectedSlot(null);
    const res = await getProviderAvailability(vendor_id, dateIso);
    if (res.success) {
      const raw = res.data?.data;
      const slotArr = raw?.slots ?? raw?.availability ?? (Array.isArray(raw) ? raw : []);
      // Only show is_available: true slots
      setSlots(slotArr.filter(s => s.is_available !== false));
    } else {
      setSlotsError(res.error);
    }
    setLoadingSlots(false);
  }, [vendor_id]);

  const handleSelectDate = (d) => {
    setSelectedDate(d.iso);
    fetchSlots(d.iso);
  };

  const handleBook = () => {
    if (!selectedDate) { Alert.alert('Select Date', 'Please select a date first.'); return; }
    if (!selectedSlot)  { Alert.alert('Select Slot', 'Please select a time slot.'); return; }
    navigation.navigate('ServiceBookingForm', {
      vendor_id,
      listing,
      slot_date: selectedDate,
      slot_time: selectedSlot.start_time,
      duration_mins: selectedSlot.slot_duration_mins ?? 60,
    });
  };

  // Build display time slots from availability windows
  const buildTimeSlots = (slot) => {
    // Each availability record represents a window; break into slot_duration_mins chunks
    const times = [];
    if (!slot.start_time || !slot.end_time || !slot.slot_duration_mins) return [slot];
    const [sh, sm] = slot.start_time.split(':').map(Number);
    const [eh, em] = slot.end_time.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + slot.slot_duration_mins <= end) {
      const hh = Math.floor(cur / 60).toString().padStart(2, '0');
      const mm = (cur % 60).toString().padStart(2, '0');
      times.push({
        ...slot,
        start_time: `${hh}:${mm}:00`,
        displayTime: `${hh}:${mm}`,
      });
      cur += slot.slot_duration_mins;
    }
    return times.length > 0 ? times : [slot];
  };

  const timeSlots = slots.flatMap(buildTimeSlots);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          {coverUrl
            ? <Image source={{ uri: coverUrl }} style={styles.coverImg} />
            : <View style={[styles.coverImg, { backgroundColor: '#A8C8BC', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={48} color="#fff" />
              </View>}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          {logoUrl && <Image source={{ uri: logoUrl }} style={styles.logo} />}
          <Text style={styles.title}>
            {listing?.title_en || listing?.Vendor?.business_name_en || 'Service Provider'}
          </Text>
          {listing?.Vendor?.business_name_en && listing?.title_en && (
            <Text style={styles.vendorName}>{listing.Vendor.business_name_en}</Text>
          )}
          <View style={styles.metaRow}>
            {(listing?.Vendor?.city || listing?.city) && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={PRIMARY} />
                <Text style={styles.metaText}>{listing?.Vendor?.city || listing?.city}</Text>
              </View>
            )}
            {listing?.category && (
              <View style={styles.metaItem}>
                <Ionicons name="pricetag-outline" size={14} color={PRIMARY} />
                <Text style={styles.metaText}>{listing.category}</Text>
              </View>
            )}
            {listing?.is_female_only && (
              <View style={[styles.metaItem, { backgroundColor: '#FEE2E2', paddingHorizontal: 8, borderRadius: 10 }]}>
                <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '700' }}>♀ Ladies Only</Text>
              </View>
            )}
          </View>
          {listing?.price && (
            <Text style={styles.price}>PKR {Number(listing.price).toLocaleString()}</Text>
          )}
          {(listing?.description_en) && (
            <Text style={styles.description}>{listing.description_en}</Text>
          )}
        </View>

        {/* Date picker */}
        <Text style={styles.sectionTitle}>Select a Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {DATES.map(d => (
            <TouchableOpacity
              key={d.iso}
              style={[styles.dateCard, selectedDate === d.iso && styles.dateCardActive]}
              onPress={() => handleSelectDate(d)}
            >
              <Text style={[styles.dateDayName, selectedDate === d.iso && { color: '#fff' }]}>{d.dayName}</Text>
              <Text style={[styles.dateDayNum, selectedDate === d.iso && { color: '#fff' }]}>{d.dayNum}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time slots */}
        {selectedDate && (
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Available Slots</Text>
            {loadingSlots
              ? <ActivityIndicator color={PRIMARY} style={{ marginTop: 12 }} />
              : slotsError
                ? <Text style={{ color: '#DC2626', fontSize: 13 }}>{slotsError}</Text>
                : timeSlots.length === 0
                  ? (
                    <View style={styles.noSlots}>
                      <Ionicons name="time-outline" size={36} color="#9CA3AF" />
                      <Text style={{ color: '#6B7280', marginTop: 8, fontSize: 14 }}>No slots available for this date</Text>
                    </View>
                  )
                  : (
                    <View style={styles.slotsGrid}>
                      {timeSlots.map((s, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[styles.slotChip, selectedSlot?.start_time === s.start_time && styles.slotChipActive]}
                          onPress={() => setSelectedSlot(s)}
                        >
                          <Text style={[styles.slotText, selectedSlot?.start_time === s.start_time && { color: '#fff' }]}>
                            {s.displayTime || s.start_time?.slice(0,5)}
                          </Text>
                          {s.slot_duration_mins && (
                            <Text style={[styles.slotDur, selectedSlot?.start_time === s.start_time && { color: 'rgba(255,255,255,0.8)' }]}>
                              {s.slot_duration_mins} min
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
          </View>
        )}
      </ScrollView>

      {/* Book CTA */}
      <View style={styles.ctaBar}>
        <View style={{ flex: 1 }}>
          {selectedDate && selectedSlot
            ? <Text style={styles.ctaSummary}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })}
                {'  ·  '}{selectedSlot.displayTime || selectedSlot.start_time?.slice(0,5)}
              </Text>
            : <Text style={styles.ctaHint}>Pick a date & slot to continue</Text>}
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, (!selectedDate || !selectedSlot) && { opacity: 0.5 }]}
          onPress={handleBook}
          disabled={!selectedDate || !selectedSlot}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F3F4F6' },
  coverWrap:      { position: 'relative' },
  coverImg:       { width: '100%', height: 200 },
  backBtn:        { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 7 },
  infoCard:       { backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 18, elevation: 2 },
  logo:           { width: 56, height: 56, borderRadius: 28, marginBottom: 10, borderWidth: 2, borderColor: '#E5E7EB' },
  title:          { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 2 },
  vendorName:     { fontSize: 13, color: PRIMARY, fontWeight: '600', marginBottom: 8 },
  metaRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  metaItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:       { fontSize: 13, color: '#6B7280' },
  price:          { fontSize: 18, fontWeight: '800', color: PRIMARY, marginBottom: 8 },
  description:    { fontSize: 13, color: '#4B5563', lineHeight: 20, marginTop: 4 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 10 },
  dateCard:       { width: 58, height: 70, backgroundColor: '#fff', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB' },
  dateCardActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  dateDayName:    { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  dateDayNum:     { fontSize: 22, fontWeight: '800', color: '#111827' },
  noSlots:        { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', borderRadius: 14 },
  slotsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip:       { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', minWidth: 80 },
  slotChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  slotText:       { fontSize: 13, fontWeight: '700', color: '#111827' },
  slotDur:        { fontSize: 10, color: '#6B7280', marginTop: 2 },
  ctaBar:         { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12, elevation: 10 },
  ctaSummary:     { fontSize: 14, fontWeight: '700', color: '#111827' },
  ctaHint:        { fontSize: 13, color: '#9CA3AF' },
  bookBtn:        { backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  bookBtnText:    { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default ServiceProviderDetail;
