/**
 * ServiceProfileScreen.js
 *
 * API used:
 *   GET  /api/service/profile           → fetch existing profile
 *   POST /api/service/profile           → create profile
 *   PUT  /api/service/profile           → update profile
 *   POST /api/upload                    → upload logo / cover image
 *
 * Profile body (from guide §7):
 *   business_name_en, business_name_ur, description_en, description_ur?,
 *   category, city, area, is_female_only,
 *   media: { logo_url, cover_url }        ← URLs from /api/upload
 *
 * NOTE: Fields NOT in the API guide (min_price, max_price, experience_years,
 * whatsapp_number) have been removed to match the actual API exactly.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import {
  getServiceProfile,
  createServiceProfile,
  updateServiceProfile,
  uploadImage,
} from '../api/serviceService';
import { ServiceBottomNav } from './ServiceDashboardScreen';
import { useAuth } from '../context/AuthContext';

// Guide shows "category" field — these are common service categories
const SERVICE_CATEGORIES = [
  'Beauty & Wellness',
  'Hair & Makeup',
  'Bridal Services',
  'Home Cleaning',
  'Plumbing',
  'Electrical',
  'Tutoring & Education',
  'Catering & Chef',
  'Photography',
  'Tailoring & Stitching',
  'Healthcare & Nursing',
  'Fitness & Yoga',
  'Other',
];

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi',
  'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
  'Hyderabad', 'Sialkot',
];

const ServiceProfileScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [existingProfile, setExistingProfile] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});

  // Image upload states
  const [logoUri, setLogoUri]     = useState(null);
  const [coverUri, setCoverUri]   = useState(null);
  const [uploadingLogo, setUploadingLogo]   = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form state — only fields the API guide documents
  const [form, setForm] = useState({
    business_name_en: '',
    business_name_ur: '',
    description_en:   '',
    description_ur:   '',
    category:         SERVICE_CATEGORIES[0],
    city:             CITIES[0],
    area:             '',
    is_female_only:   false,
    // media URLs populated after upload
    logo_url:         '',
    cover_url:        '',
  });

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) navigation.replace('Login');
  }, [isAuthenticated, navigation]);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await getServiceProfile();
    if (res.success && res.data?.data?.profile) {
      const p = res.data.data.profile;
      setExistingProfile(p);
      setForm({
        business_name_en: p.business_name_en || '',
        business_name_ur: p.business_name_ur || '',
        description_en:   p.description_en   || '',
        description_ur:   p.description_ur   || '',
        category:         p.category         || SERVICE_CATEGORIES[0],
        city:             p.city             || CITIES[0],
        area:             p.area             || '',
        is_female_only:   p.is_female_only   || false,
        logo_url:         p.media?.logo_url  || '',
        cover_url:        p.media?.cover_url || '',
      });
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.business_name_en.trim()) e.business_name_en = 'Business name (English) is required.';
    if (!form.description_en.trim())   e.description_en   = 'Description is required.';
    if (!form.area.trim())             e.area             = 'Area / address is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Pick and upload image
  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    if (type === 'logo') {
      setLogoUri(uri);
      setUploadingLogo(true);
      const up = await uploadImage(uri);
      setUploadingLogo(false);
      if (up.success) {
        updateField('logo_url', up.url);
      } else {
        Alert.alert('Upload Failed', up.error || 'Could not upload logo image.');
      }
    } else {
      setCoverUri(uri);
      setUploadingCover(true);
      const up = await uploadImage(uri);
      setUploadingCover(false);
      if (up.success) {
        updateField('cover_url', up.url);
      } else {
        Alert.alert('Upload Failed', up.error || 'Could not upload cover image.');
      }
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    // Build payload exactly as documented in guide §7
    const payload = {
      business_name_en: form.business_name_en.trim(),
      business_name_ur: form.business_name_ur.trim() || undefined,
      description_en:   form.description_en.trim(),
      description_ur:   form.description_ur.trim() || undefined,
      category:         form.category,
      city:             form.city,
      area:             form.area.trim(),
      is_female_only:   form.is_female_only,
      media: {
        logo_url:  form.logo_url  || undefined,
        cover_url: form.cover_url || undefined,
      },
    };

    // Use POST to create, PUT to update (per guide §7)
    const res = existingProfile
      ? await updateServiceProfile(payload)
      : await createServiceProfile(payload);

    setSaving(false);

    if (res.success) {
      Alert.alert(
        'Success',
        `Profile ${existingProfile ? 'updated' : 'created'} successfully!`,
        [{ text: 'OK', onPress: () => navigation.navigate('ServiceDashboard') }]
      );
    } else {
      Alert.alert('Error', res.error || 'Failed to save profile.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Profile</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingProfile ? 'Edit Profile' : 'Create Profile'}</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Cover Photo ──────────────────────── */}
          <TouchableOpacity style={styles.coverWrap} onPress={() => pickImage('cover')}>
            {(coverUri || form.cover_url) ? (
              <Image source={{ uri: coverUri || form.cover_url }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                <Text style={styles.coverHint}>Tap to add cover photo</Text>
              </View>
            )}
            {uploadingCover && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.coverEditBadge}>
              <Ionicons name="camera-outline" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* ── Logo ─────────────────────────────── */}
          <View style={styles.logoRow}>
            <TouchableOpacity style={styles.logoWrap} onPress={() => pickImage('logo')}>
              {(logoUri || form.logo_url) ? (
                <Image source={{ uri: logoUri || form.logo_url }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="storefront-outline" size={28} color="#9CA3AF" />
                </View>
              )}
              {uploadingLogo && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <Text style={styles.logoLabel}>Business Logo</Text>
              <Text style={styles.logoHint}>Square image, PNG or JPG</Text>
            </View>
          </View>

          {/* ── Business Info ──────────────────── */}
          <Text style={styles.sectionTitle}>Business Information</Text>
          <View style={styles.card}>
            <CustomInput
              label="Business Name (English) *"
              value={form.business_name_en}
              onChangeText={(v) => updateField('business_name_en', v)}
              placeholder="e.g. Sara Beauty Studio"
              error={errors.business_name_en}
              autoCapitalize="words"
            />
            <CustomInput
              label="Business Name (Urdu)"
              value={form.business_name_ur}
              onChangeText={(v) => updateField('business_name_ur', v)}
              placeholder="سارہ بیوٹی اسٹوڈیو"
            />
            <Text style={styles.fieldLabel}>Service Category *</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.category}
                onValueChange={(v) => updateField('category', v)}
                style={styles.picker}
              >
                {SERVICE_CATEGORIES.map(c => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>
          </View>

          {/* ── Description ───────────────────── */}
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.card}>
            <CustomInput
              label="Description (English) *"
              value={form.description_en}
              onChangeText={(v) => updateField('description_en', v)}
              placeholder="Describe your services in detail..."
              multiline
              numberOfLines={4}
              error={errors.description_en}
              style={{ height: 90, textAlignVertical: 'top' }}
            />
            <CustomInput
              label="Description (Urdu)"
              value={form.description_ur}
              onChangeText={(v) => updateField('description_ur', v)}
              placeholder="اپنی خدمات کی تفصیل لکھیں..."
              multiline
              numberOfLines={4}
              style={{ height: 90, textAlignVertical: 'top' }}
            />
          </View>

          {/* ── Location ──────────────────────── */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>City *</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.city}
                onValueChange={(v) => updateField('city', v)}
                style={styles.picker}
              >
                {CITIES.map(c => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>
            <CustomInput
              label="Area / Address *"
              value={form.area}
              onChangeText={(v) => updateField('area', v)}
              placeholder="e.g. Clifton, Block 4"
              error={errors.area}
            />
          </View>

          {/* ── Preferences ───────────────────── */}
          <Text style={styles.sectionTitle}>Service Preferences</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.switchLabel}>Female Clients Only</Text>
                <Text style={styles.switchSub}>Your profile will only be visible to female customers</Text>
              </View>
              <Switch
                value={form.is_female_only}
                onValueChange={(v) => updateField('is_female_only', v)}
                trackColor={{ true: COLORS.primary, false: '#D1D5DB' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* ── Save ─────────────────────────── */}
          <View style={{ marginTop: 8, marginBottom: 32 }}>
            <CustomButton
              title={saving ? 'Saving...' : existingProfile ? 'Update Profile' : 'Create Profile'}
              onPress={handleSave}
              disabled={saving || uploadingLogo || uploadingCover}
              loading={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ServiceBottomNav navigation={navigation} active="profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F3F4F6' },
  header:           { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle:      { color: '#fff', fontSize: 18, fontWeight: '700' },
  loadingBox:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:           { paddingBottom: 100 },
  // Cover
  coverWrap:        { width: '100%', height: 160, position: 'relative' },
  coverImage:       { width: '100%', height: 160, resizeMode: 'cover' },
  coverPlaceholder: { width: '100%', height: 160, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  coverHint:        { color: '#9CA3AF', fontSize: 13, marginTop: 6 },
  coverEditBadge:   { position: 'absolute', bottom: 10, right: 12, backgroundColor: COLORS.primary, borderRadius: 20, padding: 6 },
  uploadOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  // Logo
  logoRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  logoWrap:         { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: '#E5E7EB' },
  logoImage:        { width: 72, height: 72, resizeMode: 'cover' },
  logoPlaceholder:  { width: 72, height: 72, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  logoLabel:        { fontSize: 14, fontWeight: '600', color: '#111827' },
  logoHint:         { fontSize: 11, color: '#6B7280', marginTop: 3 },
  // Form
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginTop: 16, marginBottom: 10 },
  card:             { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  fieldLabel:       { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  pickerWrap:       { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  picker:           { height: 50, color: '#111827' },
  switchRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  switchLabel:      { fontSize: 14, fontWeight: '600', color: '#111827' },
  switchSub:        { fontSize: 12, color: '#6B7280', marginTop: 2 },
});

export default ServiceProfileScreen;
