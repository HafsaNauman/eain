/**
 * My Orders Screen
 * Shows customer's order history with status
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getMyOrders } from '../../api/orderService';

const MyOrdersScreen = ({ navigation }) => {
    const { i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyOrders();
    }, []);

    const fetchMyOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError('');

            const result = await getMyOrders();

            if (result.success) {
                setOrders(result.data.orders);
                console.log(`✅ Loaded ${result.data.orders.length} orders`);
            } else {
                setError(result.error);
                if (!isRefresh) {
                    Alert.alert('Error', result.error);
                }
            }
        } catch (err) {
            console.error('❌ Fetch Orders Error:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchMyOrders(true);
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

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'time-outline';
            case 'confirmed':
                return 'checkmark-circle-outline';
            case 'completed':
                return 'checkmark-done-circle-outline';
            case 'cancelled':
                return 'close-circle-outline';
            default:
                return 'help-circle-outline';
        }
    };

    const renderOrderCard = ({ item: order }) => {
        const statusColor = getStatusColor(order.status);
        const statusIcon = getStatusIcon(order.status);
        const title = isUrdu && order.listing?.title_ur
            ? order.listing.title_ur
            : order.listing?.title_en || 'Product';
        const vendorName = isUrdu && order.vendor?.business_name_ur
            ? order.vendor.business_name_ur
            : order.vendor?.business_name_en || 'Vendor';

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', { orderId: order.order_id })}
                activeOpacity={0.7}
            >
                {/* Order Header */}
                <View style={styles.orderHeader}>
                    <View style={styles.orderIdRow}>
                        <Ionicons name="receipt-outline" size={16} color="#666" />
                        <Text style={styles.orderId}>Order #{order.order_id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Ionicons name={statusIcon} size={14} color="#fff" />
                        <Text style={styles.statusText}>
                            {order.status?.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Order Content */}
                <View style={styles.orderContent}>
                    <Image
                        source={{
                            uri: order.listing?.media?.images?.[0] || 'https://via.placeholder.com/80',
                        }}
                        style={styles.thumbnail}
                    />
                    <View style={styles.orderInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                            {title}
                        </Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="cube-outline" size={14} color="#666" />
                            <Text style={styles.infoText}>Qty: {order.quantity}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="storefront-outline" size={14} color="#666" />
                            <Text style={styles.infoText} numberOfLines={1}>
                                {vendorName}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="card-outline" size={14} color="#666" />
                            <Text style={styles.infoText}>
                                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Footer */}
                <View style={styles.orderFooter}>
                    <View style={styles.footerLeft}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amount}>
                            PKR {order.total_amount?.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.footerRight}>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={12} color="#999" />
                            <Text style={styles.date}>
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* View Details Arrow */}
                <View style={styles.viewDetailsRow}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#036c5f" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
                Start shopping to see your orders here
            </Text>
            <TouchableOpacity
                style={styles.shopButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#036c5f" />
                <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orders</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh" size={24} color="#036c5f" />
                </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && !loading && (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchMyOrders()}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Orders List */}
            <FlatList
                data={orders}
                renderItem={renderOrderCard}
                keyExtractor={(item) => `order-${item.order_id}`}
                contentContainerStyle={[
                    styles.listContent,
                    orders.length === 0 && styles.emptyListContent,
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#036c5f']}
                    />
                }
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
            />
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 8,
    },
    errorText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#c62828',
    },
    retryText: {
        fontSize: 14,
        color: '#036c5f',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    emptyListContent: {
        flex: 1,
    },
    orderCard: {
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
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginLeft: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 4,
    },
    orderContent: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    orderInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    productTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
        flex: 1,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    footerLeft: {
        flex: 1,
    },
    amountLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#036c5f',
    },
    footerRight: {
        alignItems: 'flex-end',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        fontSize: 12,
        color: '#999',
        marginLeft: 4,
    },
    viewDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    viewDetailsText: {
        fontSize: 14,
        color: '#036c5f',
        fontWeight: '600',
        marginRight: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    shopButton: {
        backgroundColor: '#036c5f',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 24,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MyOrdersScreen;
