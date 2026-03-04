// src/components/StockBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const StockBadge = ({ stockQuantity, reservedQuantity, trackInventory, style }) => {
  const { t } = useTranslation();

  if (!trackInventory || stockQuantity == null) {
    return (
      <View style={[styles.badge, styles.infiniteBadge, style]}>
        <Text style={[styles.badgeText, styles.infiniteText]}>
          {t('stockBadge.unlimited', 'Unlimited')}
        </Text>
      </View>
    );
  }

  const available = Math.max(0, stockQuantity - reservedQuantity);
  const threshold = 5; // your low_stock_threshold default

  let badgeStyle;
  let textStyle;
  let textKey = '';

  if (available === 0) {
    badgeStyle = styles.outOfStockBadge;
    textStyle = styles.outOfStockText;
    textKey = 'stockBadge.outOfStock';
  } else if (available < threshold) {
    badgeStyle = styles.lowStockBadge;
    textStyle = styles.lowStockText;
    textKey = 'stockBadge.lowStock';
  } else {
    badgeStyle = styles.availableBadge;
    textStyle = styles.availableText;
    textKey = 'stockBadge.available';
  }

  return (
    <View style={[styles.badge, badgeStyle, style]}>
      <Text style={[styles.badgeText, textStyle]}>
        {t(textKey, { count: available })}
      </Text>
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
  infiniteBadge: {
    backgroundColor: '#e0f7fa',
  },
  infiniteText: {
    color: '#036c5f',
    fontSize: 11,
  },
  availableBadge: {
    backgroundColor: '#e0f7fa',
  },
  availableText: {
    color: '#036c5f',
    fontSize: 11,
  },
  lowStockBadge: {
    backgroundColor: '#fff3e0',
  },
  lowStockText: {
    color: '#ff9800',
    fontSize: 11,
  },
  outOfStockBadge: {
    backgroundColor: '#ffcdd2',
  },
  outOfStockText: {
    color: '#c62828',
    fontSize: 11,
  },
  badgeText: {
    fontWeight: '600',
  },
});

export default StockBadge;
