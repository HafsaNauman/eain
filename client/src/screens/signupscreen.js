import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

const SignupScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  // Step 1: send OTP
  const handleSendOTP = async () => {
    const response = await fetch('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phonenumber: phoneNumber }),
    });
    const result = await response.json();
    if (result.success) {
      Alert.alert('OTP Sent', 'Check your phone for the OTP');
      setStep(2);
    } else {
      Alert.alert('Error', result.message || 'Could not send OTP');
    }
  };

  // Step 2: verify OTP
  const handleVerifyOTP = async () => {
    const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phonenumber: phoneNumber, otpcode: otp }),
    });
    const result = await response.json();
    if (result.success) {
      Alert.alert('Verified', 'OTP verified!');
      setStep(3);
    } else {
      Alert.alert('Error', result.message || 'Invalid OTP code');
    }
  };

  // Step 3: complete signup
  const handleSignup = async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: fullName,
        phonenumber: phoneNumber,
        password,
        email,
      }),
    });
    const result = await response.json();
    if (result.success) {
      Alert.alert('Sign Up Successful', 'Welcome!');
      navigation.replace('Login');
    } else {
      Alert.alert('Signup Failed', result.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFFDEB' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFAB91', marginBottom: 12 }}>
        EAIN Signup
      </Text>
      {step === 1 && (
        <>
          <TextInput
            placeholder="Enter Phone Number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={{
              borderWidth: 1, borderColor: '#008080', padding: 12,
              borderRadius: 20, marginBottom: 24, backgroundColor: '#fff'
            }}
          />
          <TouchableOpacity
            onPress={handleSendOTP}
            style={{
              backgroundColor: '#FFAB91', padding: 14,
              borderRadius: 24, alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
              Send OTP
            </Text>
          </TouchableOpacity>
        </>
      )}
      {step === 2 && (
        <>
          <TextInput
            placeholder="Enter OTP"
            keyboardType="numeric"
            value={otp}
            onChangeText={setOtp}
            style={{
              borderWidth: 1, borderColor: '#FFAB91', padding: 12,
              borderRadius: 20, marginBottom: 24, backgroundColor: '#fff'
            }}
          />
          <TouchableOpacity
            onPress={handleVerifyOTP}
            style={{
              backgroundColor: '#008080', padding: 14,
              borderRadius: 24, alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
              Verify OTP
            </Text>
          </TouchableOpacity>
        </>
      )}
      {step === 3 && (
        <>
          <TextInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            style={{
              borderWidth: 1, borderColor: '#008080', padding: 12,
              borderRadius: 20, marginBottom: 12, backgroundColor: '#fff'
            }}
          />
          <TextInput
            placeholder="Email (optional)"
            value={email}
            onChangeText={setEmail}
            style={{
              borderWidth: 1, borderColor: '#FFAB91', padding: 12,
              borderRadius: 20, marginBottom: 12, backgroundColor: '#fff'
            }}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              borderWidth: 1, borderColor: '#008080', padding: 12,
              borderRadius: 20, marginBottom: 12, backgroundColor: '#fff'
            }}
          />
          <TouchableOpacity
            onPress={handleSignup}
            style={{
              backgroundColor: '#FFAB91', padding: 14,
              borderRadius: 24, alignItems: 'center', marginTop: 12
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
              Create Account
            </Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 18 }}>
        <Text style={{ color: '#008080', fontWeight: 'bold', textAlign: 'center' }}>
          Already have an account? Log in
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupScreen;
