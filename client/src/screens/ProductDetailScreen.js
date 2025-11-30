import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateListing, deleteListing } from '../api/VendorService';

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
  const [titleEn, setTitleEn] = useState(product.title_en || '');
  const [descriptionEn, setDescriptionEn] = useState(product.description_en || '');
  const [price, setPrice] = useState(
    product.price != null ? String(product.price) : ''
  );
  const [category, setCategory] = useState(product.category || '');
  const [tags, setTags] = useState(
    Array.isArray(product.tags) ? product.tags.join(', ') : ''
  );

  const initialImage =
    product.media && product.media.length > 0 && product.media[0].image_url
      ? product.media[0].image_url
      : null;
  const [imageUri, setImageUri] = useState(initialImage);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

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
        price: price ? parseFloat(price) : null,
        category: category.trim() || null,
        tags: tags
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
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
    } catch {
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
    } catch {
      Alert.alert('Error', 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
  <TouchableOpacity onPress={handleBack}>
    <Ionicons name="arrow-back" size={24} color="#036c5f" />
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
              color="#036c5f"
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
          {/* Image */}
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

          {/* Fields */}
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
    color: '#6B7280',
    marginBottom: 4,
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
    minHeight: 130,          // taller so you see what you type
    textAlignVertical: 'top', // keeps text at top
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
