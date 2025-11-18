import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phonenumber: phoneNumber, password }),
      });
      const result = await response.json();
      if (result.success) {
        // Store tokens, navigate to app
        // AsyncStorage.setItem("accessToken", result.data.accessToken);
        // navigation.replace('Home');
        Alert.alert('Success', 'Logged in!');
      } else {
        Alert.alert('Login Failed', result.message || 'Try again');
      }
    } catch (err) {
      Alert.alert('Network Error', err.message);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#E8F0F2' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#008080', marginBottom: 24 }}>
        EAIN Login
      </Text>
      <TextInput
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        style={{
          borderWidth: 1, borderColor: '#008080', padding: 12,
          borderRadius: 20, marginBottom: 16, backgroundColor: '#fff'
        }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1, borderColor: '#FFDAB9', padding: 12,
          borderRadius: 20, marginBottom: 24, backgroundColor: '#fff'
        }}
      />
      <TouchableOpacity
        onPress={handleLogin}
        style={{
          backgroundColor: '#008080',
          padding: 14, borderRadius: 24,
          alignItems: 'center', marginBottom: 12
        }}
        disabled={loading}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={{ color: '#FFAB91', fontWeight: 'bold', textAlign: 'center' }}>
          Don't have an account? Sign up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
