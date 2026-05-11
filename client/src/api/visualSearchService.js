// // api/visualSearchService.js
// import axios from 'axios';
// import * as SecureStore from 'expo-secure-store';

// // const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
// const API_BASE_URL = 'https://mightiest-unextolled-valeri.ngrok-free.dev' ;

// export const performVisualSearch = async (imageUri) => {
//   try {
//     const token = await SecureStore.getItemAsync('userToken');

//     // Build multipart form
//     const formData = new FormData();
//     formData.append('image', {
//       uri: imageUri,
//       type: 'image/jpeg',
//       name: 'visual_search.jpg',
//     });

//     const response = await axios.post(
//       `${API_BASE_URL}/api/catalog/visual-search`,
//       formData,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         timeout: 25000,
//       }
//     );

//     if (response.data.success) {
//       return {
//         success: true,
//         data: response.data.data,
//       };
//     }
//     return { success: false, error: response.data.message || 'Search failed' };

//   } catch (error) {
//     console.error('❌ Visual Search API Error:', error.message);
//     if (error.code === 'ECONNABORTED') {
//       return { success: false, error: 'Request timed out. ML service may be slow.' };
//     }
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Visual search failed',
//     };
//   }
// };




/**
 * VisualSearchScreen.js
 * Allows customers to search products by uploading or capturing an image
 * ✅ UPDATED: visual-rerank via recommender + event logging
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ ADDED
import axios from 'axios';                                            // ✅ ADDED
//import { performVisualSearch } from '../../api/visualSearchService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const TEAL = '#036c5f';
const BACKEND_URL = 'https://a5a2-39-50-209-222.ngrok-free.app'; // ✅ ADDED — same as other screens

// ─── Recommender helpers ─────────────────────────────────────────────────────
const logEvent = async (userId, listingId, eventType) => {
  try {
    await axios.post(`${BACKEND_URL}/api/recommend/events`, {
      user_id: userId,
      listing_id: String(listingId),
      event_type: eventType,
    });
  } catch (_) { }
};

const visualRerank = async (visualEmbedding, userId = null, topK = 20) => {
  try {
    const { data } = await axios.post(`${BACKEND_URL}/api/recommend/visual-rerank`, {
      user_id: userId,
      visual_embedding: visualEmbedding,
      top_k: topK,
    });
    return { success: true, data };
  } catch (_) { return { success: false }; }
};
// ─────────────────────────────────────────────────────────────────────────────

const VisualSearchScreen = ({ navigation }) => {
  const { i18n, t } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  // ── existing state ────────────────────────────────────────────────────────
  const [queryImage, setQueryImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // ── recommender state ─────────────────────────────────────────────────────
  const [feedMethod, setFeedMethod] = useState('');       // ✅ ADDED — shows which method was used
  const [rerankApplied, setRerankApplied] = useState(false); // ✅ ADDED

  // ─── Image Pickers ────────────────────────────────────────────────────────
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('visualSearch.galleryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) handleImageSelected(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('visualSearch.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) handleImageSelected(result.assets[0].uri);
  };

  // ─── Core Search ─────────────────────────────────────────────────────────
  const handleImageSelected = async (uri) => {
    setQueryImage(uri);
    setResults([]);
    setSearched(false);
    setRerankApplied(false);      // ✅ ADDED
    setFeedMethod('');            // ✅ ADDED
    setLoading(true);

    try {
      // ✅ ADDED: get user_id in parallel
      const userId = await AsyncStorage.getItem('user_id');

      // Step 1: existing visual search (gets catalog results + embedding)
      const response = await performVisualSearch(uri);

      if (response.success) {
        const catalogListings = response.data.listings || [];
        const visualEmbedding = response.data.visual_embedding || null; // ✅ ADDED — your service must return this

        // ✅ ADDED: Step 2 — try visual rerank via recommender
        let finalResults = catalogListings;
        let rerankUsed = false;

        if (visualEmbedding && visualEmbedding.length > 0) {
          const rec = await visualRerank(visualEmbedding, userId);
          if (rec.success && rec.data?.results?.length > 0) {
            // Map recommender results to catalog listing shape
            finalResults = rec.data.results.map(r => ({
              listing_id: r.item_id,
              title_en: r.title,
              title_ur: null,
              category: r.category,
              price: r.price,
              currency: 'PKR',
              media: { images: [`https://via.placeholder.com/200?text=${encodeURIComponent(r.title)}`] },
              _rec_score: r.score,
              _rec_method: rec.data.method,
            }));
            setFeedMethod(rec.data.method || 'visual_emb');
            rerankUsed = true;
            console.log(`✅ Visual rerank applied: ${finalResults.length} results (${rec.data.method})`);
          }
        }

        // ✅ ADDED: log visual_search event
        if (userId) {
          logEvent(userId, finalResults[0]?.listing_id || 'unknown', 'visual_search');
        }

        setResults(finalResults);
        setRerankApplied(rerankUsed);
      } else {
        Alert.alert(t('common.error'), response.error);
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('errors.networkError'));
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleReset = () => {
    setQueryImage(null);
    setResults([]);
    setSearched(false);
    setRerankApplied(false);   // ✅ ADDED
    setFeedMethod('');         // ✅ ADDED
  };

  // ─── Render Product Card ─────────────────────────────────────────────────
  const renderCard = ({ item }) => {
    const title = isUrdu && item.title_ur ? item.title_ur : item.title_en;
    const vendorName =
      isUrdu && item.Vendor?.business_name_ur
        ? item.Vendor.business_name_ur
        : item.Vendor?.business_name_en;
    const imageUrl = item.media?.images?.[0];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={async () => {
          // ✅ ADDED: log click event on result tap
          const userId = await AsyncStorage.getItem('user_id');
          if (userId) logEvent(userId, item.listing_id, 'click');
          navigation.navigate('CustomerProduct', { listingId: item.listing_id });
        }}
        activeOpacity={0.85}
      >
        <Image
          source={imageUrl ? { uri: imageUrl } : { uri: 'https://via.placeholder.com/200?text=No+Image' }}
          style={styles.cardImage}
        />
        {/* ✅ ADDED: AI match badge for reranked results */}
        {item._rec_score && (
          <View style={styles.recBadge}>
            <Text style={styles.recBadgeText}>✨ {(item._rec_score * 100).toFixed(0)}%</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.cardPrice}>
            {item.currency} {item.price?.toLocaleString()}
          </Text>
          {vendorName && (
            <Text style={styles.cardVendor} numberOfLines={1}>🏪 {vendorName}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('visualSearch.title')}</Text>
        {queryImage ? (
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color={TEAL} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.listing_id?.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Query Image Preview */}
            {queryImage ? (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>{t('visualSearch.searchingFor')}</Text>
                <Image source={{ uri: queryImage }} style={styles.previewImage} />
              </View>
            ) : (
              <View style={styles.uploadPrompt}>
                <Ionicons name="camera-outline" size={72} color="#ccc" />
                <Text style={styles.promptTitle}>{t('visualSearch.promptTitle')}</Text>
                <Text style={styles.promptSubtitle}>{t('visualSearch.promptSubtitle')}</Text>
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={TEAL} />
                <Text style={styles.loadingText}>{t('visualSearch.searching')}</Text>
              </View>
            )}

            {/* Empty Results */}
            {searched && !loading && results.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>{t('visualSearch.noResults')}</Text>
                <TouchableOpacity onPress={handleReset} style={styles.retryButton}>
                  <Text style={styles.retryText}>{t('visualSearch.tryAgain')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ✅ UPDATED: Results count + rerank badge */}
            {results.length > 0 && (
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.resultsCount}>
                  {results.length} {t('visualSearch.resultsFound')}
                </Text>
                {rerankApplied && (
                  <View style={styles.rerankBadge}>
                    <Text style={styles.rerankBadgeText}>✨ AI Ranked</Text>
                  </View>
                )}
              </View>
            )}
          </>
        }
        ListEmptyComponent={null}
      />

      {/* ── Bottom Action Buttons ────────────────────────────────────────── */}
      {!loading && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.actionButton} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>{t('visualSearch.gallery')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.cameraButton]} onPress={pickFromCamera}>
            <Ionicons name="camera-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>{t('visualSearch.camera')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerButton: { padding: 8, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  listContent: { padding: 16, paddingBottom: 100 },
  uploadPrompt: { alignItems: 'center', paddingVertical: 60 },
  promptTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginTop: 16 },
  promptSubtitle: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  previewContainer: { alignItems: 'center', marginBottom: 20 },
  previewLabel: { fontSize: 14, color: '#666', marginBottom: 10 },
  previewImage: { width: 160, height: 160, borderRadius: 16, borderWidth: 3, borderColor: TEAL },
  loadingContainer: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 12, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: TEAL, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },

  // ✅ UPDATED: results header with rerank badge
  resultsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  resultsCount: { fontSize: 14, color: '#666' },
  rerankBadge: { backgroundColor: '#e0f7fa', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  rerankBadgeText: { fontSize: 12, color: TEAL, fontWeight: '700' },

  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: { width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  cardImage: { width: CARD_WIDTH, height: CARD_WIDTH, backgroundColor: '#f5f5f5' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: TEAL, marginBottom: 4 },
  cardVendor: { fontSize: 11, color: '#888' },

  // ✅ ADDED: AI score badge on card
  recBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(3,108,95,0.85)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  recBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: TEAL, paddingVertical: 14, borderRadius: 12, gap: 8 },
  cameraButton: { backgroundColor: '#1a1a1a' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

export default VisualSearchScreen;
