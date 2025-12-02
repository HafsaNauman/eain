// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableOpacity,
//   TextInput,
//   Image,
//   Alert,
// } from 'react-native';
// import { getAccessToken } from '../utils/storage';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Picker } from '@react-native-picker/picker';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { useTranslation } from 'react-i18next';
// import CustomButton from '../components/common/CustomButton';
// import ErrorAlert from '../components/common/ErrorAlert';
// import LanguageSwitcher from '../components/common/LanguageSwitcher';
// import { COLORS } from '../constants/colors';
// import { validateEmail } from '../utils/validation';
// import { createVendorProfile } from '../api/VendorService';
// // ✅ ADD VOICE INPUT IMPORTS
// import { startRecording, stopRecording, getRecordingDuration } from '../utils/audioRecorder';
// import { transcribeAudio } from '../api/sttService';


// const BusinessRegistrationScreen = ({ route, navigation }) => {
//   const { userId, userRole } = route.params || {};
//   const { t, i18n } = useTranslation(); // ✅ Get i18n for language detection

//   const [formData, setFormData] = useState({
//     businessName: '',
//     businessType: '',
//     businessEmail: '',
//     businessPhone: '',
//     businessCategory: '',
//     businessDescription: '',
//     officeAddress: '',
//     logo: null,
//   });

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [generalError, setGeneralError] = useState('');
//   const [isListening, setIsListening] = useState({});

//   // ✅ ADD RECORDING STATE FOR VOICE INPUT
//   const [recordingField, setRecordingField] = useState(null);
//   const [recording, setRecording] = useState(null);

//   const businessCategories = [
//     'Electronics',
//     'Fashion & Apparel',
//     'Food & Beverage',
//     'Health & Beauty',
//     'Home & Garden',
//     'Sports & Fitness',
//     'Automotive',
//     'Professional Services',
//     'Education',
//     'Entertainment',
//     'Real Estate',
//     'Other',
//   ];

//   // ✅ FIXED: Simple update function without useCallback
//   const updateField = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//     setGeneralError('');
//   };

//   // ✅ REPLACE handleVoiceInput WITH REAL VOICE RECORDING
//   const handleVoiceInput = async (field) => {
//     if (recordingField === field) {
//       await stopVoiceRecording(field);
//     } else {
//       await startVoiceRecording(field);
//     }
//   };

//   // ✅ START VOICE RECORDING
//   const startVoiceRecording = async (field) => {
//     try {
//       console.log(`🎤 Starting recording for: ${field}`);
//       const newRecording = await startRecording();
//       setRecording(newRecording);
//       setRecordingField(field);
//       setIsListening(prev => ({ ...prev, [field]: true }));
//     } catch (error) {
//       console.error('Recording error:', error);
//       Alert.alert('Recording Error', error.message || 'Failed to start recording');
//     }
//   };

//   // ✅ STOP VOICE RECORDING AND TRANSCRIBE
//   const stopVoiceRecording = async (field) => {
//     try {
//       setRecordingField(null);
//       setIsListening(prev => ({ ...prev, [field]: false }));

//       const recordingDuration = recording ? await getRecordingDuration(recording) : 0;
//       console.log('⏱️ Recording duration:', recordingDuration, 'ms');

//       if (recordingDuration < 1000) {
//         Alert.alert('Recording Too Short', 'Please record for at least 1 second.', [
//           { text: 'OK' },
//         ]);

//         if (recording) {
//           await recording.stopAndUnloadAsync();
//         }
//         setRecording(null);
//         return;
//       }

//       const audioUri = await stopRecording(recording);
//       console.log('📁 Audio URI:', audioUri);

//       // Get language code based on current language
//       const languageCode = i18n.language === 'en' ? 'en-US' : 'ur-PK';
//       console.log(`📤 BusinessReg language: ${i18n.language} -> ${languageCode}`);

//       // Determine field type for proper formatting
//       let fieldType = 'default';
//       if (field === 'businessName') {
//         fieldType = 'name';
//       } else if (field === 'businessEmail') {
//         fieldType = 'email';
//       } else if (field === 'businessPhone') {
//         fieldType = 'phone';
//       }

//       const result = await transcribeAudio(audioUri, {
//         encoding: 'LINEAR16',
//         sampleRateHertz: 44100,
//         languageCode: languageCode,
//         fieldType: fieldType,
//       });

//       if (result.success) {
//         const transcribedText = result.data?.transcript || '';

//         // Handle different field types
//         if (field === 'businessPhone') {
//           // Extract only digits and format
//           const digitsOnly = transcribedText.replace(/\D/g, '');
//           if (digitsOnly && digitsOnly.length >= 10) {
//             const formatted = formatPhoneNumber(digitsOnly);
//             updateField(field, formatted);
//             console.log(`✅ ${field} updated with:`, formatted);
//           } else {
//             Alert.alert('Invalid Input', 'Could not detect a valid phone number.');
//           }
//         } else if (transcribedText && transcribedText.trim()) {
//           updateField(field, transcribedText.trim());
//           console.log(`✅ ${field} updated with:`, transcribedText.trim());
//         } else {
//           Alert.alert('No Speech', 'Could not detect speech. Please try again.');
//         }
//       } else {
//         Alert.alert('Error', result.error || 'Transcription failed');
//       }

//       setRecording(null);
//     } catch (error) {
//       console.error('❌ Transcription error:', error);
//       Alert.alert('Error', 'Failed to transcribe audio');
//       setRecording(null);
//       setIsListening(prev => ({ ...prev, [field]: false }));
//     }
//   };

//   const pickImage = async () => {
//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'We need camera roll permissions to upload your logo.');
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         updateField('logo', result.assets[0]);
//       }
//     } catch (error) {
//       console.error('Image picker error:', error);
//       Alert.alert('Error', 'Failed to pick image');
//     }
//   };

//   const formatPhoneNumber = (text) => {
//     const cleaned = text.replace(/\D/g, '');
//     if (cleaned.length <= 3) {
//       return cleaned;
//     } else {
//       return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 10)}`;
//     }
//   };

