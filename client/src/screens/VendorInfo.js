/**
 * Vendor Information Screen
 * Display and edit vendor business details
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../constants/colors';
import { updateVendorProfile } from '../api/VendorService';

const VendorInfoScreen = ({ route, navigation }) => {
  const { profile, businessData } = route.params || {};
  const initialData = profile || businessData || {};

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: initialData.business_name_en || initialData.businessName || '',
    businessNameUrdu: initialData.business_name_ur || initialData.businessNameUrdu || '',
    category: initialData.category || initialData.businessCategory || '',
    businessType: initialData.vendor_type || initialData.businessType || '',
    email: initialData.business_email || initialData.businessEmail || '',
    phone: initialData.business_phone || initialData.businessPhone || '',
    address: initialData.office_address || initialData.officeAddress || '',
    city: initialData.city || '',
    area: initialData.area || '',
    description: initialData.description_en || initialData.businessDescription || '',
    descriptionUrdu: initialData.description_ur || initialData.businessDescriptionUrdu || '',
    // isFemaleOnly: initialData.is_female_only || false,
    isFemaleOnly: initialData.is_female_only === true,

  });

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

  const handleSave = async () => {
    try {
      setLoading(true);

      const updateData = {
        business_name_en: formData.businessName,
        business_name_ur: formData.businessNameUrdu || null,
        category: formData.category,
        vendor_type: formData.businessType,
        description_en: formData.description,
        description_ur: formData.descriptionUrdu || null,
        city: formData.city || null,
        area: formData.area || null,
        is_female_only: formData.isFemaleOnly,
      };

      const result = await updateVendorProfile(updateData);

      if (result.success) {
        Alert.alert('Success', 'Business information updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setIsEditing(false);
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update information');
      }
    } catch (error) {
      console.error('Error updating vendor info:', error);
      Alert.alert('Error', 'Failed to update information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      businessName: initialData.business_name_en || initialData.businessName || '',
      businessNameUrdu: initialData.business_name_ur || initialData.businessNameUrdu || '',
      category: initialData.category || initialData.businessCategory || '',
      businessType: initialData.vendor_type || initialData.businessType || '',
      email: initialData.business_email || initialData.businessEmail || '',
      phone: initialData.business_phone || initialData.businessPhone || '',
      address: initialData.office_address || initialData.officeAddress || '',
      city: initialData.city || '',
      area: initialData.area || '',
      description: initialData.description_en || initialData.businessDescription || '',
      descriptionUrdu: initialData.description_ur || initialData.businessDescriptionUrdu || '',
      isFemaleOnly: initialData.is_female_only || false,
    });
    setIsEditing(false);
  };

  const InfoField = ({ icon, label, value, field, multiline = false, editable = true }) => (
    <View style={styles.infoItem}>
      <View style={styles.infoHeader}>
        <View style={styles.infoLeft}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
      </View>
      {isEditing && editable ? (
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={(text) => setFormData({ ...formData, [field]: text })}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#999"
          multiline={multiline}
          editable={!loading}
        />
      ) : (
        <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Information</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Basic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          
          <InfoField
            icon="business-outline"
            label="Business Name (English)"
            value={formData.businessName}
            field="businessName"
          />
          
          <InfoField
            icon="business-outline"
            label="Business Name (Urdu)"
            value={formData.businessNameUrdu}
            field="businessNameUrdu"
          />

          {/* Category */}
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <View style={styles.infoLeft}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Category</Text>
              </View>
            </View>
            {isEditing ? (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Select category" value="" />
                  {categories.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text style={styles.infoValue}>{formData.category || 'Not provided'}</Text>
            )}
          </View>

          {/* Business Type */}
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <View style={styles.infoLeft}>
                <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Business Type</Text>
              </View>
            </View>
            {isEditing ? (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Select type" value="" />
                  <Picker.Item label="Product" value="product" />
                  <Picker.Item label="Service" value="service" />
                </Picker>
              </View>
            ) : (
              <Text style={styles.infoValue}>{formData.businessType || 'Not provided'}</Text>
            )}
          </View>

          {/* Female Only Toggle */}
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <View style={styles.infoLeft}>
                <Ionicons name="female-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Female Only Service</Text>
              </View>
              {isEditing ? (
                <TouchableOpacity
                  style={[styles.toggle, formData.isFemaleOnly && styles.toggleActive]}
                  onPress={() => setFormData({ ...formData, isFemaleOnly: !formData.isFemaleOnly })}
                  disabled={loading}
                >
                  <View style={[styles.toggleThumb, formData.isFemaleOnly && styles.toggleThumbActive]} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.infoValue}>{formData.isFemaleOnly ? 'Yes' : 'No'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <InfoField
            icon="mail-outline"
            label="Email"
            value={formData.email}
            field="email"
            editable={false}
          />
          
          <InfoField
            icon="call-outline"
            label="Phone"
            value={formData.phone}
            field="phone"
            editable={false}
          />
          
          <InfoField
            icon="location-outline"
            label="Address"
            value={formData.address}
            field="address"
            multiline
            editable={false}
          />

          <InfoField
            icon="business-outline"
            label="City"
            value={formData.city}
            field="city"
          />

          <InfoField
            icon="map-outline"
            label="Area"
            value={formData.area}
            field="area"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          
          <InfoField
            icon="document-text-outline"
            label="Description (English)"
            value={formData.description}
            field="description"
            multiline
          />

          <InfoField
            icon="document-text-outline"
            label="Description (Urdu)"
            value={formData.descriptionUrdu}
            field="descriptionUrdu"
            multiline
          />
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    marginLeft: 28,
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    marginLeft: 28,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 28,
  },
  picker: {
    height: 50,
    color: '#333',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5E5',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default VendorInfoScreen;
