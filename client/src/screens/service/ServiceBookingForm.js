/**
 * ServiceBookingForm.js  → src/screens/service/ServiceBookingForm.js
 * Params: { vendor_id, listing, slot_date, slot_time, duration_mins }
 * API: POST /api/bookings
 *   body: { vendor_id, listing_id?, slot_date, slot_time, duration_mins,
 *            customer_phone, address, city, notes, payment_method }
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { createBooking } from '../../api/bookingService';

const PRIMARY = '#036c5f';
const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta'];
const PAYMENT_METHODS = [
  { label: 'Cash on Day (COD)', value: 'cod' },
  { label: 'Bank Transfer',     value: 'bank_transfer' },
];

const ServiceBookingForm = ({ route, navigation }) => {
  const { vendor_id, listing, slot_date, slot_time, duration_mins } = route.params;

  const [form, setForm] = useState({
    customer_phone: '',
    address: '',
    city: 'Karachi',
    notes: '',
    payment_method: 'cod',
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const upd = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    const phone = form.customer_phone.trim();
    if (!phone) e.customer_phone = 'Phone number is required.';
    else if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) e.customer_phone = 'Enter a valid phone number.';
    if (!form.address.trim()) e.address = 'Address is required.';
    if (!form.city) e.city = 'City is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const payload = {
      vendor_id,
      slot_date,
      slot_time,
      duration_mins,
      customer_phone: form.customer_phone.trim(),
      address:        form.address.trim(),
      city:           form.city,
      notes:          form.notes.trim() || undefined,
      payment_method: form.payment_method,
    };
    if (listing?.listing_id) payload.listing_id = listing.listing_id;

    const res = await createBooking(payload);
    setLoading(false);
    if (res.success) {
      Alert.alert(
        '🎉 Booking Sent!',
        'Your request has been sent to the provider. You will be notified once they confirm.',
        [{ text: 'View My Bookings', onPress: () => navigation.navigate('MyBookings') },
         { text: 'Done', onPress: () => navigation.navigate('ServiceBrowse') }]
      );
    } else {
      Alert.alert('Booking Failed', res.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Booking summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {listing?.title_en || listing?.Vendor?.business_name_en || 'Service'}
          </Text>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
            <Text style={styles.summaryText}>{slot_date}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={16} color={PRIMARY} />
            <Text style={styles.summaryText}>{slot_time?.slice(0,5)}  ·  {duration_mins} minutes</Text>
          </View>
          {listing?.price && (
            <View style={styles.summaryRow}>
              <Ionicons name="wallet-outline" size={16} color={PRIMARY} />
              <Text style={styles.summaryText}>PKR {Number(listing.price).toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Phone */}
        <Field label="Your Phone Number *" error={errors.customer_phone}>
          <View style={[styles.phoneRow, errors.customer_phone && styles.inputError]}>
            <Text style={styles.prefix}>+92</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="3xx xxxxxxx"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={form.customer_phone}
              onChangeText={v => upd('customer_phone', v)}
              maxLength={13}
            />
          </View>
        </Field>

        {/* Address */}
        <Field label="Your Address *" error={errors.address}>
          <TextInput
            style={[styles.input, errors.address && styles.inputError, { height: 80, textAlignVertical: 'top' }]}
            placeholder="House number, street, area..."
            placeholderTextColor="#9CA3AF"
            value={form.address}
            onChangeText={v => upd('address', v)}
            multiline
          />
        </Field>

        {/* City */}
        <Field label="City *" error={errors.city}>
          <View style={[styles.pickerWrap, errors.city && styles.inputError]}>
            <Picker selectedValue={form.city} onValueChange={v => upd('city', v)} style={{ height: 50, color: '#111827' }}>
              {CITIES.map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
        </Field>

        {/* Notes */}
        <Field label="Special Notes (Optional)">
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="E.g. Bridal makeup for nikah ceremony..."
            placeholderTextColor="#9CA3AF"
            value={form.notes}
            onChangeText={v => upd('notes', v)}
            multiline
          />
        </Field>

        {/* Payment */}
        <Field label="Payment Method">
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map(pm => (
              <TouchableOpacity
                key={pm.value}
                style={[styles.paymentBtn, form.payment_method === pm.value && styles.paymentBtnActive]}
                onPress={() => upd('payment_method', pm.value)}
              >
                <Ionicons
                  name={pm.value === 'cod' ? 'cash-outline' : 'card-outline'}
                  size={18}
                  color={form.payment_method === pm.value ? '#fff' : '#6B7280'}
                />
                <Text style={[styles.paymentText, form.payment_method === pm.value && { color: '#fff' }]}>
                  {pm.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Note */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color={PRIMARY} />
          <Text style={styles.noteText}>
            Your booking will be in <Text style={{ fontWeight: '700' }}>Pending</Text> status until the provider confirms. You will receive a notification.
          </Text>
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Send Booking Request</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({ label, error, children }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {!!error && <Text style={styles.fieldError}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F3F4F6' },
  header:          { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle:     { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll:          { padding: 16, paddingBottom: 40 },
  summaryCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: PRIMARY, elevation: 2 },
  summaryTitle:    { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },
  summaryRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  summaryText:     { fontSize: 14, color: '#374151', fontWeight: '500' },
  fieldLabel:      { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldError:      { fontSize: 12, color: '#DC2626', marginTop: 4 },
  input:           { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827' },
  inputError:      { borderColor: '#DC2626' },
  phoneRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, height: 52 },
  prefix:          { fontSize: 15, fontWeight: '600', color: '#374151', paddingRight: 10, borderRightWidth: 1, borderRightColor: '#E5E7EB', marginRight: 10 },
  phoneInput:      { flex: 1, fontSize: 15, color: '#111827' },
  pickerWrap:      { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  paymentRow:      { flexDirection: 'row', gap: 12 },
  paymentBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, justifyContent: 'center' },
  paymentBtnActive:{ backgroundColor: PRIMARY, borderColor: PRIMARY },
  paymentText:     { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  noteBox:         { flexDirection: 'row', gap: 8, backgroundColor: '#E8F5F2', borderRadius: 12, padding: 14, marginBottom: 20 },
  noteText:        { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
  submitBtn:       { backgroundColor: PRIMARY, borderRadius: 16, padding: 18, alignItems: 'center' },
  submitText:      { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default ServiceBookingForm;