//   const handlePhoneChange = (text) => {
//     const formatted = formatPhoneNumber(text);
//     updateField('businessPhone', formatted);
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.businessName.trim()) {
//       newErrors.businessName = 'Business name is required';
//     }

//     if (!formData.businessType) {
//       newErrors.businessType = 'Business type is required';
//     }

//     if (!formData.businessEmail.trim()) {
//       newErrors.businessEmail = 'Business email is required';
//     } else if (!validateEmail(formData.businessEmail)) {
//       newErrors.businessEmail = 'Invalid email format';
//     }

//     if (!formData.businessPhone.trim()) {
//       newErrors.businessPhone = 'Business phone is required';
//     } else if (formData.businessPhone.replace(/\s/g, '').length < 10) {
//       newErrors.businessPhone = 'Invalid phone number';
//     }

//     if (!formData.businessCategory) {
//       newErrors.businessCategory = 'Business category is required';
//     }

//     if (!formData.businessDescription.trim()) {
//       newErrors.businessDescription = 'Business description is required';
//     }

//     if (!formData.officeAddress.trim()) {
//       newErrors.officeAddress = 'Office address is required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     setGeneralError('');

//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);

//     try {
//       const token = await getAccessToken();
//       console.log('🔑 Token exists:', !!token);

//       const profileData = {
//         vendor_type: formData.businessType,
//         business_name_en: formData.businessName.trim(),
//         business_name_ur: null,
//         description_en: formData.businessDescription.trim(),
//         description_ur: null,
//         category: formData.businessCategory,
//         city: null,
//         area: null,
//         location: null,
//         is_female_only: false,
//         media: formData.logo ? { logo_url: formData.logo.uri } : null,
//       };

//       console.log('📤 Sending profile data:', profileData);
//       const result = await createVendorProfile(profileData);

//       if (result.success) {
//         console.log('✅ Profile created successfully:', result.data);
//         navigation.reset({
//           index: 0,
//           routes: [{
//             name: 'VendorDashboard',
//             params: {
//               vendorProfile: result.data.data?.profile || result.data.profile,
//               userId: userId,
//             }
//           }],
//         });
//       } else {
//         console.error('❌ Profile creation failed:', result.error);
//         setGeneralError(result.error || 'Failed to create vendor profile');
//       }
//     } catch (err) {
//       console.error('❌ Business registration error:', err);
//       setGeneralError('Failed to register business. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         style={styles.keyboardAvoid}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <View style={styles.headerRow}>
//               <Text style={styles.appName}>EAIN</Text>
//               <LanguageSwitcher />
//             </View>
//             <Text style={styles.title}>Business Registration</Text>
//             <Text style={styles.subtitle}>
//               {userRole === 'vendor' ? 'Vendor Information' : 'Service Provider Information'}
//             </Text>
//           </View>

//           {generalError ? <ErrorAlert message={generalError} /> : null}

//           {/* Business Name */}
//           <Text style={styles.label}>Business Name *</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               value={formData.businessName}
//               onChangeText={(text) => updateField('businessName', text)}
//               placeholder="Enter business name"
//               placeholderTextColor="#B0B0B0"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.voiceButton}
//               onPress={() => handleVoiceInput('businessName')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'businessName' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'businessName' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

//           {/* Business Type */}
//           <Text style={styles.label}>Business Type *</Text>
//           <View style={[styles.pickerWrapper, errors.businessType && styles.pickerError]}>
//             <Picker
//               selectedValue={formData.businessType}
//               onValueChange={(value) => updateField('businessType', value)}
//               style={styles.picker}
//             >
//               <Picker.Item label="Select business type" value="" color="#B0B0B0" />
//               <Picker.Item label="Product" value="product" />
//               <Picker.Item label="Service" value="service" />
//             </Picker>
//           </View>
//           {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}

//           {/* Business Email */}
//           <Text style={styles.label}>Business Email *</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               value={formData.businessEmail}
//               onChangeText={(text) => updateField('businessEmail', text)}
//               placeholder="business@example.com"
//               placeholderTextColor="#B0B0B0"
//               keyboardType="email-address"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.voiceButton}
//               onPress={() => handleVoiceInput('businessEmail')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'businessEmail' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'businessEmail' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.businessEmail && <Text style={styles.errorText}>{errors.businessEmail}</Text>}

//           {/* Business Phone */}
//           <Text style={styles.label}>Business Phone Number *</Text>
//           <View style={styles.phoneContainer}>
//             <View style={styles.countryCode}>
//               <Text style={styles.countryCodeText}>+92</Text>
//             </View>
//             <View style={styles.phoneInputWrapper}>
//               <TextInput
//                 style={styles.phoneInput}
//                 value={formData.businessPhone}
//                 onChangeText={handlePhoneChange}
//                 placeholder="300 1234567"
//                 placeholderTextColor="#B0B0B0"
//                 keyboardType="phone-pad"
//                 maxLength={11}
//                 editable={!loading}
//               />
//               <TouchableOpacity
//                 style={styles.voiceButton}
//                 onPress={() => handleVoiceInput('businessPhone')}
//                 disabled={loading}
//               >
//                 <Ionicons
//                   name={recordingField === 'businessPhone' ? 'mic' : 'mic-outline'}
//                   size={20}
//                   color={recordingField === 'businessPhone' ? COLORS.error : '#666'}
//                 />
//               </TouchableOpacity>
//             </View>
//           </View>
//           {errors.businessPhone && <Text style={styles.errorText}>{errors.businessPhone}</Text>}

//           {/* Business Category */}
//           <Text style={styles.label}>Business Category *</Text>
//           <View style={[styles.pickerWrapper, errors.businessCategory && styles.pickerError]}>
//             <Picker
//               selectedValue={formData.businessCategory}
//               onValueChange={(value) => updateField('businessCategory', value)}
//               style={styles.picker}
//             >
//               <Picker.Item label="Select category" value="" color="#B0B0B0" />
//               {businessCategories.map((category) => (
//                 <Picker.Item key={category} label={category} value={category} />
//               ))}
//             </Picker>
//           </View>
//           {errors.businessCategory && <Text style={styles.errorText}>{errors.businessCategory}</Text>}

//           {/* Business Description */}
//           <Text style={styles.label}>Business Description *</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={[styles.input, styles.multilineInput]}
//               value={formData.businessDescription}
//               onChangeText={(text) => updateField('businessDescription', text)}
//               placeholder="Describe your business..."
//               placeholderTextColor="#B0B0B0"
//               multiline
//               numberOfLines={4}
//               textAlignVertical="top"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={[styles.voiceButton, styles.voiceButtonTop]}
//               onPress={() => handleVoiceInput('businessDescription')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'businessDescription' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'businessDescription' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.businessDescription && <Text style={styles.errorText}>{errors.businessDescription}</Text>}

//           {/* Office Address */}
//           <Text style={styles.label}>Office Address / Business Location *</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={[styles.input, styles.multilineInput]}
//               value={formData.officeAddress}
//               onChangeText={(text) => updateField('officeAddress', text)}
//               placeholder="Enter complete address"
//               placeholderTextColor="#B0B0B0"
//               multiline
//               numberOfLines={4}
//               textAlignVertical="top"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={[styles.voiceButton, styles.voiceButtonTop]}
//               onPress={() => handleVoiceInput('officeAddress')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={isListening.officeAddress ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={isListening.officeAddress ? COLORS.primary : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.officeAddress && <Text style={styles.errorText}>{errors.officeAddress}</Text>}

//           {/* Logo Upload - OPTIONAL */}
//           <Text style={styles.label}>Business Logo (Optional)</Text>
//           <TouchableOpacity
//             style={styles.uploadButton}
//             onPress={pickImage}
//             disabled={loading}
//           >
//             {formData.logo ? (
//               <View style={styles.imagePreviewContainer}>
//                 <Image
//                   source={{ uri: formData.logo.uri }}
//                   style={styles.imagePreview}
//                 />
//                 <Text style={styles.changeImageText}>Change Logo</Text>
//               </View>
//             ) : (
//               <View style={styles.uploadPlaceholder}>
//                 <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
//                 <Text style={styles.uploadText}>Upload Logo (JPG/PNG)</Text>
//                 <Text style={styles.uploadSubtext}>Tap to select image (optional)</Text>
//               </View>
//             )}
//           </TouchableOpacity>

//           {/* Submit Button */}
//           <CustomButton
//             title="Complete Registration"
//             onPress={handleSubmit}
//             loading={loading}
//             disabled={loading}
//             style={styles.submitButton}
//           />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingTop: 16,
//     paddingBottom: 40,
//   },
//   header: {
//     marginBottom: 24,
//   },
//   headerRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   appName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: COLORS.primary || '#14b8a6',
//     letterSpacing: 2,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 8,
//     marginTop: 16,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     paddingRight: 8,
//     minHeight: 56,
//     marginBottom: 8,
//   },
//   input: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1a1a1a',
//     paddingHorizontal: 12,
//     paddingVertical: 16,
//     minHeight: 56,
//   },
//   multilineInput: {
//     minHeight: 100,
//     paddingTop: 16,
//     paddingBottom: 16,
//   },
//   voiceButton: {
//     padding: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   voiceButtonTop: {
//     alignSelf: 'flex-start',
//     marginTop: 8,
//   },
//   phoneContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   countryCode: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 56,
//     justifyContent: 'center',
//     marginRight: 8,
//   },
//   countryCodeText: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#1a1a1a',
//   },
//   phoneInputWrapper: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     paddingRight: 8,
//     height: 56,
//   },
//   phoneInput: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1a1a1a',
//     paddingHorizontal: 12,
//     paddingVertical: 0,
//   },
//   pickerWrapper: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     borderRadius: 12,
//     overflow: 'hidden',
//     height: 56,
//     justifyContent: 'center',
//     marginBottom: 8,
//   },
//   pickerError: {
//     borderColor: '#EF4444',
//   },
//   picker: {
//     height: 56,
//     color: '#1a1a1a',
//   },
//   uploadButton: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 2,
//     borderColor: '#E5E5E5',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 8,
//     minHeight: 150,
//   },
//   uploadPlaceholder: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   uploadText: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#333',
//     marginTop: 12,
//   },
//   uploadSubtext: {
//     fontSize: 13,
//     color: '#999',
//     marginTop: 4,
//   },
//   imagePreviewContainer: {
//     alignItems: 'center',
//   },
//   imagePreview: {
//     width: 100,
//     height: 100,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   changeImageText: {
//     fontSize: 14,
//     color: COLORS.primary,
//     fontWeight: '500',
//   },
//   errorText: {
//     fontSize: 12,
//     color: '#EF4444',
//     marginBottom: 8,
//     marginLeft: 2,
//   },
//   submitButton: {
//     marginTop: 24,
//     marginBottom: 20,
//   },
// });

// export default BusinessRegistrationScreen;


// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableOpacity,
//   TextInput,
//   Image,
//   Alert,
// } from 'react-native';
// import { getAccessToken } from '../utils/storage';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Picker } from '@react-native-picker/picker';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { useTranslation } from 'react-i18next';
// import CustomButton from '../components/common/CustomButton';
// import ErrorAlert from '../components/common/ErrorAlert';
// import LanguageSwitcher from '../components/common/LanguageSwitcher';
// import { COLORS } from '../constants/colors';
// import { validateEmail } from '../utils/validation';
// import { createVendorProfile } from '../api/VendorService';
// import { startRecording, stopRecording, getRecordingDuration } from '../utils/audioRecorder';
// import { transcribeAudio } from '../api/sttService';


// const BusinessRegistrationScreen = ({ route, navigation }) => {
//   const { userId, userRole } = route.params || {};
//   const { t, i18n } = useTranslation();

//   const [formData, setFormData] = useState({
//     businessName: '',
//     businessType: '',
//     businessEmail: '',
//     businessPhone: '',
//     businessCategory: '',
//     businessDescription: '',
//     officeAddress: '',
//     logo: null,
//   });

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [generalError, setGeneralError] = useState('');
//   const [isListening, setIsListening] = useState({});
//   const [recordingField, setRecordingField] = useState(null);
//   const [recording, setRecording] = useState(null);

//   // ✅ Categories with translations
//   const businessCategories = [
//     { label: t('businessReg.categories.electronics'), value: 'Electronics' },
//     { label: t('businessReg.categories.fashion'), value: 'Fashion & Apparel' },
//     { label: t('businessReg.categories.food'), value: 'Food & Beverage' },
//     { label: t('businessReg.categories.health'), value: 'Health & Beauty' },
//     { label: t('businessReg.categories.home'), value: 'Home & Garden' },
//     { label: t('businessReg.categories.sports'), value: 'Sports & Fitness' },
//     { label: t('businessReg.categories.automotive'), value: 'Automotive' },
//     { label: t('businessReg.categories.professional'), value: 'Professional Services' },
//     { label: t('businessReg.categories.education'), value: 'Education' },
//     { label: t('businessReg.categories.entertainment'), value: 'Entertainment' },
//     { label: t('businessReg.categories.realEstate'), value: 'Real Estate' },
//     { label: t('businessReg.categories.other'), value: 'Other' },
//   ];

//   const updateField = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//     setGeneralError('');
//   };

//   const handleVoiceInput = async (field) => {
//     if (recordingField === field) {
//       await stopVoiceRecording(field);
//     } else {
//       await startVoiceRecording(field);
//     }
//   };

//   const startVoiceRecording = async (field) => {
//     try {
//       console.log(`🎤 Starting recording for: ${field}`);
//       const newRecording = await startRecording();
//       setRecording(newRecording);
//       setRecordingField(field);
//       setIsListening(prev => ({ ...prev, [field]: true }));
//     } catch (error) {
//       console.error('Recording error:', error);
//       Alert.alert(
//         t('businessReg.alerts.recordingError'),
//         error.message || t('businessReg.alerts.recordingFailed')
//       );
//     }
//   };

//   const stopVoiceRecording = async (field) => {
//     try {
//       setRecordingField(null);
//       setIsListening(prev => ({ ...prev, [field]: false }));

//       const recordingDuration = recording ? await getRecordingDuration(recording) : 0;
//       console.log('⏱️ Recording duration:', recordingDuration, 'ms');

//       if (recordingDuration < 1000) {
//         Alert.alert(
//           t('businessReg.alerts.recordingTooShort'),
//           t('businessReg.alerts.recordingMessage'),
//           [{ text: t('common.ok') }]
//         );

//         if (recording) {
//           await recording.stopAndUnloadAsync();
//         }
//         setRecording(null);
//         return;
//       }

//       const audioUri = await stopRecording(recording);
//       console.log('📁 Audio URI:', audioUri);

//       const languageCode = i18n.language === 'en' ? 'en-US' : 'ur-PK';
//       console.log(`📤 BusinessReg language: ${i18n.language} -> ${languageCode}`);

//       let fieldType = 'default';
//       if (field === 'businessName') {
//         fieldType = 'name';
//       } else if (field === 'businessEmail') {
//         fieldType = 'email';
//       } else if (field === 'businessPhone') {
//         fieldType = 'phone';
//       }

//       const result = await transcribeAudio(audioUri, {
//         encoding: 'LINEAR16',
//         sampleRateHertz: 44100,
//         languageCode: languageCode,
//         fieldType: fieldType,
//       });

//       if (result.success) {
//         const transcribedText = result.data?.transcript || '';

//         if (field === 'businessPhone') {
//           const digitsOnly = transcribedText.replace(/\D/g, '');
//           if (digitsOnly && digitsOnly.length >= 10) {
//             const formatted = formatPhoneNumber(digitsOnly);
//             updateField(field, formatted);
//             console.log(`✅ ${field} updated with:`, formatted);
//           } else {
//             Alert.alert(
//               t('businessReg.alerts.invalidInput'),
//               t('businessReg.alerts.invalidPhoneMessage')
//             );
//           }
//         } else if (transcribedText && transcribedText.trim()) {
//           updateField(field, transcribedText.trim());
//           console.log(`✅ ${field} updated with:`, transcribedText.trim());
//         } else {
//           Alert.alert(
//             t('businessReg.alerts.noSpeech'),
//             t('businessReg.alerts.noSpeechMessage')
//           );
//         }
//       } else {
//         Alert.alert(
//           t('businessReg.alerts.transcriptionError'),
//           result.error || t('businessReg.alerts.transcriptionFailed')
//         );
//       }

//       setRecording(null);
//     } catch (error) {
//       console.error('❌ Transcription error:', error);
//       Alert.alert(
//         t('businessReg.alerts.transcriptionError'),
//         t('businessReg.alerts.transcriptionFailed')
//       );
//       setRecording(null);
//       setIsListening(prev => ({ ...prev, [field]: false }));
//     }
//   };

//   const pickImage = async () => {
//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (status !== 'granted') {
//         Alert.alert(
//           t('businessReg.alerts.permissionDenied'),
//           t('businessReg.alerts.permissionMessage')
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         updateField('logo', result.assets[0]);
//       }
//     } catch (error) {
//       console.error('Image picker error:', error);
//       Alert.alert(t('common.error'), t('businessReg.alerts.imagePickerError'));
//     }
//   };

//   const formatPhoneNumber = (text) => {
//     const cleaned = text.replace(/\D/g, '');
//     if (cleaned.length <= 3) {
//       return cleaned;
//     } else {
//       return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 10)}`;
//     }
//   };

//   const handlePhoneChange = (text) => {
//     const formatted = formatPhoneNumber(text);
//     updateField('businessPhone', formatted);
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.businessName.trim()) {
//       newErrors.businessName = t('businessReg.errors.businessNameRequired');
//     }

//     if (!formData.businessType) {
//       newErrors.businessType = t('businessReg.errors.businessTypeRequired');
//     }

//     if (!formData.businessEmail.trim()) {
//       newErrors.businessEmail = t('businessReg.errors.businessEmailRequired');
//     } else if (!validateEmail(formData.businessEmail)) {
//       newErrors.businessEmail = t('businessReg.errors.invalidEmail');
//     }

//     if (!formData.businessPhone.trim()) {
//       newErrors.businessPhone = t('businessReg.errors.businessPhoneRequired');
//     } else if (formData.businessPhone.replace(/\s/g, '').length < 10) {
//       newErrors.businessPhone = t('businessReg.errors.invalidPhone');
//     }

//     if (!formData.businessCategory) {
//       newErrors.businessCategory = t('businessReg.errors.businessCategoryRequired');
//     }

//     if (!formData.businessDescription.trim()) {
//       newErrors.businessDescription = t('businessReg.errors.businessDescriptionRequired');
//     }

//     if (!formData.officeAddress.trim()) {
//       newErrors.officeAddress = t('businessReg.errors.officeAddressRequired');
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     setGeneralError('');

//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);

//     try {
//       const token = await getAccessToken();
//       console.log('🔑 Token exists:', !!token);

//       const profileData = {
//         vendor_type: formData.businessType,
//         business_name_en: formData.businessName.trim(),
//         business_name_ur: null,
//         description_en: formData.businessDescription.trim(),
//         description_ur: null,
//         category: formData.businessCategory,
//         city: null,
//         area: null,
//         location: null,
//         is_female_only: false,
//         media: formData.logo ? { logo_url: formData.logo.uri } : null,
//       };

//       console.log('📤 Sending profile data:', profileData);
//       const result = await createVendorProfile(profileData);

//       if (result.success) {
//         console.log('✅ Profile created successfully:', result.data);
//         navigation.reset({
//           index: 0,
//           routes: [{
//             name: 'VendorDashboard',
//             params: {
//               vendorProfile: result.data.data?.profile || result.data.profile,
//               userId: userId,
//             }
//           }],
//         });
//       } else {
//         console.error('❌ Profile creation failed:', result.error);
//         setGeneralError(result.error || t('businessReg.errors.registrationFailed'));
//       }
//     } catch (err) {
//       console.error('❌ Business registration error:', err);
//       setGeneralError(t('businessReg.errors.registrationFailed'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         style={styles.keyboardAvoid}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <View style={styles.headerRow}>
//               <Text style={styles.appName}>{t('businessReg.appName')}</Text>
//               <LanguageSwitcher />
//             </View>
//             <Text style={styles.title}>{t('businessReg.title')}</Text>
//             <Text style={styles.subtitle}>
//               {userRole === 'vendor' ? t('businessReg.subtitle') : t('businessReg.serviceProviderInfo')}
//             </Text>
//           </View>

//           {generalError ? <ErrorAlert message={generalError} /> : null}

//           {/* Business Name */}
//           <Text style={styles.label}>{t('businessReg.businessName')}</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               value={formData.businessName}
//               onChangeText={(text) => updateField('businessName', text)}
//               placeholder={t('businessReg.businessNamePlaceholder')}
//               placeholderTextColor="#B0B0B0"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.voiceButton}
//               onPress={() => handleVoiceInput('businessName')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'businessName' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'businessName' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

//           {/* Business Type */}
//           <Text style={styles.label}>{t('businessReg.businessType')}</Text>
//           <View style={[styles.pickerWrapper, errors.businessType && styles.pickerError]}>
//             <Picker
//               selectedValue={formData.businessType}
//               onValueChange={(value) => updateField('businessType', value)}
//               style={styles.picker}
//             >
//               <Picker.Item label={t('businessReg.selectType')} value="" color="#B0B0B0" />
//               <Picker.Item label={t('businessReg.product')} value="product" />
//               <Picker.Item label={t('businessReg.service')} value="service" />
//             </Picker>
//           </View>
//           {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}

//           {/* Business Email */}
//           <Text style={styles.label}>{t('businessReg.businessEmail')}</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               value={formData.businessEmail}
//               onChangeText={(text) => updateField('businessEmail', text)}
//               placeholder={t('businessReg.businessEmailPlaceholder')}
//               placeholderTextColor="#B0B0B0"
//               keyboardType="email-address"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.voiceButton}
//               onPress={() => handleVoiceInput('businessEmail')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'businessEmail' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'businessEmail' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.businessEmail && <Text style={styles.errorText}>{errors.businessEmail}</Text>}

//           {/* Business Phone */}
//           <Text style={styles.label}>{t('businessReg.businessPhone')}</Text>
//           <View style={styles.phoneContainer}>
//             <View style={styles.countryCode}>
//               <Text style={styles.countryCodeText}>+92</Text>
//             </View>
//             <View style={styles.phoneInputWrapper}>
//               <TextInput
//                 style={styles.phoneInput}
//                 value={formData.businessPhone}
//                 onChangeText={handlePhoneChange}
//                 placeholder={t('businessReg.businessPhonePlaceholder')}
//                 placeholderTextColor="#B0B0B0"
//                 keyboardType="phone-pad"
//                 maxLength={11}
//                 editable={!loading}
//               />
//               <TouchableOpacity
//                 style={styles.voiceButton}
//                 onPress={() => handleVoiceInput('businessPhone')}
//                 disabled={loading}
//               >
//                 <Ionicons
//                   name={recordingField === 'businessPhone' ? 'mic' : 'mic-outline'}
//                   size={20}
//                   color={recordingField === 'businessPhone' ? COLORS.error : '#666'}
//                 />
//               </TouchableOpacity>
//             </View>
//           </View>
//           {errors.businessPhone && <Text style={styles.errorText}>{errors.businessPhone}</Text>}

//           {/* Business Category */}
//           <Text style={styles.label}>{t('businessReg.businessCategory')}</Text>
//           <View style={[styles.pickerWrapper, errors.businessCategory && styles.pickerError]}>
//             <Picker
//               selectedValue={formData.businessCategory}
//               onValueChange={(value) => updateField('businessCategory', value)}
//               style={styles.picker}
//             >
//               <Picker.Item label={t('businessReg.selectCategory')} value="" color="#B0B0B0" />
//               {businessCategories.map((category) => (
//                 <Picker.Item key={category.value} label={category.label} value={category.value} />
//               ))}
//             </Picker>
//           </View>
//           {errors.businessCategory && <Text style={styles.errorText}>{errors.businessCategory}</Text>}

//           {/* Business Description */}
//           <Text style={styles.label}>{t('businessReg.businessDescription')}</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={[styles.input, styles.multilineInput]}
//               value={formData.businessDescription}
//               onChangeText={(text) => updateField('businessDescription', text)}
//               placeholder={t('businessReg.businessDescriptionPlaceholder')}
//               placeholderTextColor="#B0B0B0"
//               multiline
//               numberOfLines={4}
//               textAlignVertical="top"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={[styles.voiceButton, styles.voiceButtonTop]}
//               onPress={() => handleVoiceInput('businessDescription')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'businessDescription' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'businessDescription' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.businessDescription && <Text style={styles.errorText}>{errors.businessDescription}</Text>}

//           {/* Office Address */}
//           <Text style={styles.label}>{t('businessReg.officeAddress')}</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={[styles.input, styles.multilineInput]}
//               value={formData.officeAddress}
//               onChangeText={(text) => updateField('officeAddress', text)}
//               placeholder={t('businessReg.officeAddressPlaceholder')}
//               placeholderTextColor="#B0B0B0"
//               multiline
//               numberOfLines={4}
//               textAlignVertical="top"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={[styles.voiceButton, styles.voiceButtonTop]}
//               onPress={() => handleVoiceInput('officeAddress')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'officeAddress' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'officeAddress' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.officeAddress && <Text style={styles.errorText}>{errors.officeAddress}</Text>}

//           {/* Logo Upload */}
//           <Text style={styles.label}>{t('businessReg.businessLogo')}</Text>
//           <TouchableOpacity
//             style={styles.uploadButton}
//             onPress={pickImage}
//             disabled={loading}
//           >
//             {formData.logo ? (
//               <View style={styles.imagePreviewContainer}>
//                 <Image
//                   source={{ uri: formData.logo.uri }}
//                   style={styles.imagePreview}
//                 />
//                 <Text style={styles.changeImageText}>{t('businessReg.changeLogo')}</Text>
//               </View>
//             ) : (
//               <View style={styles.uploadPlaceholder}>
//                 <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
//                 <Text style={styles.uploadText}>{t('businessReg.uploadLogo')}</Text>
//                 <Text style={styles.uploadSubtext}>{t('businessReg.uploadLogoSubtext')}</Text>
//               </View>
//             )}
//           </TouchableOpacity>

//           {/* Submit Button */}
//           <CustomButton
//             title={t('businessReg.completeRegistration')}
//             onPress={handleSubmit}
//             loading={loading}
//             disabled={loading}
//             style={styles.submitButton}
//           />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingTop: 16,
//     paddingBottom: 40,
//   },
//   header: {
//     marginBottom: 24,
//   },
//   headerRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   appName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: COLORS.primary || '#14b8a6',
//     letterSpacing: 2,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 8,
//     marginTop: 16,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     paddingRight: 8,
//     minHeight: 56,
//     marginBottom: 8,
//   },
//   input: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1a1a1a',
//     paddingHorizontal: 12,
//     paddingVertical: 16,
//     minHeight: 56,
//   },
//   multilineInput: {
//     minHeight: 100,
//     paddingTop: 16,
//     paddingBottom: 16,
//   },
//   voiceButton: {
//     padding: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   voiceButtonTop: {
//     alignSelf: 'flex-start',
//     marginTop: 8,
//   },
//   phoneContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   countryCode: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 56,
//     justifyContent: 'center',
//     marginRight: 8,
//   },
//   countryCodeText: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#1a1a1a',
//   },
//   phoneInputWrapper: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     paddingRight: 8,
//     height: 56,
//   },
//   phoneInput: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1a1a1a',
//     paddingHorizontal: 12,
//     paddingVertical: 0,
//   },
//   pickerWrapper: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     borderRadius: 12,
//     overflow: 'hidden',
//     height: 56,
//     justifyContent: 'center',
//     marginBottom: 8,
//   },
//   pickerError: {
//     borderColor: '#EF4444',
//   },
//   picker: {
//     height: 56,
//     color: '#1a1a1a',
//   },
//   uploadButton: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 2,
//     borderColor: '#E5E5E5',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 8,
//     minHeight: 150,
//   },
//   uploadPlaceholder: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   uploadText: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#333',
//     marginTop: 12,
//   },
//   uploadSubtext: {
//     fontSize: 13,
//     color: '#999',
//     marginTop: 4,
//   },
//   imagePreviewContainer: {
//     alignItems: 'center',
//   },
//   imagePreview: {
//     width: 100,
//     height: 100,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   changeImageText: {
//     fontSize: 14,
//     color: COLORS.primary,
//     fontWeight: '500',
//   },
//   errorText: {
//     fontSize: 12,
//     color: '#EF4444',
//     marginBottom: 8,
//     marginLeft: 2,
//   },
//   submitButton: {
//     marginTop: 24,
//     marginBottom: 20,
//   },
// });

// export default BusinessRegistrationScreen;

// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableOpacity,
//   TextInput,
//   Image,
//   Alert,
// } from 'react-native';
// import { getAccessToken } from '../utils/storage';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Picker } from '@react-native-picker/picker';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { useTranslation } from 'react-i18next';
// import CustomButton from '../components/common/CustomButton';
// import ErrorAlert from '../components/common/ErrorAlert';
// import LanguageSwitcher from '../components/common/LanguageSwitcher';
// import { COLORS } from '../constants/colors';
// import { createVendorProfile } from '../api/VendorService';
// import { startRecording, stopRecording, getRecordingDuration } from '../utils/audioRecorder';
// import { transcribeAudio } from '../api/sttService';

// const BusinessRegistrationScreen = ({ route, navigation }) => {
//   const { userId, userRole } = route.params || {};
//   const { t, i18n } = useTranslation();

//   const [formData, setFormData] = useState({
//     businessName: '',
//     businessType: '',
//     city: '',
//     area: '',
//     businessCategory: '',
//     businessDescription: '',
//     logo: null,
//   });

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [generalError, setGeneralError] = useState('');
//   const [isListening, setIsListening] = useState({});
//   const [recordingField, setRecordingField] = useState(null);
//   const [recording, setRecording] = useState(null);

//   // Categories with translations
//   const businessCategories = [
//     { label: t('businessReg.categories.electronics'), value: 'Electronics' },
//     { label: t('businessReg.categories.fashion'), value: 'Fashion & Apparel' },
//     { label: t('businessReg.categories.food'), value: 'Food & Beverage' },
//     { label: t('businessReg.categories.health'), value: 'Health & Beauty' },
//     { label: t('businessReg.categories.home'), value: 'Home & Garden' },
//     { label: t('businessReg.categories.sports'), value: 'Sports & Fitness' },
//     { label: t('businessReg.categories.automotive'), value: 'Automotive' },
//     { label: t('businessReg.categories.professional'), value: 'Professional Services' },
//     { label: t('businessReg.categories.education'), value: 'Education' },
//     { label: t('businessReg.categories.entertainment'), value: 'Entertainment' },
//     { label: t('businessReg.categories.realEstate'), value: 'Real Estate' },
//     { label: t('businessReg.categories.other'), value: 'Other' },
//   ];
// // Add to BusinessRegistration screen (top of screen):

//   const handleCancel = async () => {
//     console.log('🚪 [BusinessRegistration] User cancelled, logging out...');
//     await logout();
//     navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
//   };


//   const updateField = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//     setGeneralError('');
//   };

//   const handleVoiceInput = async (field) => {
//     if (recordingField === field) {
//       await stopVoiceRecording(field);
//     } else {
//       await startVoiceRecording(field);
//     }
//   };

//   const startVoiceRecording = async (field) => {
//     try {
//       console.log(`🎤 Starting recording for: ${field}`);
//       const newRecording = await startRecording();
//       setRecording(newRecording);
//       setRecordingField(field);
//       setIsListening(prev => ({ ...prev, [field]: true }));
//     } catch (error) {
//       console.error('Recording error:', error);
//       Alert.alert(
//         t('businessReg.alerts.recordingError'),
//         error.message || t('businessReg.alerts.recordingFailed')
//       );
//     }
//   };

//   const stopVoiceRecording = async (field) => {
//     try {
//       setRecordingField(null);
//       setIsListening(prev => ({ ...prev, [field]: false }));

//       const recordingDuration = recording ? await getRecordingDuration(recording) : 0;
//       console.log('⏱️ Recording duration:', recordingDuration, 'ms');

//       if (recordingDuration < 1000) {
//         Alert.alert(
//           t('businessReg.alerts.recordingTooShort'),
//           t('businessReg.alerts.recordingMessage'),
//           [{ text: t('common.ok') }]
//         );

//         if (recording) {
//           await recording.stopAndUnloadAsync();
//         }
//         setRecording(null);
//         return;
//       }

//       const audioUri = await stopRecording(recording);
//       console.log('📁 Audio URI:', audioUri);

//       const languageCode = i18n.language === 'en' ? 'en-US' : 'ur-PK';
//       console.log(`📤 BusinessReg language: ${i18n.language} -> ${languageCode}`);

//       let fieldType = 'default';
//       if (field === 'businessName' || field === 'city' || field === 'area') {
//         fieldType = 'name';
//       }

//       const result = await transcribeAudio(audioUri, {
//         encoding: 'LINEAR16',
//         sampleRateHertz: 44100,
//         languageCode: languageCode,
//         fieldType: fieldType,
//       });

//       if (result.success) {
//         const transcribedText = result.data?.transcript || '';

//         if (transcribedText && transcribedText.trim()) {
//           updateField(field, transcribedText.trim());
//           console.log(`✅ ${field} updated with:`, transcribedText.trim());
//         } else {
//           Alert.alert(
//             t('businessReg.alerts.noSpeech'),
//             t('businessReg.alerts.noSpeechMessage')
//           );
//         }
//       } else {
//         Alert.alert(
//           t('businessReg.alerts.transcriptionError'),
//           result.error || t('businessReg.alerts.transcriptionFailed')
//         );
//       }

//       setRecording(null);
//     } catch (error) {
//       console.error('❌ Transcription error:', error);
//       Alert.alert(
//         t('businessReg.alerts.transcriptionError'),
//         t('businessReg.alerts.transcriptionFailed')
//       );
//       setRecording(null);
//       setIsListening(prev => ({ ...prev, [field]: false }));
//     }
//   };

//   const pickImage = async () => {
//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (status !== 'granted') {
//         Alert.alert(
//           t('businessReg.alerts.permissionDenied'),
//           t('businessReg.alerts.permissionMessage')
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         updateField('logo', result.assets[0]);
//       }
//     } catch (error) {
//       console.error('Image picker error:', error);
//       Alert.alert(t('common.error'), t('businessReg.alerts.imagePickerError'));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.businessName.trim()) {
//       newErrors.businessName = t('businessReg.errors.businessNameRequired');
//     }

//     if (!formData.businessType) {
//       newErrors.businessType = t('businessReg.errors.businessTypeRequired');
//     }

//     if (!formData.city.trim()) {
//       newErrors.city = t('businessReg.errors.cityRequired');
//     }

//     if (!formData.area.trim()) {
//       newErrors.area = t('businessReg.errors.areaRequired');
//     }

//     if (!formData.businessCategory) {
//       newErrors.businessCategory = t('businessReg.errors.businessCategoryRequired');
//     }

//     if (!formData.businessDescription.trim()) {
//       newErrors.businessDescription = t('businessReg.errors.businessDescriptionRequired');
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     setGeneralError('');

//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);

//     try {
//       const token = await getAccessToken();
//       console.log('🔑 Token exists:', !!token);

//       const profileData = {
//         vendor_type: formData.businessType,
//         business_name_en: formData.businessName.trim(),
//         business_name_ur: null,
//         description_en: formData.businessDescription.trim(),
//         description_ur: null,
//         category: formData.businessCategory,
//         city: formData.city.trim(),
//         area: formData.area.trim(),
//         location: null,
//         is_female_only: false,
//         media: formData.logo ? { logo_url: formData.logo.uri } : null,
//       };

//       console.log('📤 Sending profile data:', profileData);
//       const result = await createVendorProfile(profileData);

//       if (result.success) {
//         console.log('✅ Profile created successfully:', result.data);
//         navigation.reset({
//           index: 0,
//           routes: [{
//             name: 'VendorDashboard',
//             params: {
//               vendorProfile: result.data.data?.profile || result.data.profile,
//               userId: userId,
//             }
//           }],
//         });
//       } else {
//         console.error('❌ Profile creation failed:', result.error);
//         setGeneralError(result.error || t('businessReg.errors.registrationFailed'));
//       }
//     } catch (err) {
//       console.error('❌ Business registration error:', err);
//       setGeneralError(t('businessReg.errors.registrationFailed'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         style={styles.keyboardAvoid}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <View style={styles.headerRow}>
//               <Text style={styles.appName}>{t('businessReg.appName')}</Text>
//               <LanguageSwitcher />
//             </View>
//             <Text style={styles.title}>{t('businessReg.title')}</Text>
//             <Text style={styles.subtitle}>
//               {userRole === 'vendor' ? t('businessReg.subtitle') : t('businessReg.serviceProviderInfo')}
//             </Text>
//           </View>

//           {generalError ? <ErrorAlert message={generalError} /> : null}

//           {/* Business Name */}
//           <Text style={styles.label}>{t('businessReg.businessName')}</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               value={formData.businessName}
//               onChangeText={(text) => updateField('businessName', text)}
//               placeholder={t('businessReg.businessNamePlaceholder')}
//               placeholderTextColor="#B0B0B0"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.voiceButton}
//               onPress={() => handleVoiceInput('businessName')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'businessName' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'businessName' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

//           {/* Business Type */}
//           <Text style={styles.label}>{t('businessReg.businessType')}</Text>
//           <View style={[styles.pickerWrapper, errors.businessType && styles.pickerError]}>
//             <Picker
//               selectedValue={formData.businessType}
//               onValueChange={(value) => updateField('businessType', value)}
//               style={styles.picker}
//             >
//               <Picker.Item label={t('businessReg.selectType')} value="" color="#B0B0B0" />
//               <Picker.Item label={t('businessReg.product')} value="product" />
//               <Picker.Item label={t('businessReg.service')} value="service" />
//             </Picker>
//           </View>
//           {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}

//           {/* City */}
//           <Text style={styles.label}>{t('businessReg.city')}</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               value={formData.city}
//               onChangeText={(text) => updateField('city', text)}
//               placeholder={t('businessReg.cityPlaceholder')}
//               placeholderTextColor="#B0B0B0"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.voiceButton}
//               onPress={() => handleVoiceInput('city')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'city' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'city' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

//           {/* Area */}
//           <Text style={styles.label}>{t('businessReg.area')}</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               value={formData.area}
//               onChangeText={(text) => updateField('area', text)}
//               placeholder={t('businessReg.areaPlaceholder')}
//               placeholderTextColor="#B0B0B0"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.voiceButton}
//               onPress={() => handleVoiceInput('area')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'area' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'area' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}

//           {/* Business Category */}
//           <Text style={styles.label}>{t('businessReg.businessCategory')}</Text>
//           <View style={[styles.pickerWrapper, errors.businessCategory && styles.pickerError]}>
//             <Picker
//               selectedValue={formData.businessCategory}
//               onValueChange={(value) => updateField('businessCategory', value)}
//               style={styles.picker}
//             >
//               <Picker.Item label={t('businessReg.selectCategory')} value="" color="#B0B0B0" />
//               {businessCategories.map((category) => (
//                 <Picker.Item key={category.value} label={category.label} value={category.value} />
//               ))}
//             </Picker>
//           </View>
//           {errors.businessCategory && <Text style={styles.errorText}>{errors.businessCategory}</Text>}

//           {/* Business Description */}
//           <Text style={styles.label}>{t('businessReg.businessDescription')}</Text>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={[styles.input, styles.multilineInput]}
//               value={formData.businessDescription}
//               onChangeText={(text) => updateField('businessDescription', text)}
//               placeholder={t('businessReg.businessDescriptionPlaceholder')}
//               placeholderTextColor="#B0B0B0"
//               multiline
//               numberOfLines={4}
//               textAlignVertical="top"
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={[styles.voiceButton, styles.voiceButtonTop]}
//               onPress={() => handleVoiceInput('businessDescription')}
//               disabled={loading}
//             >
//               <Ionicons
//                 name={recordingField === 'businessDescription' ? 'mic' : 'mic-outline'}
//                 size={20}
//                 color={recordingField === 'businessDescription' ? COLORS.error : '#666'}
//               />
//             </TouchableOpacity>
//           </View>
//           {errors.businessDescription && <Text style={styles.errorText}>{errors.businessDescription}</Text>}

//           {/* Logo Upload */}
//           <Text style={styles.label}>{t('businessReg.businessLogo')}</Text>
//           <TouchableOpacity
//             style={styles.uploadButton}
//             onPress={pickImage}
//             disabled={loading}
//           >
//             {formData.logo ? (
//               <View style={styles.imagePreviewContainer}>
//                 <Image
//                   source={{ uri: formData.logo.uri }}
//                   style={styles.imagePreview}
//                 />
//                 <Text style={styles.changeImageText}>{t('businessReg.changeLogo')}</Text>
//               </View>
//             ) : (
//               <View style={styles.uploadPlaceholder}>
//                 <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
//                 <Text style={styles.uploadText}>{t('businessReg.uploadLogo')}</Text>
//                 <Text style={styles.uploadSubtext}>{t('businessReg.uploadLogoSubtext')}</Text>
//               </View>
//             )}
//           </TouchableOpacity>

//           {/* Submit Button */}
//           <CustomButton
//             title={t('businessReg.completeRegistration')}
//             onPress={handleSubmit}
//             loading={loading}
//             disabled={loading}
//             style={styles.submitButton}
//           />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingTop: 16,
//     paddingBottom: 40,
//   },
//   header: {
//     marginBottom: 24,
//   },
//   headerRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   appName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: COLORS.primary || '#14b8a6',
//     letterSpacing: 2,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 8,
//     marginTop: 16,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     paddingRight: 8,
//     minHeight: 56,
//     marginBottom: 8,
//   },
//   input: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1a1a1a',
//     paddingHorizontal: 12,
//     paddingVertical: 16,
//     minHeight: 56,
//   },
//   multilineInput: {
//     minHeight: 100,
//     paddingTop: 16,
//     paddingBottom: 16,
//   },
//   voiceButton: {
//     padding: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   voiceButtonTop: {
//     alignSelf: 'flex-start',
//     marginTop: 8,
//   },
//   pickerWrapper: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     borderRadius: 12,
//     overflow: 'hidden',
//     height: 56,
//     justifyContent: 'center',
//     marginBottom: 8,
//   },
//   pickerError: {
//     borderColor: '#EF4444',
//   },
//   picker: {
//     height: 56,
//     color: '#1a1a1a',
//   },
//   uploadButton: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 2,
//     borderColor: '#E5E5E5',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 8,
//     minHeight: 150,
//   },
//   uploadPlaceholder: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   uploadText: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#333',
//     marginTop: 12,
//   },
//   uploadSubtext: {
//     fontSize: 13,
//     color: '#999',
//     marginTop: 4,
//   },
//   imagePreviewContainer: {
//     alignItems: 'center',
//   },
//   imagePreview: {
//     width: 100,
//     height: 100,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   changeImageText: {
//     fontSize: 14,
//     color: COLORS.primary,
//     fontWeight: '500',
//   },
//   errorText: {
//     fontSize: 12,
//     color: '#EF4444',
//     marginBottom: 8,
//     marginLeft: 2,
//   },
//   submitButton: {
//     marginTop: 24,
//     marginBottom: 20,
//   },
// });

// export default BusinessRegistrationScreen;


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
import { createVendorProfile } from '../api/VendorService';
import { startRecording, stopRecording, getRecordingDuration } from '../utils/audioRecorder';
import { transcribeAudio } from '../api/sttService';
import { uploadVendorImage } from '../api/uploadService';
import { useAuth } from '../context/AuthContext';


const BusinessRegistrationScreen = ({ route, navigation }) => {
  const { userId, userRole } = route.params || {};
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();


  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    city: '',
    area: '',
    businessCategory: '',
    businessDescription: '',
    logo: null,
  });


  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [isListening, setIsListening] = useState({});
  const [recordingField, setRecordingField] = useState(null);
  const [recording, setRecording] = useState(null);


  // Categories with translations
  const businessCategories = [
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


  // ✅ CANCEL/LOGOUT HANDLER
  const handleCancel = async () => {
    console.log('🚪 [BusinessRegistration] User cancelled, logging out...');
    try {
      await logout();
      console.log('✅ [BusinessRegistration] Logout successful');
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      console.error('❌ [BusinessRegistration] Logout error:', error);
      // Force navigate even if logout fails
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  };


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


  const handleVoiceInput = async (field) => {
    if (recordingField === field) {
      await stopVoiceRecording(field);
    } else {
      await startVoiceRecording(field);
    }
  };


  const startVoiceRecording = async (field) => {
    try {
      console.log(`🎤 Starting recording for: ${field}`);
      const newRecording = await startRecording();
      setRecording(newRecording);
      setRecordingField(field);
      setIsListening(prev => ({ ...prev, [field]: true }));
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert(
        t('businessReg.alerts.recordingError'),
        error.message || t('businessReg.alerts.recordingFailed')
      );
    }
  };


  const stopVoiceRecording = async (field) => {
    try {
      setRecordingField(null);
      setIsListening(prev => ({ ...prev, [field]: false }));


      const recordingDuration = recording ? await getRecordingDuration(recording) : 0;
      console.log('⏱️ Recording duration:', recordingDuration, 'ms');


      if (recordingDuration < 1000) {
        Alert.alert(
          t('businessReg.alerts.recordingTooShort'),
          t('businessReg.alerts.recordingMessage'),
          [{ text: t('common.ok') }]
        );


        if (recording) {
          await recording.stopAndUnloadAsync();
        }
        setRecording(null);
        return;
      }


      const audioUri = await stopRecording(recording);
      console.log('📁 Audio URI:', audioUri);


      const languageCode = i18n.language === 'en' ? 'en-US' : 'ur-PK';
      console.log(`📤 BusinessReg language: ${i18n.language} -> ${languageCode}`);


      let fieldType = 'default';
      if (field === 'businessName' || field === 'city' || field === 'area') {
        fieldType = 'name';
      }


      const result = await transcribeAudio(audioUri, {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
        languageCode: languageCode,
        fieldType: fieldType,
      });


      if (result.success) {
        const transcribedText = result.data?.transcript || '';


        if (transcribedText && transcribedText.trim()) {
          updateField(field, transcribedText.trim());
          console.log(`✅ ${field} updated with:`, transcribedText.trim());
        } else {
          Alert.alert(
            t('businessReg.alerts.noSpeech'),
            t('businessReg.alerts.noSpeechMessage')
          );
        }
      } else {
        Alert.alert(
          t('businessReg.alerts.transcriptionError'),
          result.error || t('businessReg.alerts.transcriptionFailed')
        );
      }


      setRecording(null);
    } catch (error) {
      console.error('❌ Transcription error:', error);
      Alert.alert(
        t('businessReg.alerts.transcriptionError'),
        t('businessReg.alerts.transcriptionFailed')
      );
      setRecording(null);
      setIsListening(prev => ({ ...prev, [field]: false }));
    }
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });


      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;

        // Show uploading state
        setLoading(true);

        try {
          console.log('📤 Uploading logo to Supabase...');

          // Upload to Supabase via backend
          const uploadResult = await uploadVendorImage(localUri, 'logo');

          if (uploadResult.success) {
            // Store Supabase URL (NOT local URI)
            updateField('logo', {
              uri: uploadResult.imageUrl, // ✅ This is Supabase URL
              ...result.assets[0],
            });

            console.log('✅ Logo uploaded successfully:', uploadResult.imageUrl);
            Alert.alert(
              t('common.success') || 'Success',
              'Logo uploaded successfully!'
            );
          } else {
            console.error('❌ Upload failed:', uploadResult.error);
            Alert.alert(
              t('common.error') || 'Error',
              uploadResult.error || 'Failed to upload logo'
            );
          }
        } catch (uploadError) {
          console.error('❌ Upload exception:', uploadError);
          Alert.alert(
            t('common.error') || 'Error',
            'Failed to upload image to server'
          );
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('businessReg.alerts.imagePickerError') || 'Failed to pick image'
      );
    }
  };


  const validateForm = () => {
    const newErrors = {};


    if (!formData.businessName.trim()) {
      newErrors.businessName = t('businessReg.errors.businessNameRequired');
    }


    if (!formData.businessType) {
      newErrors.businessType = t('businessReg.errors.businessTypeRequired');
    }


    if (!formData.city.trim()) {
      newErrors.city = t('businessReg.errors.cityRequired');
    }


    if (!formData.area.trim()) {
      newErrors.area = t('businessReg.errors.areaRequired');
    }


    if (!formData.businessCategory) {
      newErrors.businessCategory = t('businessReg.errors.businessCategoryRequired');
    }


    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = t('businessReg.errors.businessDescriptionRequired');
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
      console.log('🔑 [BusinessRegistration] Token exists:', !!token);


      const profileData = {
        vendor_type: formData.businessType,
        business_name_en: formData.businessName.trim(),
        business_name_ur: null,
        description_en: formData.businessDescription.trim(),
        description_ur: null,
        category: formData.businessCategory,
        city: formData.city.trim(),
        area: formData.area.trim(),
        location: null,
        is_female_only: false,
        media: formData.logo ? { logo_url: formData.logo.uri } : null,
      };


      console.log('📤 [BusinessRegistration] Sending profile data:', profileData);
      const result = await createVendorProfile(profileData);


      if (result.success) {
        console.log('✅ [BusinessRegistration] Profile created successfully:', result.data);
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
        console.error('❌ [BusinessRegistration] Profile creation failed:', result.error);
        setGeneralError(result.error || t('businessReg.errors.registrationFailed'));
      }
    } catch (err) {
      console.error('❌ [BusinessRegistration] Business registration error:', err);
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);

      if (err.response) {
        console.error('API Response Status:', err.response.status);
        console.error('API Response Data:', JSON.stringify(err.response.data, null, 2));
      }

      setGeneralError(err.response?.data?.error || t('businessReg.errors.registrationFailed'));
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
          {/* Header with Cancel Button */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.cancelButton}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>

              <Text style={styles.appName}>{t('businessReg.appName')}</Text>

              <LanguageSwitcher />
            </View>
            <Text style={styles.title}>{t('businessReg.title')}</Text>
            <Text style={styles.subtitle}>
              {userRole === 'vendor' ? t('businessReg.subtitle') : t('businessReg.serviceProviderInfo')}
            </Text>
          </View>


          {generalError ? <ErrorAlert message={generalError} /> : null}


          {/* Business Name */}
          <Text style={styles.label}>{t('businessReg.businessName')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.businessName}
              onChangeText={(text) => updateField('businessName', text)}
              placeholder={t('businessReg.businessNamePlaceholder')}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => handleVoiceInput('businessName')}
              disabled={loading}
            >
              <Ionicons
                name={recordingField === 'businessName' ? 'mic' : 'mic-outline'}
                size={20}
                color={recordingField === 'businessName' ? COLORS.error : '#666'}
              />
            </TouchableOpacity>
          </View>
          {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}


          {/* Business Type */}
          <Text style={styles.label}>{t('businessReg.businessType')}</Text>
          <View style={[styles.pickerWrapper, errors.businessType && styles.pickerError]}>
            <Picker
              selectedValue={formData.businessType}
              onValueChange={(value) => updateField('businessType', value)}
              style={styles.picker}
            >
              <Picker.Item label={t('businessReg.selectType')} value="" color="#B0B0B0" />
              <Picker.Item label={t('businessReg.product')} value="product" />
              <Picker.Item label={t('businessReg.service')} value="service" />
            </Picker>
          </View>
          {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}


          {/* City */}
          <Text style={styles.label}>{t('businessReg.city')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
              placeholder={t('businessReg.cityPlaceholder')}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => handleVoiceInput('city')}
              disabled={loading}
            >
              <Ionicons
                name={recordingField === 'city' ? 'mic' : 'mic-outline'}
                size={20}
                color={recordingField === 'city' ? COLORS.error : '#666'}
              />
            </TouchableOpacity>
          </View>
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}


          {/* Area */}
          <Text style={styles.label}>{t('businessReg.area')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.area}
              onChangeText={(text) => updateField('area', text)}
              placeholder={t('businessReg.areaPlaceholder')}
              placeholderTextColor="#B0B0B0"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => handleVoiceInput('area')}
              disabled={loading}
            >
              <Ionicons
                name={recordingField === 'area' ? 'mic' : 'mic-outline'}
                size={20}
                color={recordingField === 'area' ? COLORS.error : '#666'}
              />
            </TouchableOpacity>
          </View>
          {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}


          {/* Business Category */}
          <Text style={styles.label}>{t('businessReg.businessCategory')}</Text>
          <View style={[styles.pickerWrapper, errors.businessCategory && styles.pickerError]}>
            <Picker
              selectedValue={formData.businessCategory}
              onValueChange={(value) => updateField('businessCategory', value)}
              style={styles.picker}
            >
              <Picker.Item label={t('businessReg.selectCategory')} value="" color="#B0B0B0" />
              {businessCategories.map((category) => (
                <Picker.Item key={category.value} label={category.label} value={category.value} />
              ))}
            </Picker>
          </View>
          {errors.businessCategory && <Text style={styles.errorText}>{errors.businessCategory}</Text>}


          {/* Business Description */}
          <Text style={styles.label}>{t('businessReg.businessDescription')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.businessDescription}
              onChangeText={(text) => updateField('businessDescription', text)}
              placeholder={t('businessReg.businessDescriptionPlaceholder')}
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
                name={recordingField === 'businessDescription' ? 'mic' : 'mic-outline'}
                size={20}
                color={recordingField === 'businessDescription' ? COLORS.error : '#666'}
              />
            </TouchableOpacity>
          </View>
          {errors.businessDescription && <Text style={styles.errorText}>{errors.businessDescription}</Text>}


          {/* Logo Upload */}
          <Text style={styles.label}>{t('businessReg.businessLogo')}</Text>
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
                <Text style={styles.changeImageText}>{t('businessReg.changeLogo')}</Text>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
                <Text style={styles.uploadText}>{t('businessReg.uploadLogo')}</Text>
                <Text style={styles.uploadSubtext}>{t('businessReg.uploadLogoSubtext')}</Text>
              </View>
            )}
          </TouchableOpacity>


          {/* Submit Button */}
          <CustomButton
            title={t('businessReg.completeRegistration')}
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
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary || '#14b8a6',
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
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