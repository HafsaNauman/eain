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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import CustomButton from '../components/common/CustomButton';
import ErrorAlert from '../components/common/ErrorAlert';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { COLORS } from '../constants/colors';
import { validateEmail, validateCNIC } from '../utils/validation';
import { registerBusiness } from '../api/authService';

const BusinessRegistrationScreen = ({ route, navigation }) => {
  const { userId, userRole } = route.params;
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    businessName: '',
    cnic: '',
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

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    setGeneralError('');
  };

  const handleVoiceInput = (field) => {
    setIsListening({ ...isListening, [field]: !isListening[field] });
    
    // TODO: Implement voice recognition
    setTimeout(() => {
      setIsListening({ ...isListening, [field]: false });
    }, 2000);
  };

  const handleVoiceTranscription = (transcribedText, field) => {
    updateField(field, transcribedText.trim());
  };

  const pickImage = async () => {
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

    if (!result.canceled) {
      updateField('logo', result.assets[0]);
    }
  };

  const formatCNIC = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    } else if (cleaned.length <= 12) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
  };

  const handleCNICChange = (text) => {
    const formatted = formatCNIC(text);
    updateField('cnic', formatted);
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

    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required';
    } else if (!validateCNIC(formData.cnic)) {
      newErrors.cnic = 'Invalid CNIC format (XXXXX-XXXXXXX-X)';
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

    if (!formData.logo) {
      newErrors.logo = 'Business logo is required';
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
      const businessData = {
        userId,
        businessName: formData.businessName.trim(),
        cnic: formData.cnic.replace(/\D/g, ''),
        businessType: formData.businessType,
        businessEmail: formData.businessEmail.trim(),
        businessPhone: `+92${formData.businessPhone.replace(/\s/g, '')}`,
        businessCategory: formData.businessCategory,
        businessDescription: formData.businessDescription.trim(),
        officeAddress: formData.officeAddress.trim(),
        logo: formData.logo,
      };

      const result = await registerBusiness(businessData);

      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        setGeneralError(result.error);
      }
    } catch (err) {
      setGeneralError('Failed to register business. Please try again.');
      console.error('Business registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const VoiceInput = ({ field, placeholder, value, onChangeText, multiline, keyboardType, maxLength }) => (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B0B0B0"
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        maxLength={maxLength}
        editable={!loading}
      />
      <TouchableOpacity
        style={styles.voiceButton}
        onPress={() => handleVoiceInput(field)}
        disabled={loading}
      >
        <Ionicons
          name={isListening[field] ? 'mic' : 'mic-outline'}
          size={24}
          color={isListening[field] ? COLORS.primary : '#666'}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
            <View style={styles.headerRow}>
              <Text style={styles.appName}>EAIN</Text>
              <LanguageSwitcher />
            </View>
            <Text style={styles.title}>Business Registration</Text>
            <Text style={styles.subtitle}>
              {userRole === 'vendor' ? 'Vendor Information' : 'Service Provider Information'}
            </Text>
          </View>

          {/* Error Alert */}
          {generalError ? <ErrorAlert message={generalError} /> : null}

          {/* Business Name */}
          <Text style={styles.label}>Business Name *</Text>
          <VoiceInput
            field="businessName"
            placeholder="Enter business name"
            value={formData.businessName}
            onChangeText={(text) => updateField('businessName', text)}
          />
          {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

          {/* CNIC */}
          <Text style={styles.label}>CNIC Number *</Text>
          <VoiceInput
            field="cnic"
            placeholder="XXXXX-XXXXXXX-X"
            value={formData.cnic}
            onChangeText={handleCNICChange}
            keyboardType="numeric"
            maxLength={15}
          />
          {errors.cnic && <Text style={styles.errorText}>{errors.cnic}</Text>}

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
          <VoiceInput
            field="businessEmail"
            placeholder="business@example.com"
            value={formData.businessEmail}
            onChangeText={(text) => updateField('businessEmail', text)}
            keyboardType="email-address"
          />
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
                  size={24}
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
          <VoiceInput
            field="businessDescription"
            placeholder="Describe your business..."
            value={formData.businessDescription}
            onChangeText={(text) => updateField('businessDescription', text)}
            multiline
          />
          {errors.businessDescription && <Text style={styles.errorText}>{errors.businessDescription}</Text>}

          {/* Office Address */}
          <Text style={styles.label}>Office Address / Business Location *</Text>
          <VoiceInput
            field="officeAddress"
            placeholder="Enter complete address"
            value={formData.officeAddress}
            onChangeText={(text) => updateField('officeAddress', text)}
            multiline
          />
          {errors.officeAddress && <Text style={styles.errorText}>{errors.officeAddress}</Text>}

          {/* Logo Upload */}
          <Text style={styles.label}>Business Logo *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            {formData.logo ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: formData.logo.uri }} style={styles.imagePreview} />
                <Text style={styles.changeImageText}>Change Logo</Text>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
                <Text style={styles.uploadText}>Upload Logo (JPG)</Text>
                <Text style={styles.uploadSubtext}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.logo && <Text style={styles.errorText}>{errors.logo}</Text>}

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
    paddingHorizontal: 24,
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
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingLeft: 16,
    paddingRight: 4,
    minHeight: 56,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  voiceButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  countryCode: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
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
    paddingLeft: 16,
    paddingRight: 4,
    height: 56,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerWrapper: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
    justifyContent: 'center',
    marginBottom: 4,
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
    marginBottom: 4,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
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
    marginBottom: 12,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 20,
  },
});

export default BusinessRegistrationScreen;