/**
 * Checkout Screen
 * Handle order placement with delivery info
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
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { placeOrder } from '../../api/orderService';
import CustomButton from '../../components/common/CustomButton';

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

const CheckoutScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const { i18n, t } = useTranslation();
    const isUrdu = i18n.language === 'ur';

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        shippingAddress: '',
        city: '',
        paymentMethod: 'cod',
        quantity: 1,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const deliveryCharges = 200;
    const subtotal = product.price * formData.quantity;
    const total = subtotal + deliveryCharges;

    const validateForm = () => {
        const newErrors = {};

        if (!formData.customerName.trim()) {
            newErrors.customerName = t('checkout.errors.nameRequired');
        }

        if (!formData.customerPhone.trim()) {
            newErrors.customerPhone = t('checkout.errors.phoneRequired');
        }

        if (!formData.shippingAddress.trim()) {
            newErrors.shippingAddress = t('checkout.errors.addressRequired');
        }

        if (!formData.city) {
            newErrors.city = t('checkout.errors.cityRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePlaceOrder = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                listing_id: product.listing_id,
                vendor_id: product.vendor_id,
                quantity: formData.quantity,
                customer_name: formData.customerName,
                customer_phone: formData.customerPhone,
                shipping_address: formData.shippingAddress,
                city: formData.city,
                payment_method: formData.paymentMethod,
                total_amount: total,
            };

            const result = await placeOrder(orderData);

            if (result.success) {
                Alert.alert(
                    t('checkout.orderPlaced'),
                    t('checkout.orderSuccess'),
                    [
                        {
                            text: t('checkout.viewOrders'),
                            onPress: () => navigation.navigate('MyOrders'),
                        },
                        {
                            text: t('checkout.continueShopping'),
                            onPress: () => navigation.navigate('Home'),
                        },
                    ]
                );
            } else {
                Alert.alert(t('common.error'), result.error || t('checkout.errors.orderFailed'));
            }
        } catch (err) {
            console.error('❌ Place Order Error:', err);
            Alert.alert(t('common.error'), t('checkout.errors.orderFailed'));
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const productTitle = isUrdu && product.title_ur ? product.title_ur : product.title_en;
    const imageUrl = product.media?.[0]?.image_url || 'https://via.placeholder.com/80?text=No+Image';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Product Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('checkout.productSummary')}</Text>
                    <View style={styles.productCard}>
                        <Image source={{ uri: imageUrl }} style={styles.productImage} />
                        <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={2}>
                                {productTitle}
                            </Text>
                            <Text style={styles.productPrice}>
                                {product.currency} {product.price?.toLocaleString()}
                            </Text>
                            <View style={styles.quantityRow}>
                                <Text style={styles.quantityLabel}>{t('checkout.quantity')}:</Text>
                                <View style={styles.quantityControls}>
                                    <TouchableOpacity
                                        onPress={() => formData.quantity > 1 && updateField('quantity', formData.quantity - 1)}
                                        style={styles.quantityButton}
                                    >
                                        <Ionicons name="remove" size={20} color="#036c5f" />
                                    </TouchableOpacity>
                                    <Text style={styles.quantityValue}>{formData.quantity}</Text>
                                    <TouchableOpacity
                                        onPress={() => updateField('quantity', formData.quantity + 1)}
                                        style={styles.quantityButton}
                                    >
                                        <Ionicons name="add" size={20} color="#036c5f" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Delivery Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('checkout.deliveryInfo')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('checkout.fullName')}</Text>
                        <TextInput
                            style={[styles.input, errors.customerName && styles.inputError]}
                            placeholder={t('checkout.fullNamePlaceholder')}
                            value={formData.customerName}
                            onChangeText={(value) => updateField('customerName', value)}
                        />
                        {errors.customerName && (
                            <Text style={styles.errorText}>{errors.customerName}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('checkout.phoneNumber')}</Text>
                        <TextInput
                            style={[styles.input, errors.customerPhone && styles.inputError]}
                            placeholder={t('checkout.phoneNumberPlaceholder')}
                            value={formData.customerPhone}
                            onChangeText={(value) => updateField('customerPhone', value)}
                            keyboardType="phone-pad"
                        />
                        {errors.customerPhone && (
                            <Text style={styles.errorText}>{errors.customerPhone}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('checkout.shippingAddress')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, errors.shippingAddress && styles.inputError]}
                            placeholder={t('checkout.shippingAddressPlaceholder')}
                            value={formData.shippingAddress}
                            onChangeText={(value) => updateField('shippingAddress', value)}
                            multiline
                            numberOfLines={3}
                        />
                        {errors.shippingAddress && (
                            <Text style={styles.errorText}>{errors.shippingAddress}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('checkout.city')}</Text>
                        <View style={[styles.pickerWrapper, errors.city && styles.inputError]}>
                            <Picker
                                selectedValue={formData.city}
                                onValueChange={(value) => updateField('city', value)}
                                style={styles.picker}
                            >
                                <Picker.Item label={t('checkout.cityPlaceholder')} value="" />
                                {cities.map(city => (
                                    <Picker.Item key={city} label={city} value={city} />
                                ))}
                            </Picker>
                        </View>
                        {errors.city && (
                            <Text style={styles.errorText}>{errors.city}</Text>
                        )}
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('checkout.paymentMethod')}</Text>
                    <TouchableOpacity
                        style={[
                            styles.paymentOption,
                            formData.paymentMethod === 'cod' && styles.paymentOptionActive,
                        ]}
                        onPress={() => updateField('paymentMethod', 'cod')}
                    >
                        <Ionicons
                            name={formData.paymentMethod === 'cod' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color="#036c5f"
                        />
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentTitle}>{t('checkout.cashOnDelivery')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.paymentOption,
                            formData.paymentMethod === 'bank_transfer' && styles.paymentOptionActive,
                        ]}
                        onPress={() => updateField('paymentMethod', 'bank_transfer')}
                    >
                        <Ionicons
                            name={formData.paymentMethod === 'bank_transfer' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color="#036c5f"
                        />
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentTitle}>{t('checkout.bankTransfer')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('checkout.orderSummary')}</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('checkout.productPrice')}</Text>
                            <Text style={styles.summaryValue}>PKR {subtotal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('checkout.deliveryCharges')}</Text>
                            <Text style={styles.summaryValue}>PKR {deliveryCharges.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>{t('checkout.totalAmount')}</Text>
                            <Text style={styles.totalValue}>PKR {total.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
                <CustomButton
                    title={loading ? t('common.loading') : t('checkout.placeOrder')}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                    style={styles.placeOrderButton}
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
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#036c5f',
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityLabel: {
        fontSize: 14,
        color: '#666',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    quantityButton: {
        padding: 4,
    },
    quantityValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        paddingHorizontal: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1a1a1a',
    },
    textArea: {
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
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    paymentOptionActive: {
        borderColor: '#036c5f',
        backgroundColor: '#e0f7fa',
    },
    paymentInfo: {
        marginLeft: 12,
        flex: 1,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 12,
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    totalValue: {
        fontSize: 18,
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
