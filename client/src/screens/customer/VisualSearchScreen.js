/**
 * Visual Search Screen
 * Allows customers to search products by uploading or capturing an image
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
import { performVisualSearch } from '../../api/visualSearchService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const VisualSearchScreen = ({ navigation }) => {
  const { i18n, t } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const [queryImage, setQueryImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // ─── Image Pickers ───────────────────────────────────────────────
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
    if (!result.canceled) {
      handleImageSelected(result.assets[0].uri);
    }
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
    if (!result.canceled) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  // ─── Core Search ─────────────────────────────────────────────────
  const handleImageSelected = async (uri) => {
    setQueryImage(uri);
    setResults([]);
    setSearched(false);
    setLoading(true);

    try {
      const response = await performVisualSearch(uri);
      if (response.success) {
        setResults(response.data.listings || []);
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
  };

  // ─── Render Product Card ──────────────────────────────────────────
  const renderCard = ({ item }) => {
    const title = isUrdu && item.title_ur ? item.title_ur : item.title_en;
    const vendorName =
      isUrdu && item.Vendor?.business_name_ur
        ? item.Vendor.business_name_ur
        : item.Vendor?.business_name_en;
    const imageUrl = item.media?.[0]?.image_url;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CustomerProduct', { listingId: item.listing_id })}
        activeOpacity={0.85}
      >
        <Image
          source={
            imageUrl
              ? { uri: imageUrl }
              : { uri: 'https://via.placeholder.com/200?text=No+Image' }
          }
          style={styles.cardImage}
        />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.cardPrice}>
            {item.currency} {item.price?.toLocaleString()}
          </Text>
          {vendorName && (
            <Text style={styles.cardVendor} numberOfLines={1}>
              🏪 {vendorName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('visualSearch.title')}</Text>
        {queryImage ? (
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color="#036c5f" />
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
              /* Upload Prompt */
              <View style={styles.uploadPrompt}>
                <Ionicons name="camera-outline" size={72} color="#ccc" />
                <Text style={styles.promptTitle}>{t('visualSearch.promptTitle')}</Text>
                <Text style={styles.promptSubtitle}>{t('visualSearch.promptSubtitle')}</Text>
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#036c5f" />
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

            {/* Results Count */}
            {results.length > 0 && (
              <Text style={styles.resultsCount}>
                {results.length} {t('visualSearch.resultsFound')}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={null}
      />

      {/* Bottom Action Buttons */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: { padding: 8, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  listContent: { padding: 16, paddingBottom: 100 },
  uploadPrompt: { alignItems: 'center', paddingVertical: 60 },
  promptTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginTop: 16 },
  promptSubtitle: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  previewContainer: { alignItems: 'center', marginBottom: 20 },
  previewLabel: { fontSize: 14, color: '#666', marginBottom: 10 },
  previewImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#036c5f',
  },
  loadingContainer: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 12, textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#036c5f',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  resultsCount: { fontSize: 14, color: '#666', marginBottom: 12 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: { width: CARD_WIDTH, height: CARD_WIDTH, backgroundColor: '#f5f5f5' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: '#036c5f', marginBottom: 4 },
  cardVendor: { fontSize: 11, color: '#888' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#036c5f',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: { backgroundColor: '#1a1a1a' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

export default VisualSearchScreen;
