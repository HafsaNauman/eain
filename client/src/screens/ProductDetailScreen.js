// ProductDetailScreen.js (vendor-side, stock-aware + vendor-type aware)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateListing, deleteListing } from '../api/VendorService';
import StockIndicator from '../components/StockIndicator';
import { getFirstImage } from '../utils/imageHelper';

const TEAL = '#036c5f';
const PEACH_BG = '#f9f5f1ff';

const ProductDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { product } = route.params;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MyProducts'); // fallback screen
    }
  };

  const [isEditing, setIsEditing] = useState(false);

  // Basic fields
  const [titleEn, setTitleEn] = useState(product.title_en || '');
  const [descriptionEn, setDescriptionEn] = useState(product.description_en || '');
  const [price, setPrice] = useState(
    product.price != null ? String(product.price) : ''
  );
  const [category, setCategory] = useState(product.category || '');
  const [tags, setTags] = useState(
    Array.isArray(product.tags) ? product.tags.join(', ') : ''
  );

  // Vendor type (from vendor profile)
  const [vendorType, setVendorType] = useState(
    product.vendor_type || 'product'
  ); // backend: 'product' | 'service' | 'both'

  // Stock fields
  const [trackInventory, setTrackInventory] = useState(
    product.track_inventory ?? false
  );
  const [stockQuantity, setStockQuantity] = useState(
    product.stock_quantity != null ? String(product.stock_quantity) : ''
  );
  const [reservedQuantity, setReservedQuantity] = useState(
    product.reserved_quantity != null ? String(product.reserved_quantity) : '0'
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    product.low_stock_threshold != null ? String(product.low_stock_threshold) : ''
  );

  const initialImage = getFirstImage(product.media, null);
  const [imageUri, setImageUri] = useState(initialImage);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Only allow numeric + optional decimal
  const parseNumber = (s) => {
    const n = Number(s);
    return isNaN(n) || n < 0 ? null : n;
  };

  const handlePickImage = async () => {
    if (!isEditing) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to change the image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const updates = {
        title_en: titleEn.trim(),
        description_en: descriptionEn.trim(),
        price: price ? parseNumber(price) : null,
        category: category.trim() || null,
        tags: tags
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        vendor_type: vendorType,

        track_inventory: trackInventory,
        stock_quantity: trackInventory ? parseNumber(stockQuantity) : null,
        reserved_quantity: trackInventory ? parseNumber(reservedQuantity) : null,
        low_stock_threshold: trackInventory ? parseNumber(lowStockThreshold) : null,

        media: imageUri
          ? [{ image_url: imageUri, type: 'image' }]
          : product.media || null,
      };

      const result = await updateListing(product.listing_id, updates);
      if (!result.success) {
        setError(result.error || 'Failed to update product');
      } else {
        setIsEditing(false);
        navigation.goBack();
      }
    } catch (err) {
      setError('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteListing(product.listing_id);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to delete product');
      } else {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  // For vendor_type: product, service, both
  const vendorTypeOptions = ['product', 'service', 'both'];
  const vendorTypeLabels = {
    product: 'Product',
    service: 'Service',
    both: 'Product + Service',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={TEAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setIsEditing(prev => !prev)}
            style={{ marginRight: 12 }}
          >
            <Ionicons
              name={isEditing ? 'checkmark-done-outline' : 'create-outline'}
              size={22}
              color={TEAL}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} disabled={deleting}>
            <Ionicons
              name="trash-outline"
              size={22}
              color={deleting ? '#E5E7EB' : '#FCA5A5'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image + StockBadge */}
          <TouchableOpacity
            activeOpacity={isEditing ? 0.7 : 1}
            onPress={handlePickImage}
          >
            <View style={styles.imageWrapper}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color={TEAL} />
                  <Text style={styles.imagePlaceholderText}>No image</Text>
                </View>
              )}
            </View>
            <Text style={styles.changeImageHint}>
              {isEditing ? 'Tap image to change' : 'Tap Edit to change image'}
            </Text>
          </TouchableOpacity>

          {/* Vendor type (read‑only, not editable in this version if you want) */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Vendor Type</Text>
            <Text style={styles.valueText}>{vendorTypeLabels[vendorType]}</Text>
          </View>

          {/* StockBadge */}
          {!isEditing && (
            <View style={styles.stockBadgeRow}>
              <StockIndicator
                stockQuantity={
                  product.track_inventory && product.stock_quantity != null
                    ? product.stock_quantity
                    : null
                }
                reservedQuantity={
                  product.track_inventory && product.reserved_quantity != null
                    ? product.reserved_quantity
                    : 0
                }
                trackInventory={product.track_inventory}
              />
            </View>
          )}

          {/* Basic fields */}
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={titleEn}
              onChangeText={setTitleEn}
              editable={isEditing}
              placeholder="Product title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Price (PKR)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              editable={isEditing}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              editable={isEditing}
              placeholder="Category"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              editable={isEditing}
              placeholder="e.g. organic, handmade"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={descriptionEn}
              onChangeText={setDescriptionEn}
              editable={isEditing}
              placeholder="Describe your product..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          {/* Stock fields (only in edit mode) */}
          {isEditing && (
            <>
              <Text style={styles.sectionTitle}>Inventory</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Track Inventory</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.labelText}>Track stock for this listing</Text>
                  <Switch
                    value={trackInventory}
                    onValueChange={setTrackInventory}
                  />
                </View>
              </View>

              {trackInventory && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Stock Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={stockQuantity}
                      onChangeText={setStockQuantity}
                      editable={isEditing}
                      keyboardType="numeric"
                      placeholder="Total stock"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Reserved Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={reservedQuantity}
                      onChangeText={setReservedQuantity}
                      editable={isEditing}
                      keyboardType="numeric"
                      placeholder="Reserved by orders"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Low Stock Threshold</Text>
                    <TextInput
                      style={styles.input}
                      value={lowStockThreshold}
                      onChangeText={setLowStockThreshold}
                      editable={isEditing}
                      keyboardType="numeric"
                      placeholder="e.g. 5"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </>
              )}
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isEditing && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.submitText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PEACH_BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    backgroundColor: '#f9f5f1ff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  imageWrapper: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
    backgroundColor: '#E5E7EB',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: TEAL,
  },
  changeImageHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEAL,
    marginTop: 24,
    marginBottom: 12,
  },

  fieldGroup: { marginBottom: 14 },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  labelText: {
    fontSize: 13,
    color: '#6B7280',
  },

  input: {
    backgroundColor: PEACH_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TEAL,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  multiline: {
    minHeight: 130,
    textAlignVertical: 'top',
  },

  stockBadgeRow: {
    marginVertical: 8,
  },

  // Read-only info row (for vendor_type, etc.)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#1a1a1a',
  },

  errorText: {
    color: '#EF4444',
    marginTop: 8,
    marginBottom: 4,
  },

  submitButton: {
    marginTop: 24,
    backgroundColor: TEAL,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProductDetailScreen;
