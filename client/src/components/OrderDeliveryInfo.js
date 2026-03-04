// src/components/OrderDeliveryInfo.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const OrderDeliveryInfo = ({ order }) => {
  const { t } = useTranslation();

  if (!order) return null;

  const { courier_name, tracking_number, estimated_delivery_date } = order;

  // Skip rendering if no tracking
  if (!courier_name && !tracking_number) return null;

  const handleTrackPress = () => {
    if (!tracking_number) return;
    // Later, replace with TCS/Leopards/Trax URL
    const url = `https://track.example.com/${tracking_number}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('orderDelivery.tracking')}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.labelText}>{t('orderDelivery.courier')}:</Text>
        <Text style={styles.valueText}>
          {courier_name || t('orderDelivery.notAssigned')}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.labelText}>{t('orderDelivery.trackingNumber')}:</Text>
        <TouchableOpacity onPress={handleTrackPress}>
          <Text style={styles.linkText}>{tracking_number || '—'}</Text>
        </TouchableOpacity>
      </View>
      {estimated_delivery_date && (
        <View style={styles.infoRow}>
          <Text style={styles.labelText}>{t('orderDelivery.estimatedDelivery')}:</Text>
          <Text style={styles.valueText}>
            {new Date(estimated_delivery_date).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginRight: 8,
    minWidth: 100,
  },
  valueText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  linkText: {
    fontSize: 14,
    color: '#036c5f',
    textDecorationLine: 'underline',
  },
});

export default OrderDeliveryInfo;
