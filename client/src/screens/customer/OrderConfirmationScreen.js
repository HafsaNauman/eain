/**
 * Order Confirmation Screen - SUCCESS SCREEN
 * Shows after PaymentScreen → Creates order → Shows success
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import CustomButton from '../../components/common/CustomButton';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { 
    product, 
    quantity, 
    subtotal, 
    shipping_address, 
    city, 
    customer_phone,
    paymentMethod 
  } = route.params || {};
  
  // Generate order ID
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  
  const handleViewOrders = () => {
    navigation.navigate('MyOrders');
  };
  
  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const productTitle = product && (
    (i18n.language === 'ur' && product.title_ur) 
      ? product.title_ur 
      : product.title_en
  );
  const imageUrl = product?.media?.[0]?.image_url || 'https://via.placeholder.com/120?text=Product';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#4ade80" />
          </View>
          <Text style={styles.successTitle}>{t('orderConfirmation.success')}</Text>
          <Text style={styles.successSubtitle}>
            {t('orderConfirmation.orderPlaced')}
          </Text>
        </View>

        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <Text style={styles.orderId}>
            Order #{orderId}
          </Text>
          
          {/* Product Summary */}
          <View style={styles.productRow}>
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {productTitle}
              </Text>
              <Text style={styles.quantityText}>
                Qty: {quantity}
              </Text>
              <Text style={styles.priceText}>
                PKR {subtotal.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Delivery Info */}
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryTitle}>📦 Delivery Details</Text>
            <Text style={styles.infoText}>📱 {customer_phone}</Text>
            <Text style={styles.infoText}>📍 {shipping_address}</Text>
            <Text style={styles.infoText}>🏙️ {city}</Text>
            <Text style={styles.infoText}>💳 {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}</Text>
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>PKR {subtotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What’s next?</Text>
          <Text style={styles.nextStepsText}>
            Your order has been received and is being processed.
          </Text>
          <Text style={styles.nextStepsText}>
            You will receive order updates via SMS/WhatsApp.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        <CustomButton
          title={t('orderConfirmation.viewOrders')}
          onPress={handleViewOrders}
          style={styles.secondaryButton}
        />
        <CustomButton
          title={t('orderConfirmation.continueShopping')}
          onPress={handleContinueShopping}
          style={styles.primaryButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#036c5f',
    marginBottom: 20,
    textAlign: 'center',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#036c5f',
  },
  deliveryInfo: {
    marginBottom: 20,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#036c5f',
  },
  nextSteps: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  nextStepsText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#f5f5f5',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#036c5f',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
});

export default OrderConfirmationScreen;
