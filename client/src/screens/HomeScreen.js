

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { getAllListings, searchListings } from '../api/catalogService';
import { useTranslation } from 'react-i18next';
import { startRecording, stopRecording } from '../utils/audioRecorder';
import { transcribeAudio } from '../api/sttService';
import StockIndicator from '../components/StockIndicator';
import { useAuth } from '../context/AuthContext';

const categories = ['All', 'Electronics', 'Fashion & Apparel', 'Home & Garden', 'Health & Beauty', 'Sports & Fitness', 'Food & Beverage'];
const cities = ['All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

function HomeScreen() {
  const { i18n, t } = useTranslation();
  const { isAdmin } = useAuth();
  const isUrdu = i18n.language === 'ur';
  const navigation = useNavigation();
  const [selectedStockFilter, setSelectedStockFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSort, setSelectedSort] = useState('created_at');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTimer, setSearchTimer] = useState(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceRecordingRef, setVoiceRecordingRef] = useState(null);

  const sortOptions = [
    { label: t('homeScreen.newestFirst'), value: 'created_at' },
    { label: t('homeScreen.priceLowToHigh'), value: 'price_asc' },
    { label: t('homeScreen.priceHighToLow'), value: 'price_desc' },
    { label: 'Stock Available', value: 'stock_available' },
  ];

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => fetchListings(), 500);
    setSearchTimer(timer);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedCity, selectedSort, selectedStockFilter]);

  const fetchListings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (products.length === 0) {
        setLoading(true);
      }
      setError('');
      const filters = { limit: 50, offset: 0 };
      if (searchQuery.trim()) filters.q = searchQuery.trim();
      if (selectedCategory !== 'All') filters.category = selectedCategory;
      if (selectedCity !== 'All Cities') filters.city = selectedCity;
      if (selectedSort !== 'created_at') filters.sort = selectedSort;
      if (selectedStockFilter !== 'all') filters.stock_status = selectedStockFilter;

      const hasFilters =
        selectedCategory !== 'All' ||
        selectedCity !== 'All Cities' ||
        selectedSort !== 'created_at';

      const result = hasFilters
        ? await searchListings(filters)
        : await getAllListings(filters);

      if (result.success) {
        setProducts(result.data.listings);
        console.log(`✅ Loaded ${result.data.listings.length} products`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Fetch Error:', err);
      setError(t('errors.networkError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => fetchListings(true);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCity('All Cities');
    setSelectedSort('created_at');
    setSelectedStockFilter('all');
    setShowFilters(false);
  };
  const handleVoiceSearch = async () => {
    // ── STOP recording ───────────────────────────────────────────────────
    if (isVoiceRecording) {
      setIsVoiceRecording(false);
      setIsVoiceProcessing(true);
      try {
        const audioUri = await stopRecording(voiceRecordingRef);
        const currentLanguage = i18n.language;

        const result = await transcribeAudio(audioUri, {
          encoding: 'LINEAR16',
          sampleRateHertz: 44100,
          languageCode: 'en-IN',
          fieldType: 'search',
        });

        if (result.success) {
          // searchQuery = Urdu-normalized (e.g. "jhumka" → "earrings")
          // rawTranscript = what the user actually said — show this in bar
          const normalized = result.data?.searchQuery || result.data?.transcript || '';
          const displayText = result.data?.rawTranscript || result.data?.transcript || '';

          if (normalized.trim()) {
            setSearchQuery(normalized.trim());       // triggers catalog fetch
            console.log(`🎤 Voice search: "${displayText}" → normalized: "${normalized}"`);
          } else {
            Alert.alert('No speech detected', 'Please try again and speak clearly.');
          }
        } else {
          Alert.alert('Voice search failed', result.error || 'Could not transcribe audio.');
        }
      } catch (err) {
        console.error('❌ Voice search error:', err);
        Alert.alert('Error', 'Voice search failed. Please try again.');
      } finally {
        setIsVoiceProcessing(false);
        setVoiceRecordingRef(null);
      }
      return;
    }

    // ── START recording ───────────────────────────────────────────────────
    try {
      const recording = await startRecording();
      setVoiceRecordingRef(recording);
      setIsVoiceRecording(true);
    } catch (err) {
      console.error('❌ Start recording error:', err);
      Alert.alert('Microphone Error', err.message || 'Could not start recording.');
    }
  };


  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product) => {
    if (product.track_inventory && product.stock_quantity <= (product.reserved_quantity || 0)) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.', [{ text: 'OK' }]);
      return;
    }
    const available = product.stock_quantity - (product.reserved_quantity || 0);
    const maxQuantity = available || 999;
    const existing = cart.find(item => item.listing_id === product.listing_id);
    let newQuantity = existing ? existing.quantity + 1 : 1;
    if (newQuantity > maxQuantity) {
      Alert.alert('Stock Limit', `Only ${maxQuantity} items available.`, [{ text: 'OK' }]);
      return;
    }
    if (existing) {
      setCart(cart.map(item =>
        item.listing_id === product.listing_id ? { ...item, quantity: newQuantity } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    const productName = isUrdu && product.title_ur ? product.title_ur : product.title_en;
    Alert.alert(t('homeScreen.addedToCart'), `${productName} ${t('homeScreen.cartMessage')}`);
  };

  const toggleWishlist = (product) => {
    if (wishlist.find(item => item.listing_id === product.listing_id)) {
      setWishlist(wishlist.filter(item => item.listing_id !== product.listing_id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const navigateToProductDetail = (listingId) => {
    navigation.navigate('CustomerProduct', { listingId });
  };

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedCity !== 'All Cities' ? 1 : 0) +
    (selectedSort !== 'created_at' ? 1 : 0) +
    (selectedStockFilter !== 'all' ? 1 : 0);

  return (
    <View style={styles.container}>

      {/* ── Top Bar ──────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name={menuOpen ? 'close' : 'menu'} size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.logo}>EAIN</Text>
        <TouchableOpacity onPress={() => Alert.alert(t('homeScreen.home'), t('homeScreen.cartFeature'))}>
          <Ionicons name="cart-outline" size={28} color="#fff" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Main Scroll ───────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#036c5f']} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#036c5f" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('homeScreen.searchPlaceholder')}
            placeholderTextColor="#8CBFC5"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#036c5f" />
            </TouchableOpacity>
          )}
          {/* Voice Search Button */}
          <TouchableOpacity
            onPress={handleVoiceSearch}
            disabled={isVoiceProcessing}
            style={[
              styles.voiceSearchBtn,
              isVoiceRecording && styles.voiceSearchBtnRecording,
              isVoiceProcessing && styles.voiceSearchBtnProcessing,
            ]}
          >
            {isVoiceProcessing ? (
              <ActivityIndicator size="small" color="#036c5f" />
            ) : (
              <Ionicons
                name={isVoiceRecording ? 'stop-circle' : 'mic-outline'}
                size={22}
                color={isVoiceRecording ? '#ff6b6b' : '#036c5f'}
              />
            )}
          </TouchableOpacity>

          {/* Camera Button */}

          <TouchableOpacity onPress={() => navigation.navigate('VisualSearch')} style={styles.cameraIconBtn}>
            <Ionicons name="camera-outline" size={22} color="#036c5f" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#036c5f" />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFilters}>
            {selectedCity !== 'All Cities' && (
              <View style={styles.filterChip}>
                <Ionicons name="location" size={12} color="#036c5f" />
                <Text style={styles.filterChipText}>{selectedCity}</Text>
                <TouchableOpacity onPress={() => setSelectedCity('All Cities')}>
                  <Ionicons name="close-circle" size={14} color="#036c5f" />
                </TouchableOpacity>
              </View>
            )}
            {selectedCategory !== 'All' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{selectedCategory}</Text>
                <TouchableOpacity onPress={() => setSelectedCategory('All')}>
                  <Ionicons name="close-circle" size={14} color="#036c5f" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>{t('homeScreen.clearAll')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.categoryBtn, selectedCategory === cat && styles.categorySelected]}
            >
              <Text style={{ color: selectedCategory === cat ? '#fff' : '#036c5f', fontWeight: selectedCategory === cat ? 'bold' : 'normal' }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Services Section ── NEW ───────────────────── */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={{ marginBottom: 20, gap: 10 }}>

          <TouchableOpacity
            style={styles.serviceCta}
            onPress={() => navigation.navigate('ServiceBrowse')}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceCtaTitle}>Book a Service</Text>
              <Text style={styles.serviceCtaSub}>Makeup · Photography · Mehndi · Catering & more</Text>
            </View>
            <View style={styles.serviceCtaIconWrap}>
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.myBookingsBtn}
            onPress={() => navigation.navigate('MyBookings')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="calendar-outline" size={20} color="#036c5f" />
              <Text style={styles.myBookingsText}>My Bookings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#036c5f" />
          </TouchableOpacity>

        </View>
        {/* ── End Services Section ──────────────────────── */}

        {/* Loading */}
        {loading && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#036c5f" />
            <Text style={{ marginTop: 10, color: '#8CBFC5' }}>{t('homeScreen.loadingProducts')}</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={{ padding: 16, backgroundColor: '#ffebee', borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#c62828' }}>{error}</Text>
            <TouchableOpacity onPress={() => fetchListings()} style={{ marginTop: 8 }}>
              <Text style={{ color: '#036c5f', fontWeight: 'bold' }}>{t('myOrders.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Products Section ─────────────────────────── */}
        {!loading && (
          <>
            <Text style={styles.sectionTitle}>{t('homeScreen.products')} ({products.length})</Text>

            {products.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="basket-outline" size={48} color="#8CBFC5" />
                <Text style={{ marginTop: 10, color: '#8CBFC5' }}>
                  {searchQuery || activeFiltersCount > 0 ? t('homeScreen.noMatch') : t('homeScreen.noProducts')}
                </Text>
                {activeFiltersCount > 0 && (
                  <TouchableOpacity onPress={clearFilters} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#036c5f', fontWeight: 'bold' }}>{t('homeScreen.clearFilters')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.productsGrid}>
              {products.map(product => (
                <TouchableOpacity
                  key={product.listing_id}
                  style={styles.productCard}
                  onPress={() => navigateToProductDetail(product.listing_id)}
                >
                  <Image
                    source={{ uri: product.media?.images?.[0] || 'https://via.placeholder.com/150?text=No+Image' }}
                    style={styles.productImage}
                  />
                  {product.track_inventory && (
                    <StockIndicator
                      stockQuantity={product.stock_quantity}
                      reservedQuantity={product.reserved_quantity || 0}
                      trackInventory={true}
                      style={styles.stockBadge}
                    />
                  )}
                  <Text style={styles.productName} numberOfLines={2}>
                    {isUrdu && product.title_ur ? product.title_ur : product.title_en}
                  </Text>
                  <Text style={styles.productPrice}>
                    {product.currency} {product.price?.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666', marginBottom: 8 }} numberOfLines={1}>
                    {product.Vendor?.business_name_en || 'Unknown'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (product.track_inventory && product.stock_quantity === 0) {
                          Alert.alert('Out of Stock', 'This product is currently unavailable.');
                          return;
                        }
                        addToCart(product);
                      }}
                      style={[
                        { backgroundColor: '#036c5f', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
                        (product.track_inventory && product.stock_quantity === 0) && { backgroundColor: '#ccc' }
                      ]}
                      disabled={product.track_inventory && product.stock_quantity === 0}
                    >
                      <Ionicons
                        name="cart-outline"
                        size={16}
                        color={product.track_inventory && product.stock_quantity === 0 ? '#999' : '#fff'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                      style={{ marginLeft: 8 }}
                    >
                      <Ionicons
                        name={wishlist.find(i => i.listing_id === product.listing_id) ? 'heart' : 'heart-outline'}
                        size={24}
                        color={wishlist.find(i => i.listing_id === product.listing_id) ? '#036c5f' : '#8CBFC5'}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Favorites */}
        <Text style={styles.sectionTitle}>{t('homeScreen.favorites')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {wishlist.map(product => (
            <TouchableOpacity
              key={product.listing_id}
              style={styles.favoriteCard}
              onPress={() => navigateToProductDetail(product.listing_id)}
            >
              <Image
                source={{ uri: product.media?.images?.[0] || 'https://via.placeholder.com/150?text=No+Image' }}
                style={styles.productImage}
              />
              <Text style={{ ...styles.productName, color: '#fff' }} numberOfLines={2}>
                {isUrdu && product.title_ur ? product.title_ur : product.title_en}
              </Text>
              <Text style={{ ...styles.productPrice, color: '#fff' }}>
                {product.currency} {product.price?.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {wishlist.length === 0 && (
          <Text style={styles.noFavorites}>{t('homeScreen.noFavorites')}</Text>
        )}

        {/* ── Filter Modal ──────────────────────────────── */}
        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('homeScreen.filters')}</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Ionicons name="close" size={24} color="#036c5f" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.filterLabel}>{t('homeScreen.city')}</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={selectedCity} onValueChange={setSelectedCity} style={styles.picker}>
                    {cities.map(c => <Picker.Item key={c} label={c} value={c} />)}
                  </Picker>
                </View>
                <Text style={styles.filterLabel}>{t('homeScreen.category')}</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory} style={styles.picker}>
                    {categories.map(cat => <Picker.Item key={cat} label={cat} value={cat} />)}
                  </Picker>
                </View>
                <Text style={styles.filterLabel}>{t('homeScreen.sortBy')}</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={selectedSort} onValueChange={setSelectedSort} style={styles.picker}>
                    {sortOptions.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
                  </Picker>
                </View>
                <Text style={styles.filterLabel}>Stock Status</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={selectedStockFilter} onValueChange={setSelectedStockFilter} style={styles.picker}>
                    <Picker.Item label="All Products" value="all" />
                    <Picker.Item label="In Stock" value="in_stock" />
                    <Picker.Item label="Low Stock" value="low_stock" />
                    <Picker.Item label="Out of Stock" value="out_of_stock" />
                  </Picker>
                </View>
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>{t('homeScreen.clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
                  <Text style={styles.applyButtonText}>{t('homeScreen.applyFilters')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>

      {/* ── Bottom Nav ───────────────────────────────── */}
      <View style={styles.bottomNav}>

        <TouchableOpacity onPress={() => { }} style={styles.navBtn}>
          <Ionicons name="home" size={24} color="#036c5f" />
          <Text style={{ color: '#036c5f', fontSize: 12 }}>{t('homeScreen.home')}</Text>
        </TouchableOpacity>

        {/* Services ← NEW */}
        <TouchableOpacity onPress={() => navigation.navigate('ServiceBrowse')} style={styles.navBtn}>
          <Ionicons name="cut-outline" size={24} color="#666" />
          <Text style={{ color: '#666', fontSize: 12 }}>Services</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('MyOrders')} style={styles.navBtn}>
          <Ionicons name="receipt-outline" size={24} color="#666" />
          <Text style={{ color: '#666', fontSize: 12 }}>{t('homeScreen.orders')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { }} style={styles.navBtn}>
          <Ionicons name="heart-outline" size={24} color="#666" />
          <Text style={{ color: '#666', fontSize: 12 }}>{t('homeScreen.wishlist')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate(isAdmin ? 'AdminDashboard' : 'Profile')} style={styles.navBtn}>
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={{ color: '#666', fontSize: 12 }}>{t('homeScreen.profile')}</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerBar: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#036c5f', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  logo: { fontWeight: 'bold', fontSize: 22, color: '#fff' },
  cartBadge: { backgroundColor: '#FFFFFF', position: 'absolute', right: -10, top: -8, borderRadius: 10, paddingHorizontal: 5 },
  cartBadgeText: { color: '#036c5f', fontWeight: 'bold', fontSize: 10 },
  scrollArea: { padding: 16 },
  searchBar: { backgroundColor: '#e0f7fa', borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#036c5f', marginLeft: 8 },
  cameraIconBtn: {
    marginLeft: 8,
    padding: 2,
  },
  voiceSearchBtn: {
    marginLeft: 8,
    padding: 2,
  },
  voiceSearchBtnRecording: {
    backgroundColor: '#ffe5e5',
    borderRadius: 12,
    padding: 4,
  },
  voiceSearchBtnProcessing: {
    opacity: 0.6,
  },
  filterButton: {
    marginLeft: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
    color: '#036c5f',
    marginHorizontal: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  categories: { marginBottom: 16 },
  categoryBtn: { backgroundColor: '#e0f7fa', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 30, marginRight: 10 },
  categorySelected: { backgroundColor: '#036c5f' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 8, color: '#036c5f' },
  // Services
  serviceCta: { backgroundColor: '#036c5f', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceCtaTitle: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 4 },
  serviceCtaSub: { color: '#A8D8CF', fontSize: 12 },
  serviceCtaIconWrap: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 10 },
  myBookingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5F2', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  myBookingsText: { fontSize: 14, fontWeight: '600', color: '#036c5f' },
  // Products
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
  productCard: { backgroundColor: '#fff6ed', borderRadius: 16, padding: 15, alignItems: 'center', width: '48%', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
  favoriteCard: { backgroundColor: '#036c5f', borderRadius: 16, marginRight: 12, padding: 15, alignItems: 'center', width: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
  productImage: { width: '100%', height: 120, marginBottom: 8, borderRadius: 8, resizeMode: 'cover' },
  productName: { fontWeight: 'bold', fontSize: 13, color: '#036c5f', marginBottom: 4, textAlign: 'center', minHeight: 36 },
  productPrice: { color: '#036c5f', fontWeight: 'bold', marginBottom: 8, fontSize: 14 },
  stockBadge: { position: 'absolute', top: 8, right: 8, width: 60 },
  noFavorites: { padding: 24, color: '#8CBFC5', textAlign: 'center' },
  // Bottom Nav
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingVertical: 10 },
  navBtn: { alignItems: 'center' },
  // Filter Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#036c5f' },
  modalBody: { padding: 20 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  pickerWrapper: { backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  picker: { height: 50 },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0', gap: 12 },
  clearButton: { flex: 1, backgroundColor: '#f5f5f5', padding: 16, borderRadius: 12, alignItems: 'center' },
  clearButtonText: { color: '#666', fontWeight: 'bold', fontSize: 16 },
  applyButton: { flex: 1, backgroundColor: '#036c5f', padding: 16, borderRadius: 12, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  outOfStockCard: { opacity: 0.6, backgroundColor: '#f8f9fa' },
});

export default HomeScreen;