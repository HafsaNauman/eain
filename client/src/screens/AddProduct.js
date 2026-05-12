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
import { createListing } from '../api/VendorService';
import { generateProductDescription } from '../api/aiDescriptionService';
import { uploadMultipleProductImages } from '../api/uploadService';

const AddProductScreen = ({ route, navigation }) => {
  const { businessId, vendorProfile } = route.params || {};
  const { i18n, t } = useTranslation();
  const isUrdu = i18n.language === 'ur';

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
    { label: t('businessReg.categories.electronics'), value: 'Electronics' },
    { label: t('businessReg.categories.fashion'), value: 'Fashion & Apparel' },
    { label: t('businessReg.categories.food'), value: 'Food & Beverage' },
    { label: t('businessReg.categories.health'), value: 'Health & Beauty' },
    { label: t('businessReg.categories.home'), value: 'Home & Garden' },
    { label: t('businessReg.categories.sports'), value: 'Sports & Fitness' },
    { label: t('businessReg.categories.automotive'), value: 'Automotive' },
    { label: t('businessReg.categories.professional'), value: 'Professional Services' },
    { label: t('businessReg.categories.education'), value: 'Education' },
    { label: t('businessReg.categories.entertainment'), value: 'Entertainment' },
    { label: t('businessReg.categories.realEstate'), value: 'Real Estate' },
    { label: t('businessReg.categories.other'), value: 'Other' },
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
        Alert.alert(
          t('businessReg.alerts.permissionDenied'),
          t('businessReg.alerts.permissionMessage')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUris = result.assets.map(asset => asset.uri);

        Alert.alert(t('common.loading'), `${t('addProduct.uploadImages')} ${localUris.length}...`);
        setLoading(true);

        try {
          const uploadResult = await uploadMultipleProductImages(localUris);

          if (uploadResult.success && uploadResult.imageUrls.length > 0) {
            const newImages = uploadResult.imageUrls.map(url => ({ uri: url }));
            updateField('images', [...formData.images, ...newImages]);

            if (uploadResult.failedCount > 0) {
              Alert.alert(
                t('common.success'),
                `${uploadResult.imageUrls.length} ${t('addProduct.productImages')}. ${uploadResult.failedCount} failed.`
              );
            } else {
              Alert.alert(t('common.success'), `${uploadResult.imageUrls.length} ${t('addProduct.productImages')}!`);
            }
          } else {
            Alert.alert(t('common.error'), uploadResult.error || t('addProduct.errors.imagesRequired'));
          }
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert(t('common.error'), t('addProduct.errors.addFailed'));
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('common.error'), t('addProduct.errors.addFailed'));
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField('images', newImages);
  };

  const handleGenerateWithAI = async () => {
    try {
      setGeneralError('');

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          t('businessReg.alerts.permissionDenied'),
          t('businessReg.alerts.permissionMessage')
        );
        return;
      }

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
      const localUri = selectedImage.uri;

      setAiLoading(true);

      try {
        console.log('📤 [AI] Uploading image to Supabase...');
        const uploadResult = await uploadMultipleProductImages([localUri]);

        if (!uploadResult.success || uploadResult.imageUrls.length === 0) {
          Alert.alert(t('common.error'), t('addProduct.errors.addFailed'));
          return;
        }

        const supabaseImageUrl = uploadResult.imageUrls[0];
        console.log('✅ [AI] Image uploaded to Supabase:', supabaseImageUrl);

        console.log('🤖 [AI] Generating description...');
        const aiResult = await generateProductDescription(selectedImage, vendorProfile?.vendor_id, false);

        if (aiResult.success && aiResult.data) {
          const { ai_description } = aiResult.data;

          setFormData(prev => ({
            ...prev,
            titleEn: ai_description.title || prev.titleEn,
            descriptionEn: ai_description.description || prev.descriptionEn,
            tags: ai_description.keywords ? ai_description.keywords.join(', ') : prev.tags,
            images: [...prev.images, { uri: supabaseImageUrl }],
          }));

          if (ai_description.features && ai_description.features.length > 0) {
            setAiGeneratedFeatures(ai_description.features);
          }

          Alert.alert(
            t('common.success'),
            t('addProduct.productAdded'),
            [{ text: t('common.ok') }]
          );
        } else {
          setGeneralError(aiResult.error || t('addProduct.errors.addFailed'));
        }
      } catch (uploadError) {
        console.warn('❌ [AI] Upload or generation error:', uploadError.message);
        Alert.alert(t('common.error'), t('addProduct.errors.addFailed'));
      }
    } catch (error) {
        console.warn('❌ AI Generation Error:', error.message);
      setGeneralError(t('addProduct.errors.addFailed'));
    } finally {
      setAiLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titleEn.trim()) {
      newErrors.titleEn = t('addProduct.errors.nameRequired');
    }

    if (!formData.descriptionEn.trim()) {
      newErrors.descriptionEn = t('addProduct.errors.descriptionRequired');
    }

    if (!formData.price.trim()) {
      newErrors.price = t('addProduct.errors.priceRequired');
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = t('addProduct.errors.priceRequired');
    }

    if (!formData.category) {
      newErrors.category = t('addProduct.errors.categoryRequired');
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
      const media = formData.images.map(img => ({
        image_url: img.uri,
        type: 'image',
      }));

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
        Alert.alert(t('common.success'), t('addProduct.productAdded'), [{
          text: t('common.ok'),
          onPress: () => {
            navigation.navigate('VendorDashboard', {
              vendorProfile: vendorProfile,
              userId: route.params?.userId,
              refreshListings: true,
            });
          },
        }]);
      } else {
        setGeneralError(result.error || t('addProduct.errors.addFailed'));
      }
    } catch (err) {
      console.warn('❌ Add product error:', err.message);
      setGeneralError(t('addProduct.errors.addFailed'));
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
            <Text style={styles.title}>{t('addProduct.title')}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Error Alert */}
          {generalError ? <ErrorAlert message={generalError} /> : null}

          {/* Listing Type */}
          <Text style={styles.label}>{t('businessReg.businessType')} *</Text>
          <View style={[styles.pickerWrapper, errors.listingType && styles.pickerError]}>
            <Picker
              selectedValue={formData.listingType}
              onValueChange={(value) => updateField('listingType', value)}
              style={styles.picker}
            >
              <Picker.Item label={t('businessReg.product')} value="product" />
              <Picker.Item label={t('businessReg.service')} value="service" />
            </Picker>
          </View>

          {/* Title (English) */}
          <Text style={styles.label}>{t('addProduct.productName')}</Text>
          <TextInput
            style={[styles.input, errors.titleEn && styles.inputError]}
            value={formData.titleEn}
            onChangeText={(text) => updateField('titleEn', text)}
            placeholder={t('addProduct.productNamePlaceholder')}
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
              {aiLoading ? t('common.processing') : 'Generate with AI'}
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
          <Text style={styles.label}>{t('addProduct.productName')} ({t('profile.urdu')})</Text>
          <TextInput
            style={styles.input}
            value={formData.titleUr}
            onChangeText={(text) => updateField('titleUr', text)}
            placeholder="عنوان (اختیاری)"
            placeholderTextColor="#B0B0B0"
            editable={!loading}
          />

          {/* Description (English) */}
          <Text style={styles.label}>{t('addProduct.productDescription')}</Text>
          <TextInput
            style={[styles.input, styles.multilineInput, errors.descriptionEn && styles.inputError]}
            value={formData.descriptionEn}
            onChangeText={(text) => updateField('descriptionEn', text)}
            placeholder={t('addProduct.productDescriptionPlaceholder')}
            placeholderTextColor="#B0B0B0"
            multiline
            editable={!loading}
          />
          {errors.descriptionEn && <Text style={styles.errorText}>{errors.descriptionEn}</Text>}

          {/* Description (Urdu) - Optional */}
          <Text style={styles.label}>{t('addProduct.productDescription')} ({t('profile.urdu')})</Text>
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
          <Text style={styles.label}>{t('addProduct.price')}</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            value={formData.price}
            onChangeText={(text) => updateField('price', text)}
            placeholder={t('addProduct.pricePlaceholder')}
            placeholderTextColor="#B0B0B0"
            keyboardType="numeric"
            editable={!loading}
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

          {/* Category */}
          <Text style={styles.label}>{t('addProduct.category')}</Text>
          <View style={[styles.pickerWrapper, errors.category && styles.pickerError]}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => updateField('category', value)}
              style={styles.picker}
            >
              <Picker.Item label={t('addProduct.selectCategory')} value="" color="#B0B0B0" />
              {categories.map((cat) => (
                <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
              ))}
            </Picker>
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

          {/* Tags */}
          <Text style={styles.label}>{t('addProduct.tags')}</Text>
          <TextInput
            style={styles.input}
            value={formData.tags}
            onChangeText={(text) => updateField('tags', text)}
            placeholder={t('addProduct.tagsPlaceholder')}
            placeholderTextColor="#B0B0B0"
            editable={!loading}
          />

          {/* Female Only Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>{t('addProduct.femaleOnly')}</Text>
            <TouchableOpacity
              style={[styles.toggle, formData.isFemaleOnly && styles.toggleActive]}
              onPress={() => updateField('isFemaleOnly', !formData.isFemaleOnly)}
            >
              <View style={[styles.toggleThumb, formData.isFemaleOnly && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* Images */}
          <Text style={styles.label}>{t('addProduct.productImages')}</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={loading}>
            <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
            <Text style={styles.uploadText}>{t('addProduct.uploadImages')}</Text>
            <Text style={styles.uploadSubtext}>{t('businessReg.uploadLogoSubtext')}</Text>
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
            title={t('addProduct.addProduct')}
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
