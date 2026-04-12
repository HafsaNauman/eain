import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const StockIndicator = ({ stockQuantity, reservedQuantity = 0, trackInventory, style }) => {
  const { t } = useTranslation();

  if (!trackInventory || stockQuantity == null) {
    return (
      <View style={[styles.badge, styles.infiniteBadge, style]}>
        <Text style={[styles.text, styles.infiniteText]}>
          {t('stockBadge.unlimited', 'Unlimited')}
        </Text>
      </View>
    );
  }

  const available = Math.max(0, stockQuantity - reservedQuantity);
  const threshold = 5;

  let badgeStyle = styles.availableBadge;
  let textStyle = styles.availableText;
  let label = `${available} available`;

  if (available === 0) {
    badgeStyle = styles.outOfStockBadge;
    textStyle = styles.outOfStockText;
    label = 'Out of stock';
  } else if (available < threshold) {
    badgeStyle = styles.lowStockBadge;
    textStyle = styles.lowStockText;
    label = `${available} left`;
  }

  return (
    <View style={[styles.badge, badgeStyle, style]}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },

  infiniteBadge: { backgroundColor: '#e0f7fa' },
  infiniteText: { color: '#036c5f' },

  availableBadge: { backgroundColor: '#e0f7fa' },
  availableText: { color: '#036c5f' },

  lowStockBadge: { backgroundColor: '#fff3e0' },
  lowStockText: { color: '#ff9800' },

  outOfStockBadge: { backgroundColor: '#ffcdd2' },
  outOfStockText: { color: '#c62828' },
});

export default StockIndicator;