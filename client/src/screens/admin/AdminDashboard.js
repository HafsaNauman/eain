import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { getAnalytics } from '../../api/adminService'; // Your service

const AdminDashboard = ({ navigation }) => {
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
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <FlatList
        data={stats}
        renderItem={renderStat}
        numColumns={2}
        keyExtractor={item => item.title}
      />
      <Text style={styles.revenue}>Revenue: PKR {analytics.revenue?.total_revenue?.toLocaleString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  statCard: { 
    flex: 1, backgroundColor: 'white', padding: 20, margin: 8, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    alignItems: 'center'
  },
  statTitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#036c5f' },
  revenue: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 20 }
});

export default AdminDashboard;