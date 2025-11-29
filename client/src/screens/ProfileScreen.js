import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
  const wasVendor = user?.role === 'vendor';
  await logout();
  
  // Navigate to appropriate screen
  if (wasVendor) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  } else {
    navigation.navigate('Home');
  }
};



  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome!</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('PhoneNumber')}
        >
          <Text style={styles.createText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.authenticatedContainer} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.email}>{user?.email || user?.phone_number}</Text>
          <Text style={styles.role}>Role: {user?.role || 'User'}</Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  authenticatedContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: COLORS.text,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  loginText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  createBtn: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  createText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  role: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
