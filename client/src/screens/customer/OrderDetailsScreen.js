/**
 * Order Details Screen
 * Shows full details of a single order
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getOrderDetails } from '../../api/orderService';

const OrderDetailsScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const { i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError('');

            const result = await getOrderDetails(orderId);

            if (result.success) {
                setOrder(result.data);
            } else {
                setError(result.error);
                Alert.alert('Error', result.error);
            }
        } catch (err) {
            console.error('❌ Fetch Order Details Error:', err);
            setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleCallVendor = () => {
        if (order?.vendor?.phone) {
            Linking.openURL(`tel:${order.vendor.phone}`);
        } else {
            Alert.alert('No Contact', 'Vendor phone number not available');
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return '#FFA500';
            case 'confirmed':
                return '#4CAF50';
            case 'completed':
                return '#2196F3';
            case 'cancelled':
                return '#F44336';
            default:
                return '#999';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#036c5f" />
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
                <Text style={styles.errorText}>{error || 'Order not found'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusColor = getStatusColor(order.status);
    const title = isUrdu && order.listing?.title_ur
        ? order.listing.title_ur
        : order.listing?.title_en || 'Product';
    const vendorName = isUrdu && order.vendor?.business_name_ur
        ? order.vendor.business_name_ur
        : order.vendor?.business_name_en || 'Vendor';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {/* Order Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <Text style={styles.orderIdText}>Order #{order.order_id}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                            <Text style={styles.statusText}>{order.status?.toUpperCase()}</Text>
                        </View>
                    </View>
                    <Text style={styles.orderDate}>
                        Placed on {new Date(order.created_at).toLocaleString('en-US', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                        })}
                    </Text>
                </View>

                {/* Product Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Product Details</Text>
                    <View style={styles.productCard}>
                        <Image
                            source={{
                                uri: order.listing?.media?.images?.[0] || 'https://via.placeholder.com/100',
                            }}
                            style={styles.productImage}
                        />
                        <View style={styles.productInfo}>
                            <Text style={styles.productTitle}>{title}</Text>
                            <Text style={styles.productPrice}>
                                PKR {order.listing?.price?.toLocaleString()}
                            </Text>
                            <Text style={styles.productQuantity}>Quantity: {order.quantity}</Text>
                        </View>
                    </View>
                </View>

                {/* Delivery Address */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    <View style={styles.addressCard}>
                        <View style={styles.addressRow}>
                            <Ionicons name="location" size={20} color="#036c5f" />
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressText}>{order.shipping_address}</Text>
                                <Text style={styles.addressCity}>
                                    {order.area ? `${order.area}, ` : ''}{order.city}
                                </Text>
                            </View>
                        </View>
                        {order.customer_phone && (
                            <View style={styles.addressRow}>
                                <Ionicons name="call" size={20} color="#036c5f" />
                                <Text style={styles.phoneText}>{order.customer_phone}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Vendor Info */}
                {order.vendor && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vendor Information</Text>
                        <View style={styles.vendorCard}>
                            <View style={styles.vendorHeader}>
                                <Ionicons name="storefront" size={24} color="#036c5f" />
                                <Text style={styles.vendorName}>{vendorName}</Text>
                            </View>
                            {order.vendor.city && (
                                <Text style={styles.vendorLocation}>
                                    {order.vendor.city}{order.vendor.area ? `, ${order.vendor.area}` : ''}
                                </Text>
                            )}
                            {order.vendor.phone && (
                                <TouchableOpacity style={styles.callButton} onPress={handleCallVendor}>
                                    <Ionicons name="call" size={16} color="#fff" />
                                    <Text style={styles.callButtonText}>Call Vendor</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Payment Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Payment Method</Text>
                            <Text style={styles.paymentValue}>
                                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Subtotal</Text>
                            <Text style={styles.paymentValue}>
                                PKR {(order.listing?.price * order.quantity).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>
                                PKR {order.total_amount?.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#036c5f',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
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
    headerButton: {
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
    statusCard: {
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
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderIdText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    orderDate: {
        fontSize: 13,
        color: '#666',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        justifyContent: 'center',
    },
    productTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 6,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#036c5f',
        marginBottom: 4,
    },
    productQuantity: {
        fontSize: 13,
        color: '#666',
    },
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addressRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    addressInfo: {
        flex: 1,
        marginLeft: 12,
    },
    addressText: {
        fontSize: 14,
        color: '#1a1a1a',
        marginBottom: 4,
    },
    addressCity: {
        fontSize: 13,
        color: '#666',
    },
    phoneText: {
        fontSize: 14,
        color: '#1a1a1a',
        marginLeft: 12,
    },
    vendorCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    vendorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    vendorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginLeft: 12,
    },
    vendorLocation: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#036c5f',
        paddingVertical: 10,
        borderRadius: 8,
    },
    callButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#666',
    },
    paymentValue: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 12,
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
});

export default OrderDetailsScreen;
