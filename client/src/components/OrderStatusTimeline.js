// src/components/OrderStatusTimeline.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// Order status steps (from your backend)
const STATUS_STEPS = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_pickup',
  'shipped',
  'out_for_delivery',
  'delivered',
];
const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_for_pickup: 'Ready for Pickup',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

const OrderStatusTimeline = ({ status }) => {
  const { t } = useTranslation();

  const currentIndex = STATUS_STEPS.indexOf(status);
  const isActive = (step) => STATUS_STEPS.indexOf(step) <= currentIndex;

  return (
    <View style={styles.timelineContainer}>
      {STATUS_STEPS.map((step, index) => (
        <React.Fragment key={step}>
          <TouchableOpacity
            style={[
              styles.item,
              isActive(step) && styles.completedItem,
              !isActive(step) && styles.inactiveItem,
            ]}
            disabled={true} // non‑interactive
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dot,
                isActive(step) && styles.completedDot,
                !isActive(step) && styles.inactiveDot,
              ]}
            />
            <Text
              style={[
                styles.label,
                isActive(step) && styles.completedLabel,
                !isActive(step) && styles.inactiveLabel,
              ]}
            >
              {t(`orderStatus.${step}`, STATUS_LABELS[step])}
            </Text>
          </TouchableOpacity>
          {index < STATUS_STEPS.length - 1 && (
            <View
              style={[
                styles.line,
                isActive(step) && styles.completedLine,
                !isActive(step) && styles.inactiveLine,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexWrap: 'wrap',
  },
  item: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  completedItem: {
    opacity: 1,
  },
  inactiveItem: {
    opacity: 0.5,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  completedDot: {
    backgroundColor: '#036c5f',
    borderColor: '#036c5f',
  },
  inactiveDot: {
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  completedLabel: {
    color: '#036c5f',
    fontWeight: '600',
  },
  inactiveLabel: {
    color: '#999',
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 12,
    top: 12,
  },
  completedLine: {
    backgroundColor: '#036c5f',
  },
  inactiveLine: {
    backgroundColor: '#e0e0e0',
  },
});

export default OrderStatusTimeline;
