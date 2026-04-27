import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAnalytics } from '../../api/adminService'; // Your service
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AdminDashboard = ({ navigation }) => {
  const { logout } = useAuth();
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    getAnalytics().then(({ data }) => setAnalytics(data)).catch(console.error);
  }, []);

  const stats = [
    { title: 'Users', value: analytics.overview?.total_users || 0, screen: 'UsersManagement' },
    { title: 'Vendors', value: analytics.overview?.active_vendors || 0, screen: 'VendorsManagement' },
    { title: 'Listings', value: analytics.overview?.active_listings || 0, screen: 'ListingsManagement' },
    { title: 'Orders', value: analytics.overview?.total_orders || 0, screen: 'OrdersManagement' },
  ];

  const renderStat = ({ item }) => (
    <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate(item.screen)}>
      <Text style={styles.statTitle}>{item.title}</Text>
      <Text style={styles.statValue}>{item.value}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={stats}
        renderItem={renderStat}
        numColumns={2}
        keyExtractor={item => item.title}
      />
      <Text style={styles.revenue}>Revenue: PKR {analytics.revenue?.total_revenue?.toLocaleString()}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    backgroundColor: '#f5f5f5'
  },
  header: { fontSize: 24, fontWeight: 'bold' },
  statCard: {
    flex: 1, backgroundColor: 'white', padding: 20, margin: 8, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    alignItems: 'center'
  },
  statTitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#036c5f' },
  revenue: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});

export default AdminDashboard;