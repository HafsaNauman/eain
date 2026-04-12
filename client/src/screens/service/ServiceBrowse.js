/**
 * ServiceBrowse.js  → src/screens/service/ServiceBrowse.js
 * API: GET /api/catalog/listings?listing_type=service&q=...&city=...&category=...
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getServiceListings } from '../../api/bookingService';

const PRIMARY = '#036c5f';
const CITIES = ['All Cities','Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar'];
const SERVICE_CATS = ['All','Makeup','Photography','Mehndi','Catering','Decor','Tailoring','Hair','Nails'];

const ServiceBrowse = ({ navigation }) => {
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [city, setCity]             = useState('All Cities');
  const [category, setCategory]     = useState('All');
  const [searchTimer, setSearchTimer] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      const params = {};
      if (search.trim())         params.q = search.trim();
      if (city !== 'All Cities') params.city = city;
      if (category !== 'All')    params.category = category;
      const res = await getServiceListings(params);
      if (res.success) {
        const raw = res.data?.data;
        setListings(Array.isArray(raw) ? raw : (raw?.listings ?? []));
      } else setError(res.error);
    } catch { setError('Failed to load services.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [search, city, category]);

  useEffect(() => {
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => load(), 500);
    setSearchTimer(t);
    return () => clearTimeout(t);
  }, [search, city, category]);

  const renderCard = ({ item }) => {
    const logo = item.Vendor?.media?.logo_url || item.media?.[0]?.url;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ServiceProviderDetail', {
          vendor_id: item.vendor_id || item.Vendor?.vendor_id,
          listing: item,
        })}
        activeOpacity={0.85}
      >
        <View style={styles.cardImageWrap}>
          {logo
            ? <Image source={{ uri: logo }} style={styles.cardImage} />
            : <View style={[styles.cardImage, styles.placeholderImg]}>
                <Ionicons name="storefront-outline" size={32} color="#9CA3AF" />
              </View>}
          {item.is_female_only && (
            <View style={styles.femBadge}>
              <Text style={styles.femText}>♀ Ladies Only</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title_en || item.Vendor?.business_name_en || 'Service Provider'}
          </Text>
          {item.Vendor?.business_name_en && item.title_en && (
            <Text style={styles.cardVendor} numberOfLines={1}>{item.Vendor.business_name_en}</Text>
          )}
          <View style={styles.cardMeta}>
            {item.Vendor?.city || item.city
              ? <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text style={styles.metaText}>{item.Vendor?.city || item.city}</Text>
                </View>
              : null}
            {item.category
              ? <View style={[styles.metaRow, { marginLeft: 8 }]}>
                  <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
                  <Text style={styles.metaText}>{item.category}</Text>
                </View>
              : null}
          </View>
          {item.price && (
            <Text style={styles.cardPrice}>PKR {Number(item.price).toLocaleString()}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Services</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyBookings')} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search makeup, photography..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* City filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CITIES.map(c => (
          <TouchableOpacity key={c} style={[styles.chip, city === c && styles.chipActive]} onPress={() => setCity(c)}>
            <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingTop: 0 }]}>
        {SERVICE_CATS.map(cat => (
          <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading
        ? <View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View>
        : error
          ? <View style={styles.center}>
              <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          : (
            <FlatList
              data={listings}
              keyExtractor={(item, i) => (item.listing_id?.toString() ?? i.toString())}
              renderItem={renderCard}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[PRIMARY]} />}
              ListEmptyComponent={() => (
                <View style={styles.center}>
                  <Ionicons name="storefront-outline" size={52} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No services found</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Try a different city or category</Text>
                </View>
              )}
            />
          )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F3F4F6' },
  header:          { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle:     { color: '#fff', fontSize: 18, fontWeight: '700' },
  searchWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, elevation: 2 },
  searchInput:     { flex: 1, fontSize: 15, color: '#111827' },
  chips:           { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip:            { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive:      { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText:        { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  chipTextActive:  { color: '#fff', fontWeight: '700' },
  card:            { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', elevation: 2 },
  cardImageWrap:   { position: 'relative' },
  cardImage:       { width: 90, height: 90 },
  placeholderImg:  { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  femBadge:        { position: 'absolute', top: 4, left: 4, backgroundColor: '#E8B5A3', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  femText:         { fontSize: 9, color: '#7C3D2D', fontWeight: '700' },
  cardBody:        { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle:       { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  cardVendor:      { fontSize: 12, color: PRIMARY, marginBottom: 4 },
  cardMeta:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  metaRow:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:        { fontSize: 11, color: '#6B7280' },
  cardPrice:       { fontSize: 13, fontWeight: '700', color: PRIMARY },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  errorText:       { color: '#DC2626', fontSize: 14, textAlign: 'center', marginTop: 12 },
  emptyText:       { fontSize: 15, color: '#6B7280', marginTop: 12, fontWeight: '600' },
  retryBtn:        { marginTop: 14, backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
});

export default ServiceBrowse;
