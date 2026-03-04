/**
 * PaymentScreen.js - FINAL CHECKOUT STEP
 * COD + Bank Transfer + Confirm Order
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../redux/hooks';
import CustomButton from '../../components/common/CustomButton';

const PaymentScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector(state => state.auth);
  const { product, quantity, cartItems, subtotal, shipping_address, city, customer_phone , paymentMethod} = route.params || {};
  
  const [selectedPayment, setSelectedPayment] = useState(paymentMethod || 'cod');
  const [loading, setLoading] = useState(false);

  const isSingleProduct = product && !cartItems;
  const displayItems = cartItems || [{ ...product, quantity }];
  const total = subtotal || (product?.price * quantity) || 0;

  const placeOrder = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to Order Confirmation
      navigation.replace('OrderConfirmation', {
        orderId: `ORD-${Date.now().toString().slice(-6)}`,
        items: displayItems,
        total,
        paymentMethod: selectedPayment,
        shippingAddress: shipping_address,
        phone: customer_phone,
      });
    } catch (error) {
      Alert.alert('Error', 'Order placement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payment.title') || 'Payment'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {displayItems.map((item, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.title_en || item.title_ur || product?.title_en || 'Product'}
              </Text>
              <Text style={styles.itemPrice}>
                {quantity > 1 && `${quantity}x `}PKR {item.price?.toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>PKR {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'cod' && styles.paymentOptionActive
            ]}
            onPress={() => setSelectedPayment('cod')}
          >
            <Ionicons name={selectedPayment === 'cod' ? 'radio-button-on' : 'radio-button-off'} 
                     size={24} color="#036c5f" />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>💰 Cash on Delivery</Text>
              <Text style={styles.paymentDesc}>Pay when you receive your order</Text>
            </View>
          </TouchableOpacity>

          {/* Bank Transfer */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'bank_transfer' && styles.paymentOptionActive
            ]}
            onPress={() => setSelectedPayment('bank_transfer')}
          >
            <Ionicons name={selectedPayment === 'bank_transfer' ? 'radio-button-on' : 'radio-button-off'} 
                     size={24} color="#036c5f" />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>🏦 Bank Transfer</Text>
              <Text style={styles.paymentDesc}>HBL Account: 1234-5678-9012</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirm Order Button */}
      <View style={styles.bottomBar}>
        <CustomButton
          title={loading ? 'Processing...' : `Confirm Order - PKR ${total.toLocaleString()}`}
          onPress={placeOrder}
          disabled={loading}
          style={styles.confirmButton}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#036c5f',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#036c5f',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentOptionActive: {
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    margin: 4,
    padding: 8,
  },
  paymentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  paymentDesc: {
    fontSize: 14,
    color: '#666',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#036c5f',
  },
});

export default PaymentScreen;
