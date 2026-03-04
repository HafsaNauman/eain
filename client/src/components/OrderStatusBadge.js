import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  pending: { bg: '#fff3e0', text: '#ff9800' },
  confirmed: { bg: '#e8f5e8', text: '#2e7d32' },
  processing: { bg: '#e3f2fd', text: '#1976d2' },
  ready_for_pickup: { bg: '#f3e5f5', text: '#7b1fa2' },
  shipped: { bg: '#e0f2f1', text: '#00796b' },
  out_for_delivery: { bg: '#fff8e1', text: '#f57c00' },
  delivered: { bg: '#e8f5e8', text: '#2e7d32' },
  cancelled: { bg: '#ffcdd2', text: '#c62828' },
  refunded: { bg: '#ffe0b2', text: '#ef6c00' },
  failed: { bg: '#ffcdd2', text: '#c62828' },
};

const OrderStatusBadge = ({ status, style }) => {
  const config = STATUS_COLORS[status] || STATUS_COLORS.failed;
  
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});

export default OrderStatusBadge;
