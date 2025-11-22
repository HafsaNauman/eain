import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const ProfileScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => alert('Login screen goes here')}
      >
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('PhoneNumber')} // <- Step 2
      >
        <Text style={styles.createText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, color: COLORS.text },
  loginBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, width: '100%', marginBottom: 12 },
  loginText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  createBtn: { backgroundColor: COLORS.backgroundSecondary, padding: 16, borderRadius: 12, width: '100%' },
  createText: { color: COLORS.primary, textAlign: 'center', fontWeight: 'bold' },
});

export default ProfileScreen;
