// src/components/LowStockAlert.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const LowStockAlert = ({ listings }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  if (!listings || listings.length === 0) return null;

  const low = listings.filter((listing) => {
    if (!listing.track_inventory || listing.stock_quantity == null) return false;
    const available = Math.max(0, listing.stock_quantity - listing.reserved_quantity);
    const threshold = listing.low_stock_threshold || 5;
    return available < threshold;
  });

  if (low.length === 0) return null;

  const handlePressItem = (listing) => {
    navigation.navigate('ProductDetail', {
      product: listing,
      isEditing: true,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('lowStockAlert.title', 'Low Stock')}</Text>
      <Text style={styles.subtitle}>
        {t(
          'lowStockAlert.subtitle',
          'Products with stock below threshold, please update inventory or prices.'
        )}
      </Text>
      <FlatList
        data={low}
        keyExtractor={(item) => String(item.listing_id)}
        renderItem={({ item }) => {
          const available = Math.max(0, item.stock_quantity - item.reserved_quantity);
          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handlePressItem(item)}
            >
              <Text style={styles.titleText} numberOfLines={1}>
                {item.title_en}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, styles.warningBadge]}>
                  <Text style={styles.badgeText}>
                    {t('lowStockAlert.available', 'Available')}: {available}
                  </Text>
                </View>
                <View style={[styles.badge, styles.thresholdBadge]}>
                  <Text style={styles.badgeText}>
                    {t('lowStockAlert.threshold', 'Threshold')}: {item.low_stock_threshold || 5}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  subtitle: {
    fontSize: 13,
    color: '#ff9800',
    marginTop: 4,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: '#ffcc80',
    borderBottomWidth: 1,
  },
  titleText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  warningBadge: {
    backgroundColor: '#ffe0b2',
  },
  thresholdBadge: {
    backgroundColor: '#ffee58',
  },
  badgeText: {
    fontSize: 10,
    color: '#1a1a1a',
    fontWeight: '600',
  },
});

export default LowStockAlert;
