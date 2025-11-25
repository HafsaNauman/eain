/**
 * Business Registration Screen
 * For Vendors and Service Providers
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
import { getAccessToken } from '../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import CustomButton from '../components/common/CustomButton';
import ErrorAlert from '../components/common/ErrorAlert';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { COLORS } from '../constants/colors';
import { validateEmail } from '../utils/validation';
import { createVendorProfile } from '../api/VendorService';

const BusinessRegistrationScreen = ({ route, navigation }) => {
  const { userId, userRole } = route.params || {};
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessEmail: '',
    businessPhone: '',
    businessCategory: '',
    businessDescription: '',
    officeAddress: '',
    logo: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [isListening, setIsListening] = useState({});

  const businessCategories = [
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

  // ✅ FIXED: Simple update function without useCallback
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setGeneralError('');
  };

  const handleVoiceInput = (field) => {
    setIsListening(prev => ({ ...prev, [field]: !prev[field] }));
    setTimeout(() => {
      setIsListening(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload your logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateField('logo', result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 10)}`;
    }
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    updateField('businessPhone', formatted);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.businessType) {
      newErrors.businessType = 'Business type is required';
    }

    if (!formData.businessEmail.trim()) {
      newErrors.businessEmail = 'Business email is required';
    } else if (!validateEmail(formData.businessEmail)) {
      newErrors.businessEmail = 'Invalid email format';
    }

    if (!formData.businessPhone.trim()) {
      newErrors.businessPhone = 'Business phone is required';
    } else if (formData.businessPhone.replace(/\s/g, '').length < 10) {
      newErrors.businessPhone = 'Invalid phone number';
    }

    if (!formData.businessCategory) {
      newErrors.businessCategory = 'Business category is required';
    }

    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = 'Business description is required';
    }

    if (!formData.officeAddress.trim()) {
      newErrors.officeAddress = 'Office address is required';
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
      const token = await getAccessToken();
      console.log('🔑 Token exists:', !!token);

      const profileData = {
        vendor_type: formData.businessType,
        business_name_en: formData.businessName.trim(),
        business_name_ur: null,
        description_en: formData.businessDescription.trim(),
        description_ur: null,
        category: formData.businessCategory,
        city: null,
        area: null,
        location: null,
        is_female_only: false,
        media: formData.logo ? { logo_url: formData.logo.uri } : null,
      };

      console.log('📤 Sending profile data:', profileData);
      const result = await createVendorProfile(profileData);

      if (result.success) {
        console.log('✅ Profile created successfully:', result.data);
        navigation.reset({
          index: 0,
          routes: [{
            name: 'VendorDashboard',
            params: {
              vendorProfile: result.data.data?.profile || result.data.profile,
              userId: userId,
            }
          }],
        });
      } else {
        console.error('❌ Profile creation failed:', result.error);
        setGeneralError(result.error || 'Failed to create vendor profile');
      }
    } catch (err) {
      console.error('❌ Business registration error:', err);
      setGeneralError('Failed to register business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.appName}>EAIN</Text>
              <LanguageSwitcher />
            </View>
            <Text style={styles.title}>Business Registration</Text>
            <Text style={styles.subtitle}>
              {userRole === 'vendor' ? 'Vendor Information' : 'Service Provider Information'}
            </Text>
          </View>

          {generalError ? <ErrorAlert message={generalError} /> : null}

          {/* Business Name */}
          <Text style={styles.label}>Business Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.businessName}
              onChangeText={(text) => updateField('businessName', text)}
              placeholder="Enter business name"
              placeholderTextColor="#B0B0B0"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => handleVoiceInput('businessName')}
              disabled={loading}
            >
              <Ionicons
                name={isListening.businessName ? 'mic' : 'mic-outline'}
                size={20}
                color={isListening.businessName ? COLORS.primary : '#666'}
              />
            </TouchableOpacity>
          </View>
          {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

          {/* Business Type */}
          <Text style={styles.label}>Business Type *</Text>
          <View style={[styles.pickerWrapper, errors.businessType && styles.pickerError]}>
            <Picker
              selectedValue={formData.businessType}
              onValueChange={(value) => updateField('businessType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select business type" value="" color="#B0B0B0" />
              <Picker.Item label="Product" value="product" />
              <Picker.Item label="Service" value="service" />
            </Picker>
          </View>
          {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}

          {/* Business Email */}
          <Text style={styles.label}>Business Email *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.businessEmail}
              onChangeText={(text) => updateField('businessEmail', text)}
              placeholder="business@example.com"
              placeholderTextColor="#B0B0B0"
              keyboardType="email-address"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => handleVoiceInput('businessEmail')}
              disabled={loading}
            >
              <Ionicons
                name={isListening.businessEmail ? 'mic' : 'mic-outline'}
                size={20}
                color={isListening.businessEmail ? COLORS.primary : '#666'}
              />
            </TouchableOpacity>
          </View>
          {errors.businessEmail && <Text style={styles.errorText}>{errors.businessEmail}</Text>}

          {/* Business Phone */}
          <Text style={styles.label}>Business Phone Number *</Text>
          <View style={styles.phoneContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+92</Text>
            </View>
            <View style={styles.phoneInputWrapper}>
              <TextInput
                style={styles.phoneInput}
                value={formData.businessPhone}
                onChangeText={handlePhoneChange}
                placeholder="300 1234567"
                placeholderTextColor="#B0B0B0"
                keyboardType="phone-pad"
                maxLength={11}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={() => handleVoiceInput('businessPhone')}
                disabled={loading}
              >
                <Ionicons
                  name={isListening.businessPhone ? 'mic' : 'mic-outline'}
                  size={20}
                  color={isListening.businessPhone ? COLORS.primary : '#666'}
                />
              </TouchableOpacity>
            </View>
          </View>
          {errors.businessPhone && <Text style={styles.errorText}>{errors.businessPhone}</Text>}

          {/* Business Category */}
          <Text style={styles.label}>Business Category *</Text>
          <View style={[styles.pickerWrapper, errors.businessCategory && styles.pickerError]}>
            <Picker
              selectedValue={formData.businessCategory}
              onValueChange={(value) => updateField('businessCategory', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select category" value="" color="#B0B0B0" />
              {businessCategories.map((category) => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>
          {errors.businessCategory && <Text style={styles.errorText}>{errors.businessCategory}</Text>}

          {/* Business Description */}
          <Text style={styles.label}>Business Description *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.businessDescription}
              onChangeText={(text) => updateField('businessDescription', text)}
              placeholder="Describe your business..."
              placeholderTextColor="#B0B0B0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.voiceButton, styles.voiceButtonTop]}
              onPress={() => handleVoiceInput('businessDescription')}
              disabled={loading}
            >
              <Ionicons
                name={isListening.businessDescription ? 'mic' : 'mic-outline'}
                size={20}
                color={isListening.businessDescription ? COLORS.primary : '#666'}
              />
            </TouchableOpacity>
          </View>
          {errors.businessDescription && <Text style={styles.errorText}>{errors.businessDescription}</Text>}

          {/* Office Address */}
          <Text style={styles.label}>Office Address / Business Location *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.officeAddress}
              onChangeText={(text) => updateField('officeAddress', text)}
              placeholder="Enter complete address"
              placeholderTextColor="#B0B0B0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.voiceButton, styles.voiceButtonTop]}
              onPress={() => handleVoiceInput('officeAddress')}
              disabled={loading}
            >
              <Ionicons
                name={isListening.officeAddress ? 'mic' : 'mic-outline'}
                size={20}
                color={isListening.officeAddress ? COLORS.primary : '#666'}
              />
            </TouchableOpacity>
          </View>
          {errors.officeAddress && <Text style={styles.errorText}>{errors.officeAddress}</Text>}

          {/* Logo Upload - OPTIONAL */}
          <Text style={styles.label}>Business Logo (Optional)</Text>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickImage}
            disabled={loading}
          >
            {formData.logo ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: formData.logo.uri }} 
                  style={styles.imagePreview} 
                />
                <Text style={styles.changeImageText}>Change Logo</Text>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
                <Text style={styles.uploadText}>Upload Logo (JPG/PNG)</Text>
                <Text style={styles.uploadSubtext}>Tap to select image (optional)</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Submit Button */}
          <CustomButton
            title="Complete Registration"
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary || '#14b8a6',
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingRight: 8,
    minHeight: 56,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 16,
    minHeight: 56,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 16,
    paddingBottom: 16,
  },
  voiceButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonTop: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryCode: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
    justifyContent: 'center',
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingRight: 8,
    height: 56,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 0,
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
  uploadButton: {
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 150,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
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
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
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
});

export default BusinessRegistrationScreen;
