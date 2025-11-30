/**
 * Checkout Screen
 * Customer fills order details and confirms purchase
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { placeOrder } from '../../api/orderService';
import CustomButton from '../../components/common/CustomButton';
import ErrorAlert from '../../components/common/ErrorAlert';

const CheckoutScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const { i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';

    // Form State
    const [quantity, setQuantity] = useState(1);
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [phone, setPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

    const validateForm = () => {
        const newErrors = {};

        if (!address.trim()) {
            newErrors.address = 'Shipping address is required';
        }

        if (!city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^(\+92|92|0)?3[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid Pakistani phone number';
        }

        if (quantity < 1) {
            newErrors.quantity = 'Quantity must be at least 1';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePlaceOrder = async () => {
        setError('');

        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fill all required fields correctly');
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                listing_id: product.listing_id,
                quantity: parseInt(quantity),
                payment_method: paymentMethod,
                shipping_address: address.trim(),
                city: city.trim(),
                area: area.trim() || undefined,
                customer_phone: phone.trim(),
            };

            console.log('📦 Placing order:', orderData);

            const result = await placeOrder(orderData);

            if (result.success) {
                Alert.alert(
                    'Order Placed Successfully! 🎉',
                    `Your order #${result.data.order.order_id} has been placed. The vendor will contact you soon.`,
                    [
                        {
                            text: 'View Orders',
                            onPress: () => navigation.navigate('MyOrders'),
                        },
                        {
                            text: 'Continue Shopping',
                            onPress: () => navigation.navigate('Home'),
                        },
                    ]
                );
            } else {
                setError(result.error);
                Alert.alert('Order Failed', result.error);
            }
        } catch (err) {
            console.error('❌ Place Order Error:', err);
            setError('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const incrementQuantity = () => setQuantity(quantity + 1);
    const decrementQuantity = () => setQuantity(Math.max(1, quantity - 1));

    const totalAmount = (product.price * quantity).toFixed(2);
    const title = isUrdu && product.title_ur ? product.title_ur : product.title_en;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                    {/* Error Alert */}
                    {error ? <ErrorAlert message={error} onDismiss={() => setError('')} /> : null}

                    {/* Order Summary */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                        <View style={styles.productSummary}>
                            <Text style={styles.productTitle} numberOfLines={2}>
                                {title}
                            </Text>
                            <Text style={styles.productPrice}>
                                {product.currency} {product.price.toLocaleString()} × {quantity}
                            </Text>
                        </View>
                    </View>

                    {/* Quantity Selector */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Quantity *</Text>
                        <View style={styles.quantitySelector}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={decrementQuantity}
                                disabled={quantity <= 1}
                            >
                                <Ionicons name="remove" size={20} color={quantity <= 1 ? '#ccc' : '#036c5f'} />
                            </TouchableOpacity>

                            <Text style={styles.quantityText}>{quantity}</Text>

                            <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
                                <Ionicons name="add" size={20} color="#036c5f" />
                            </TouchableOpacity>
                        </View>
                        {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
                    </View>

                    {/* Shipping Address */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Shipping Address *</Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput, errors.address && styles.inputError]}
                            placeholder="Enter your complete address"
                            placeholderTextColor="#999"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            numberOfLines={3}
                        />
                        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                    </View>

                    {/* City */}
                    <View style={styles.section}>
                        <Text style={styles.label}>City *</Text>
                        <View style={[styles.pickerWrapper, errors.city && styles.inputError]}>
                            <Picker
                                selectedValue={city}
                                onValueChange={(value) => setCity(value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select City" value="" />
                                {cities.map((c) => (
                                    <Picker.Item key={c} label={c} value={c} />
                                ))}
                            </Picker>
                        </View>
                        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                    </View>

                    {/* Area */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Area (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., DHA, Gulshan, Johar Town"
                            placeholderTextColor="#999"
                            value={area}
                            onChangeText={setArea}
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <TextInput
                            style={[styles.input, errors.phone && styles.inputError]}
                            placeholder="+92 300 1234567"
                            placeholderTextColor="#999"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                    </View>

                    {/* Payment Method */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Payment Method *</Text>

                        <TouchableOpacity
                            style={[styles.radioOption, paymentMethod === 'cod' && styles.radioOptionSelected]}
                            onPress={() => setPaymentMethod('cod')}
                        >
                            <View style={styles.radioCircle}>
                                {paymentMethod === 'cod' && <View style={styles.radioCircleFilled} />}
                            </View>
                            <View style={styles.radioContent}>
                                <Ionicons name="cash-outline" size={24} color="#036c5f" />
                                <View style={styles.radioText}>
                                    <Text style={styles.radioTitle}>Cash on Delivery</Text>
                                    <Text style={styles.radioSubtitle}>Pay when you receive the product</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.radioOption,
                                paymentMethod === 'bank_transfer' && styles.radioOptionSelected,
                            ]}
                            onPress={() => setPaymentMethod('bank_transfer')}
                        >
                            <View style={styles.radioCircle}>
                                {paymentMethod === 'bank_transfer' && <View style={styles.radioCircleFilled} />}
                            </View>
                            <View style={styles.radioContent}>
                                <Ionicons name="card-outline" size={24} color="#036c5f" />
                                <View style={styles.radioText}>
                                    <Text style={styles.radioTitle}>Bank Transfer</Text>
                                    <Text style={styles.radioSubtitle}>Vendor will share account details</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Order Total */}
                    <View style={styles.totalCard}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>
                                {product.currency} {totalAmount}
                            </Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Quantity</Text>
                            <Text style={styles.totalValue}>{quantity}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.grandTotalLabel}>Total Amount</Text>
                            <Text style={styles.grandTotalValue}>
                                {product.currency} {totalAmount}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom CTA */}
                <View style={styles.bottomBar}>
                    <CustomButton
                        title={loading ? 'Placing Order...' : 'Place Order'}
                        onPress={handlePlaceOrder}
                        disabled={loading}
                        style={styles.placeOrderButton}
                    />
                </View>
            </KeyboardAvoidingView>
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
    scrollArea: {
        flex: 1,
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    productSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productTitle: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        marginRight: 12,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#036c5f',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1a1a1a',
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#ff6b6b',
    },
    errorText: {
        fontSize: 12,
        color: '#ff6b6b',
        marginTop: 4,
    },
    pickerWrapper: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    quantityButton: {
        padding: 8,
    },
    quantityText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        padding: 16,
        marginBottom: 12,
    },
    radioOptionSelected: {
        borderColor: '#036c5f',
        backgroundColor: '#f0f9f8',
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#036c5f',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    radioCircleFilled: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#036c5f',
    },
    radioContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioText: {
        marginLeft: 12,
        flex: 1,
    },
    radioTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    radioSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    totalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
    },
    totalValue: {
        fontSize: 14,
        color: '#1a1a1a',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 12,
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#036c5f',
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    placeOrderButton: {
        backgroundColor: '#036c5f',
    },
});

export default CheckoutScreen;
