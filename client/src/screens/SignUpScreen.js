/**
 * Sign Up Screen - EAIN Design
 * 
 * Complete sign up form with all fields
 * Fields: First Name, Last Name, Email (optional), Password, Gender, Role
 * Voice input for First Name and Last Name
 */
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import VoiceInputButton from '../components/voice/VoiceInputButton';
import ErrorAlert from '../components/common/ErrorAlert';
import { COLORS } from '../constants/colors';
import { validateEmail, validatePassword, validateName } from '../utils/validation';
import { signUp } from '../api/authService';
import { saveTokens, saveUserData } from '../utils/storage';


const SignUpScreen = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: '',
    role: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    setGeneralError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = 'Please enter a valid name';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Please enter a valid name';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Min 6 characters with a number';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select gender';
    }

    if (!formData.role) {
      newErrors.role = 'Please select role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: phoneNumber,
        email: formData.email.trim() || null,
        password: formData.password,
        gender: formData.gender,
        role: formData.role,
      });

      if (result.success) {
        const { accessToken, refreshToken, user } = result.data.data;
        await saveTokens(accessToken, refreshToken);
        await saveUserData(user);

        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        setGeneralError(result.error);
      }
    } catch (err) {
      setGeneralError('Failed to create account. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscription = (transcribedText, field) => {
    updateField(field, transcribedText.trim());
  };

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
            <Text style={styles.appName}>EAIN</Text>
            <Text style={styles.title}>Create an{'\n'}account</Text>
          </View>

          {/* Error Alert */}
          {generalError ? <ErrorAlert message={generalError} /> : null}

          // Replace inside your SignUpScreen component

        {/* First Name with Voice Input */}
            <View style={styles.fieldContainer}>
            <View style={styles.inputWithButton}>
              <CustomInput
                value={formData.firstName}
                    onChangeText={(text) => updateField('firstName', text)}
                    placeholder="First Name"
                    error={errors.firstName}
                    autoCapitalize="words"
                    style={{ flex: 1 }}
                        />
                  <VoiceInputButton
                  onTranscriptionComplete={(text) => handleVoiceTranscription(text, 'firstName')}
                  disabled={loading}
                  style={{ marginLeft: 8 }}
                  />
                 </View>
                </View>

              {/* Last Name with Voice Input */}
                <View style={styles.fieldContainer}>
                <View style={styles.inputWithButton}>
                <CustomInput
                 value={formData.lastName}
                     onChangeText={(text) => updateField('lastName', text)}
                     placeholder="Last Name"
                     error={errors.lastName}
                    autoCapitalize="words"
                    style={{ flex: 1 }}
                     />
                    <VoiceInputButton
                     onTranscriptionComplete={(text) => handleVoiceTranscription(text, 'lastName')}
                     disabled={loading}
                     style={{ marginLeft: 8 }}
                       />
                     </View>
              </View>


          {/* Email */}
          <CustomInput
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="Email (Optional)"
            error={errors.email}
            keyboardType="email-address"
          />

          {/* Password */}
          <CustomInput
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            placeholder="Password"
            error={errors.password}
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <AntDesign 
                  name={showPassword ? 'eye' : 'eyeo'} 
                  size={20} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            }

          />

          {/* Gender Dropdown */}
          <View style={styles.pickerContainer}>
            <View style={[styles.pickerWrapper, errors.gender && styles.pickerError]}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => updateField('gender', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" color={COLORS.placeholder} />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          {/* Role Dropdown */}
          <View style={styles.pickerContainer}>
            <View style={[styles.pickerWrapper, errors.role && styles.pickerError]}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => updateField('role', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Role" value="" color={COLORS.placeholder} />
                <Picker.Item label="Customer" value="customer" />
                <Picker.Item label="Service Provider" value="service_provider" />
                <Picker.Item label="Vendor" value="vendor" />
              </Picker>
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </View>

          {/* Terms Text */}
          <Text style={styles.termsText}>
            By clicking the <Text style={styles.termsHighlight}>Register</Text> button, you agree{'\n'}
            to the public offer
          </Text>

          {/* Create Account Button */}
          <CustomButton
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.createButton}
          />

          {/* Social Login Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>- OR Continue with -</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          {/* Social Login Buttons */}
<View style={styles.socialContainer}>
  {/* Google */}
  <TouchableOpacity style={[styles.socialButton, { borderColor: '#DB4437' }]}>
    <Image source={require('../../assets/google.png')} style={styles.socialIconImage} />
  </TouchableOpacity>

  {/* Apple */}
  <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#000', borderColor: '#000' }]}>
    <Image source={require('../../assets/apple.png')} style={styles.socialIconImage} />
  </TouchableOpacity>

  {/* Facebook
  <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1877F2', borderColor: '#1877F2' }]}>
    <Image source={require('../assets/facebook.png')} style={styles.socialIconImage} />
  </TouchableOpacity> */}
</View>


          {/* Login Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              I Already Have an Account <Text style={styles.loginTextBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  fieldContainer: {
    marginBottom: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerWrapper: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
    justifyContent: 'center',
  },
  pickerError: {
    borderColor: COLORS.error,
  },
  picker: {
    height: 56,
    color: COLORS.text,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 4,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'left',
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 18,
  },
  termsHighlight: {
    color: COLORS.error,
    fontWeight: '600',
  },
  createButton: {
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginHorizontal: 10,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 24,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  socialIcon: {
    fontSize: 22,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  inputWithButton: {
  flexDirection: 'row',
  alignItems: 'center',
},

socialIconImage: {
  width: 24,
  height: 24,
  resizeMode: 'contain',
},

  loginTextBold: {
    fontWeight: '700',
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
