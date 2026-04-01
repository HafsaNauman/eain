/**
 * CartScreen.js - STOCK VALIDATION + OOS PROTECTION
 * Blocks checkout if ANY item out of stock
 * Auto-removes sold-out items
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import {
  selectCartItems,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from '../../redux/slices/cartSlice';
import StockIndicator from '../../components/StockIndicator';
import CustomButton from '../../components/common/CustomButton';
import { validateCartStock, getListingDetails } from '../../api/cartService';

const { width } = Dimensions.get('window');
const TEAL = '#036c5f';

const CartScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Redux cart state
  const cartItems = useAppSelector(selectCartItems);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [stockIssues, setStockIssues] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // ✅ STOCK: Validate cart on focus + interval
  useEffect(() => {
    validateCart();
    const interval = setInterval(validateCart, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [cartItems]);

  // Calculate totals
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    setTotalAmount(total);
  }, [cartItems]);

  // ✅ STOCK: Check each item's stock
  const validateCart = async () => {
    if (cartItems.length === 0) return;

    setValidating(true);
    try {
      const issues = [];
      
      for (const item of cartItems) {
        const result = await getListingDetails(item.listing_id);
        if (result.success) {
          const available = result.data.track_inventory 
            ? Math.max(0, (result.data.stock_quantity || 0) - (result.data.reserved_quantity || 0))
            : null;
          
          if (available !== null && available < item.quantity) {
            issues.push({
              ...item,
              available,
              message: `Only ${available} available (need ${item.quantity})`
            });
          }
        }
      }
      
      setStockIssues(issues);
      
      // Auto-remove completely OOS items
      if (issues.length > 0) {
        Alert.alert(
          'Stock Issues Detected',
          `${issues.length} item(s) have stock problems. They've been updated/removed.`,
          [{ text: 'OK' }]
        );
        
        // Remove OOS items
        issues.forEach(issue => {
          if (issue.available === 0) {
            dispatch(removeFromCart(issue.listing_id));
          } else {
            dispatch(updateCartQuantity({
              listing_id: issue.listing_id,
              quantity: issue.available
            }));
          }
        });
      }
    } catch (err) {
      console.error('Cart validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleQuantityChange = (listingId, newQuantity) => {
    if (newQuantity < 1) {
      dispatch(removeFromCart(listingId));
      return;
    }
    dispatch(updateCartQuantity({ listing_id: listingId, quantity: newQuantity }));
  };

  const handleRemoveItem = (listingId) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from cart?',
      [
        { text: 'Cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => dispatch(removeFromCart(listingId))
        }
      ]
    );
  };

  const handleCheckout = async () => {
    if (stockIssues.length > 0) {
      Alert.alert(
        'Cannot Checkout',
        'Some items have stock issues. Please review your cart.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      // Final stock validation before checkout
      const validation = await validateCartStock(cartItems);
      if (!validation.valid) {
        Alert.alert(
          'Stock Changed',
          validation.message,
          [{ text: 'OK' }]
        );
        validateCart(); // Refresh cart
        return;
      }

      // Line 162 - SINGLE PRODUCT CHECKOUT
if (cartItems.length > 0) {
  navigation.navigate('Checkout', { 
    product: cartItems[0],  // First item only
    quantity: cartItems[0].quantity 
  });
}

    } catch (err) {
      Alert.alert('Error', 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => {
    const hasStockIssue = stockIssues.find(issue => issue.listing_id === item.listing_id);
    
    return (
      <View style={[
        styles.cartItem,
        hasStockIssue && styles.stockIssueItem
      ]}>
        {/* Product Image */}
        <Image 
          source={{ uri: item.image_url || 'https://via.placeholder.com/80' }} 
          style={styles.itemImage}
        />

        {/* Product Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.title_en}</Text>
          <Text style={styles.itemPrice}>
            PKR {item.price?.toLocaleString()} x {item.quantity}
          </Text>
          <Text style={styles.itemTotal}>
            Total: PKR {(item.price * item.quantity).toLocaleString()}
          </Text>
        </View>

        {/* Stock Indicator */}
        {item.track_inventory && (
          <StockIndicator
            stockQuantity={item.stock_quantity}
            reservedQuantity={item.reserved_quantity}
            trackInventory={true}
            style={styles.stockIndicator}
          />
        )}

        {/* Quantity Controls */}
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[
              styles.qtyButton,
              item.quantity <= 1 && styles.qtyButtonDisabled
            ]}
            onPress={() => handleQuantityChange(item.listing_id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Ionicons name="remove" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <TouchableOpacity
            style={[
              styles.qtyButton,
              hasStockIssue && styles.qtyButtonDisabled
            ]}
            onPress={() => handleQuantityChange(item.listing_id, item.quantity + 1)}
            disabled={hasStockIssue}
          >
            <Ionicons name="add" size={18} color={hasStockIssue ? '#ccc' : '#036c5f'} />
          </TouchableOpacity>
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.listing_id)}
        >
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={100} color="#ccc" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add products from the store to get started
        </Text>
        <TouchableOpacity 
          style={styles.shopButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Cart ({cartItems.length} items)
        </Text>
        <TouchableOpacity onPress={() => dispatch(clearCart())}>
  <Text style={styles.clearText}>Clear All</Text>
</TouchableOpacity>
      </View>

      {/* Stock Warning Banner */}
      {stockIssues.length > 0 && (
        <View style={styles.stockWarning}>
          <Ionicons name="alert-circle" size={20} color="#F59E0B" />
          <Text style={styles.stockWarningText}>
            ⚠️ {stockIssues.length} item(s) have stock issues
          </Text>
        </View>
      )}

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.listing_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Total & Checkout */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total ({cartItems.length} items):</Text>
          <Text style={styles.totalAmount}>
            PKR {totalAmount.toLocaleString()}
          </Text>
        </View>

        <CustomButton
          title={
            validating || stockIssues.length > 0
              ? 'Checking Stock...'
              : `Proceed to Checkout (${cartItems.length} items)`
          }
          onPress={handleCheckout}
          disabled={loading || validating || stockIssues.length > 0 || cartItems.length === 0}
          style={[
            styles.checkoutButton,
            (stockIssues.length > 0 || validating) && styles.checkoutDisabled
          ]}
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  stockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  stockWarningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockIssueItem: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#036c5f',
  },
  stockIndicator: {
    marginRight: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#036c5f',
  },
  checkoutButton: {
    backgroundColor: '#036c5f',
  },
  checkoutDisabled: {
    backgroundColor: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#036c5f',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;
