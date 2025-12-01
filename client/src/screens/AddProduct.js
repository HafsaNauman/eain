/**
 * Add Product/Listing Screen
 * For vendors to create new listings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import CustomButton from '../components/common/CustomButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { COLORS } from '../constants/colors';
import { validateEmail } from '../utils/validation';
//import { createListing } from '../api/listingService';
import { createListing } from '../api/VendorService';
import { generateProductDescription } from '../api/aiDescriptionService';
import { uploadMultipleProductImages } from '../api/uploadService'; // Add this import

const AddProductScreen = ({ route, navigation }) => {
  const { businessId, vendorProfile } = route.params || {};
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    listingType: 'product',
    titleEn: '',
    titleUr: '',
    descriptionEn: '',
    descriptionUr: '',
    price: '',
    currency: 'PKR',
    category: '',
    tags: '',
    isFemaleOnly: true,
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedFeatures, setAiGeneratedFeatures] = useState([]);

  const categories = [
    'Electronics',
    'Fashion & Apparel',
    'Food & Beverage',
    'Health & Beauty',
    'Home & Garden',
    'Sports & Fitness',
    'Automotive',
    'Professional Services',
    'Education',
    'Entertainment',
    'Real Estate',
    'Other',
  ];

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    setGeneralError('');
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
        selectionLimit: 5, // Limit to 5 images
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUris = result.assets.map(asset => asset.uri);

        // Show uploading progress
        Alert.alert('Uploading', `Uploading ${localUris.length} images...`);
        setLoading(true);

        try {
          // Upload all images to Supabase
          const uploadResult = await uploadMultipleProductImages(localUris);

          if (uploadResult.success && uploadResult.imageUrls.length > 0) {
            // Add Supabase URLs to product images
            setProductImages(prev => [...prev, ...uploadResult.imageUrls]);

            if (uploadResult.failedCount > 0) {
              Alert.alert(
                'Partial Success',
                `${uploadResult.imageUrls.length} images uploaded successfully. ${uploadResult.failedCount} failed.`
              );
            } else {
              Alert.alert(
                'Success',
                `All ${uploadResult.imageUrls.length} images uploaded successfully!`
              );
            }
          } else {
            Alert.alert('Upload Failed', uploadResult.error || 'No images were uploaded');
          }
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Error', 'Failed to upload images');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField('images', newImages);
  };

  const handleGenerateWithAI = async () => {
    try {
      setGeneralError('');

      // Request image picker permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
        return;
      }

      // Pick image for AI analysis
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedImage = result.assets[0];
      setAiLoading(true);

      // Call AI service
      const aiResult = await generateProductDescription(selectedImage, vendorProfile?.vendor_id, false);

      if (aiResult.success && aiResult.data) {
        const { ai_description } = aiResult.data;

        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          titleEn: ai_description.title || prev.titleEn,
          descriptionEn: ai_description.description || prev.descriptionEn,
          tags: ai_description.keywords ? ai_description.keywords.join(', ') : prev.tags,
          images: [...prev.images, selectedImage],
        }));

        // Store features for display
        if (ai_description.features && ai_description.features.length > 0) {
          setAiGeneratedFeatures(ai_description.features);
        }

        Alert.alert(
          'Success!',
          'AI has generated a product description for you. You can edit it before submitting.',
          [{ text: 'OK' }]
        );
      } else {
        setGeneralError(aiResult.error || 'Failed to generate AI description');
      }
    } catch (error) {
      console.error('❌ AI Generation Error:', error);
      setGeneralError('Failed to generate AI description. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titleEn.trim()) {
      newErrors.titleEn = 'English title is required';
    }

    if (!formData.descriptionEn.trim()) {
      newErrors.descriptionEn = 'English description is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Invalid price';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare media array
      const media = formData.images.map(img => ({
        image_url: img.uri,
        type: 'image',
      }));

      // Prepare tags array
      const tags = formData.tags.trim()
        ? formData.tags.split(',').map(tag => tag.trim())
        : [];

      const listingData = {
        listing_type: formData.listingType,
        title_en: formData.titleEn.trim(),
        title_ur: formData.titleUr.trim() || null,
        description_en: formData.descriptionEn.trim(),
        description_ur: formData.descriptionUr.trim() || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        category: formData.category,
        tags: tags,
        media: media,
        is_female_only: formData.isFemaleOnly,
      };

      console.log('📤 Sending listing data:', listingData);
      const result = await createListing(listingData);

      if (result.success) {
        console.log('✅ Listing created successfully:', result.data);
        Alert.alert('Success', 'Product/Service added successfully!', [{
          text: 'OK',
          onPress: () => {
            navigation.navigate('VendorDashboard', {
              vendorProfile: vendorProfile,
              userId: route.params?.userId,
              refreshListings: true,
            });
          },
        },
        ]
        );
      }
      else {
        setGeneralError(result.error || 'Failed to create listing');
      }
    } catch (err) {
      console.error('❌ Add product error:', err);
      setGeneralError('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Product/Service</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Error Alert */}
          {generalError ? <ErrorAlert message={generalError} /> : null}

          {/* Listing Type */}
          <Text style={styles.label}>Listing Type *</Text>
          <View style={[styles.pickerWrapper, errors.listingType && styles.pickerError]}>
            <Picker
              selectedValue={formData.listingType}
              onValueChange={(value) => updateField('listingType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Product" value="product" />
              <Picker.Item label="Service" value="service" />
            </Picker>
          </View>

          {/* Title (English) */}
          <Text style={styles.label}>Title (English) *</Text>
          <TextInput
            style={[styles.input, errors.titleEn && styles.inputError]}
            value={formData.titleEn}
            onChangeText={(text) => updateField('titleEn', text)}
            placeholder="Enter product/service title"
            placeholderTextColor="#B0B0B0"
            editable={!loading}
          />
          {errors.titleEn && <Text style={styles.errorText}>{errors.titleEn}</Text>}

          {/* AI Generate Button */}
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleGenerateWithAI}
            disabled={loading || aiLoading}
          >
            <Ionicons
              name="sparkles"
              size={20}
              color={COLORS.primary}
              style={styles.aiButtonIcon}
            />
            <Text style={styles.aiButtonText}>
              {aiLoading ? 'Generating with AI...' : 'Generate with AI'}
            </Text>
          </TouchableOpacity>

          {/* AI Generated Features */}
          {aiGeneratedFeatures.length > 0 && (
            <View style={styles.featuresContainer}>
              <View style={styles.featuresHeader}>
                <Ionicons name="bulb" size={18} color={COLORS.primary} />
                <Text style={styles.featuresTitle}>AI-Generated Features</Text>
                <TouchableOpacity onPress={() => setAiGeneratedFeatures([])}>
                  <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
              </View>
              {aiGeneratedFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Title (Urdu) - Optional */}
          <Text style={styles.label}>Title (Urdu)</Text>
          <TextInput
            style={styles.input}
            value={formData.titleUr}
            onChangeText={(text) => updateField('titleUr', text)}
            placeholder="عنوان (اختیاری)"
            placeholderTextColor="#B0B0B0"
            editable={!loading}
          />

          {/* Description (English) */}
          <Text style={styles.label}>Description (English) *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput, errors.descriptionEn && styles.inputError]}
            value={formData.descriptionEn}
            onChangeText={(text) => updateField('descriptionEn', text)}
            placeholder="Describe your product/service..."
            placeholderTextColor="#B0B0B0"
            multiline
            editable={!loading}
          />
          {errors.descriptionEn && <Text style={styles.errorText}>{errors.descriptionEn}</Text>}

          {/* Description (Urdu) - Optional */}
          <Text style={styles.label}>Description (Urdu)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={formData.descriptionUr}
            onChangeText={(text) => updateField('descriptionUr', text)}
            placeholder="تفصیل (اختیاری)"
            placeholderTextColor="#B0B0B0"
            multiline
            editable={!loading}
          />

          {/* Price */}
          <Text style={styles.label}>Price (PKR) *</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            value={formData.price}
            onChangeText={(text) => updateField('price', text)}
            placeholder="0.00"
            placeholderTextColor="#B0B0B0"
            keyboardType="numeric"
            editable={!loading}
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

          {/* Category */}
          <Text style={styles.label}>Category *</Text>
          <View style={[styles.pickerWrapper, errors.category && styles.pickerError]}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => updateField('category', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select category" value="" color="#B0B0B0" />
              {categories.map((category) => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

          {/* Tags */}
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.tags}
            onChangeText={(text) => updateField('tags', text)}
            placeholder="e.g. organic, handmade, premium"
            placeholderTextColor="#B0B0B0"
            editable={!loading}
          />

          {/* Female Only Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>Female Only Service</Text>
            <TouchableOpacity
              style={[styles.toggle, formData.isFemaleOnly && styles.toggleActive]}
              onPress={() => updateField('isFemaleOnly', !formData.isFemaleOnly)}
            >
              <View style={[styles.toggleThumb, formData.isFemaleOnly && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* Images */}
          <Text style={styles.label}>Images</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={loading}>
            <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
            <Text style={styles.uploadText}>Upload Images</Text>
            <Text style={styles.uploadSubtext}>Tap to select images</Text>
          </TouchableOpacity>

          {/* Image Preview */}
          {formData.images.length > 0 && (
            <View style={styles.imagesGrid}>
              {formData.images.map((img, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF5555" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Submit Button */}
          <CustomButton
            title="Add Product/Service"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
    height: 56,
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  multilineInput: {
    height: 100,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
    justifyContent: 'center',
    marginBottom: 8,
  },
  pickerError: {
    borderColor: '#EF4444',
  },
  picker: {
    height: 56,
    color: '#1a1a1a',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 24 }],
  },
  uploadButton: {
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 120,
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
    marginLeft: 2,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  aiButtonIcon: {
    marginRight: 8,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  featuresContainer: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    marginTop: 4,
  },
  featureBullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
    lineHeight: 20,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
});

export default AddProductScreen;
