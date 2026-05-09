// /**
//  * My Orders Screen - FULL STOCK STATUS + 24HR CANCEL
//  * Shows customer's order history with cancel button (pending only)
//  */
// import React, { useState, useEffect } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     FlatList,
//     TouchableOpacity,
//     Image,
//     ActivityIndicator,
//     RefreshControl,
//     Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useTranslation } from 'react-i18next';
// import { getMyOrders, cancelOrder } from '../../api/orderService';
// import { getFirstImage } from '../../utils/imageHelper';  // ✅ CANCEL: Import

// const MyOrdersScreen = ({ navigation }) => {
//     const { i18n, t } = useTranslation();
//     const isUrdu = i18n.language === 'ur';

//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [error, setError] = useState('');
//     const [cancellingOrderId, setCancellingOrderId] = useState(null);  // ✅ CANCEL: Loading state

//     useEffect(() => {
//         fetchMyOrders();
//     }, []);

//     const fetchMyOrders = async (isRefresh = false) => {
//         try {
//             if (isRefresh) {
//                 setRefreshing(true);
//             } else {
//                 setLoading(true);
//             }
//             setError('');

//             const result = await getMyOrders();

//             if (result.success) {
//                 setOrders(result.data.orders);
//                 console.log(`✅ Loaded ${result.data.orders.length} orders`);
//             } else {
//                 setError(result.error);
//                 if (!isRefresh) {
//                     Alert.alert(t('common.error'), result.error);
//                 }
//             }
//         } catch (err) {
//             console.error('❌ Fetch Orders Error:', err);
//             setError(t('errors.networkError'));
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     };

//     // ✅ CANCEL: Check if order is cancellable (pending + <24hrs)
//     const isCancellable = (order) => {
//         if (order.status?.toLowerCase() !== 'pending') return false;

//         const orderDate = new Date(order.created_at);
//         const now = new Date();
//         const hoursDiff = (now - orderDate) / (1000 * 60 * 60);

//         return hoursDiff < 24;  // ✅ 24hr cancel window
//     };

//     // ✅ CANCEL: Handle order cancellation
//     const handleCancelOrder = async (orderId) => {
//         Alert.alert(
//             t('myOrders.cancelOrder'),
//             t('myOrders.cancelConfirm'),
//             [
//                 { text: t('common.cancel'), style: 'cancel' },
//                 {
//                     text: t('common.confirm'),
//                     style: 'destructive',
//                     onPress: async () => {
//                         setCancellingOrderId(orderId);
//                         try {
//                             const result = await cancelOrder(orderId);
//                             if (result.success) {
//                                 Alert.alert(t('myOrders.cancelled'), t('myOrders.cancelSuccess'));
//                                 fetchMyOrders(true);  // Refresh list
//                             } else {
//                                 Alert.alert(t('common.error'), result.error);
//                             }
//                         } catch (err) {
//                             console.error('❌ Cancel Order Error:', err);
//                             Alert.alert(t('common.error'), t('myOrders.cancelError'));
//                         } finally {
//                             setCancellingOrderId(null);
//                         }
//                     },
//                 },
//             ]
//         );
//     };

//     const onRefresh = () => {
//         fetchMyOrders(true);
//     };

//     const getStatusColor = (status) => {
//         switch (status?.toLowerCase()) {
//             case 'pending':      return '#FFA500';
//             case 'confirmed':    return '#4CAF50';
//             case 'completed':    return '#2196F3';
//             case 'cancelled':    return '#F44336';
//             case 'stock_issue':  return '#FF5722';  // ✅ STOCK: New status
//             default:             return '#999';
//         }
//     };

//     const getStatusIcon = (status) => {
//         switch (status?.toLowerCase()) {
//             case 'pending':       return 'time-outline';
//             case 'confirmed':     return 'checkmark-circle-outline';
//             case 'completed':     return 'checkmark-done-circle-outline';
//             case 'cancelled':     return 'close-circle-outline';
//             case 'stock_issue':   return 'alert-circle-outline';  // ✅ STOCK: New status
//             default:              return 'help-circle-outline';
//         }
//     };

//     const renderOrderCard = ({ item: order }) => {
//         const statusColor = getStatusColor(order.status);
//         const statusIcon = getStatusIcon(order.status);
//         const title = isUrdu && order.listing?.title_ur
//             ? order.listing.title_ur
//             : order.listing?.title_en || 'Product';
//         const vendorName = isUrdu && order.vendor?.business_name_ur
//             ? order.vendor.business_name_ur
//             : order.vendor?.business_name_en || 'Vendor';

//         const imageUrl = getFirstImage(order.listing?.media, 'https://via.placeholder.com/80?text=No+Image');
//         const canCancel = isCancellable(order);  // ✅ CANCEL: Check eligibility
//         const isCancelling = cancellingOrderId === order.order_id;

//         return (
//             <TouchableOpacity
//                 style={styles.orderCard}
//                 onPress={() => navigation.navigate('OrderDetails', { orderId: order.order_id })}
//                 activeOpacity={0.7}
//                 disabled={isCancelling}  // ✅ Disable tap during cancel
//             >
//                 {/* Order Header */}
//                 <View style={styles.orderHeader}>
//                     <View style={styles.orderIdRow}>
//                         <Ionicons name="receipt-outline" size={16} color="#666" />
//                         <Text style={styles.orderId}>{t('orderDetails.orderNumber')} #{order.order_id}</Text>
//                     </View>
//                     <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
//                         <Ionicons name={statusIcon} size={14} color="#fff" />
//                         <Text style={styles.statusText}>
//                             {t(`myOrders.${order.status?.toLowerCase()}`)}
//                         </Text>
//                     </View>
//                 </View>

//                 {/* Order Content */}
//                 <View style={styles.orderContent}>
//                     <Image
//                         source={{ uri: imageUrl }}
//                         style={styles.thumbnail}
//                     />
//                     <View style={styles.orderInfo}>
//                         <Text style={styles.productTitle} numberOfLines={2}>
//                             {title}
//                         </Text>
//                         <View style={styles.infoRow}>
//                             <Ionicons name="cube-outline" size={14} color="#666" />
//                             <Text style={styles.infoText}>{t('myOrders.quantity')}: {order.quantity}</Text>
//                         </View>
//                         <View style={styles.infoRow}>
//                             <Ionicons name="storefront-outline" size={14} color="#666" />
//                             <Text style={styles.infoText} numberOfLines={1}>
//                                 {vendorName}
//                             </Text>
//                         </View>
//                         <View style={styles.infoRow}>
//                             <Ionicons name="card-outline" size={14} color="#666" />
//                             <Text style={styles.infoText}>
//                                 {order.payment_method === 'cod' ? t('myOrders.cashOnDelivery') : t('myOrders.bankTransfer')}
//                             </Text>
//                         </View>
//                     </View>
//                 </View>

//                 {/* Order Footer */}
//                 <View style={styles.orderFooter}>
//                     <View style={styles.footerLeft}>
//                         <Text style={styles.amountLabel}>{t('myOrders.totalAmount')}</Text>
//                         <Text style={styles.amount}>
//                             PKR {order.total_amount?.toLocaleString()}
//                         </Text>
//                     </View>
//                     <View style={styles.footerRight}>
//                         <View style={styles.dateRow}>
//                             <Ionicons name="calendar-outline" size={12} color="#999" />
//                             <Text style={styles.date}>
//                                 {new Date(order.created_at).toLocaleDateString('en-US', {
//                                     day: 'numeric',
//                                     month: 'short',
//                                     year: 'numeric',
//                                 })}
//                             </Text>
//                         </View>
//                     </View>
//                 </View>

//                 {/* ✅ CANCEL: Cancel Button (24hr window only) */}
//                 {canCancel && (
//                     <TouchableOpacity
//                         style={styles.cancelButton}
//                         onPress={() => handleCancelOrder(order.order_id)}
//                         disabled={isCancelling}
//                     >
//                         {isCancelling ? (
//                             <ActivityIndicator size="small" color="#fff" />
//                         ) : (
//                             <>
//                                 <Ionicons name="close-circle-outline" size={16} color="#fff" />
//                                 <Text style={styles.cancelButtonText}>Cancel Order</Text>
//                             </>
//                         )}
//                     </TouchableOpacity>
//                 )}

//                 {/* View Details Arrow */}
//                 <View style={styles.viewDetailsRow}>
//                     <Text style={styles.viewDetailsText}>{t('myOrders.viewDetails')}</Text>
//                     <Ionicons name="chevron-forward" size={16} color="#036c5f" />
//                 </View>
//             </TouchableOpacity>
//         );
//     };

//     const renderEmpty = () => (
//         <View style={styles.emptyContainer}>
//             <Ionicons name="basket-outline" size={80} color="#ccc" />
//             <Text style={styles.emptyTitle}>{t('myOrders.noOrders')}</Text>
//             <Text style={styles.emptySubtitle}>
//                 {t('myOrders.noOrdersMessage')}
//             </Text>
//             <TouchableOpacity
//                 style={styles.shopButton}
//                 onPress={() => navigation.navigate('Home')}
//             >
//                 <Text style={styles.shopButtonText}>{t('myOrders.startShopping')}</Text>
//             </TouchableOpacity>
//         </View>
//     );

//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#036c5f" />
//                 <Text style={styles.loadingText}>{t('myOrders.loadingOrders')}</Text>
//             </View>
//         );
//     }

//     return (
//         <SafeAreaView style={styles.container} edges={['top']}>
//             {/* Header */}
//             <View style={styles.header}>
//                 <Text style={styles.headerTitle}>{t('myOrders.title')}</Text>
//                 <TouchableOpacity onPress={onRefresh}>
//                     <Ionicons name="refresh" size={24} color="#036c5f" />
//                 </TouchableOpacity>
//             </View>

//             {/* Error Message */}
//             {error && !loading && (
//                 <View style={styles.errorBanner}>
//                     <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
//                     <Text style={styles.errorText}>{error}</Text>
//                     <TouchableOpacity onPress={() => fetchMyOrders()}>
//                         <Text style={styles.retryText}>{t('myOrders.retry')}</Text>
//                     </TouchableOpacity>
//                 </View>
//             )}

//             {/* Orders List */}
//             <FlatList
//                 data={orders}
//                 renderItem={renderOrderCard}
//                 keyExtractor={(item) => `order-${item.order_id}`}
//                 contentContainerStyle={[
//                     styles.listContent,
//                     orders.length === 0 && styles.emptyListContent,
//                 ]}
//                 refreshControl={
//                     <RefreshControl
//                         refreshing={refreshing}
//                         onRefresh={onRefresh}
//                         colors={['#036c5f']}
//                     />
//                 }
//                 ListEmptyComponent={renderEmpty}
//                 showsVerticalScrollIndicator={false}
//             />
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#f5f5f5',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#f5f5f5',
//     },
//     loadingText: {
//         marginTop: 12,
//         fontSize: 16,
//         color: '#666',
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 20,
//         paddingVertical: 16,
//         backgroundColor: '#fff',
//         borderBottomWidth: 1,
//         borderBottomColor: '#e0e0e0',
//     },
//     headerTitle: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         color: '#1a1a1a',
//     },
//     errorBanner: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#ffebee',
//         padding: 12,
//         marginHorizontal: 16,
//         marginTop: 12,
//         borderRadius: 8,
//     },
//     errorText: {
//         flex: 1,
//         marginLeft: 8,
//         fontSize: 14,
//         color: '#c62828',
//     },
//     retryText: {
//         fontSize: 14,
//         color: '#036c5f',
//         fontWeight: 'bold',
//     },
//     listContent: {
//         padding: 16,
//     },
//     emptyListContent: {
//         flex: 1,
//     },
//     orderCard: {
//         backgroundColor: '#fff',
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 16,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     orderHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     orderIdRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     orderId: {
//         fontSize: 14,
//         fontWeight: 'bold',
//         color: '#1a1a1a',
//         marginLeft: 6,
//     },
//     statusBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     statusText: {
//         fontSize: 11,
//         fontWeight: 'bold',
//         color: '#fff',
//         marginLeft: 4,
//     },
//     orderContent: {
//         flexDirection: 'row',
//         marginBottom: 12,
//     },
//     thumbnail: {
//         width: 80,
//         height: 80,
//         borderRadius: 8,
//         backgroundColor: '#f0f0f0',
//     },
//     orderInfo: {
//         flex: 1,
//         marginLeft: 12,
//         justifyContent: 'space-between',
//     },
//     productTitle: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: '#1a1a1a',
//         marginBottom: 6,
//     },
//     infoRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 4,
//     },
//     infoText: {
//         fontSize: 13,
//         color: '#666',
//         marginLeft: 6,
//         flex: 1,
//     },
//     orderFooter: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingTop: 12,
//         borderTopWidth: 1,
//         borderTopColor: '#f0f0f0',
//     },
//     footerLeft: {
//         flex: 1,
//     },
//     amountLabel: {
//         fontSize: 12,
//         color: '#999',
//         marginBottom: 2,
//     },
//     amount: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#036c5f',
//     },
//     footerRight: {
//         alignItems: 'flex-end',
//     },
//     dateRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     date: {
//         fontSize: 12,
//         color: '#999',
//         marginLeft: 4,
//     },
//     viewDetailsRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginTop: 12,
//         paddingTop: 12,
//         borderTopWidth: 1,
//         borderTopColor: '#f0f0f0',
//     },
//     viewDetailsText: {
//         fontSize: 14,
//         color: '#036c5f',
//         fontWeight: '600',
//         marginRight: 4,
//     },
//     emptyContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         paddingVertical: 60,
//     },
//     emptyTitle: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         color: '#666',
//         marginTop: 20,
//     },
//     emptySubtitle: {
//         fontSize: 14,
//         color: '#999',
//         marginTop: 8,
//         textAlign: 'center',
//     },
//     shopButton: {
//         backgroundColor: '#036c5f',
//         paddingHorizontal: 32,
//         paddingVertical: 12,
//         borderRadius: 24,
//         marginTop: 24,
//     },
//     shopButtonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: 'bold',
//     },
//      cancelButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: '#F44336',
//         paddingVertical: 12,
//         paddingHorizontal: 16,
//         borderRadius: 8,
//         marginTop: 12,
//         marginBottom: 8,
//     },
//     cancelButtonText: {
//         color: '#fff',
//         fontSize: 14,
//         fontWeight: '600',
//         marginLeft: 6,
//     },
// });

// export default MyOrdersScreen;
/**
 * My Orders Screen - FULL STOCK STATUS + 24HR CANCEL
 * Shows customer's order history with cancel button (pending only)
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
import { getMyOrders, cancelOrder } from '../../api/orderService';
import { getFirstImage } from '../../utils/imageHelper';
import { useAuth } from '../../context/AuthContext';

const MyOrdersScreen = ({ navigation }) => {
    const { i18n, t } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const { isAuthenticated } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [cancellingOrderId, setCancellingOrderId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            Alert.alert(
                'Login Required',
                'Please log in to view your orders.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => navigation.goBack(),
                    },
                    {
                        text: 'Log In',
                        onPress: () => navigation.navigate('Login'),
                    },
                ]
            );
            return;
        }
        fetchMyOrders();
    }, [isAuthenticated]);

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
                // If 403, show login dialog instead of error banner
                if (result.error?.toLowerCase().includes('token') ||
                    result.error?.toLowerCase().includes('unauthorized') ||
                    result.error?.toLowerCase().includes('no token')) {
                    Alert.alert(
                        'Login Required',
                        'Please log in to view your orders.',
                        [
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => navigation.goBack(),
                            },
                            {
                                text: 'Log In',
                                onPress: () => navigation.navigate('Login'),
                            },
                        ]
                    );
                } else {
                    setError(result.error);
                }
            }
        } catch (err) {
            console.error('❌ Fetch Orders Error:', err);
            setError(t('errors.networkError'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const isCancellable = (order) => {
        if (order.status?.toLowerCase() !== 'pending') return false;
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const hoursDiff = (now - orderDate) / (1000 * 60 * 60);
        return hoursDiff < 24;
    };

    const handleCancelOrder = async (orderId) => {
        Alert.alert(
            t('myOrders.cancelOrder'),
            t('myOrders.cancelConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        setCancellingOrderId(orderId);
                        try {
                            const result = await cancelOrder(orderId);
                            if (result.success) {
                                Alert.alert(t('myOrders.cancelled'), t('myOrders.cancelSuccess'));
                                fetchMyOrders(true);
                            } else {
                                Alert.alert(t('common.error'), result.error);
                            }
                        } catch (err) {
                            console.error('❌ Cancel Order Error:', err);
                            Alert.alert(t('common.error'), t('myOrders.cancelError'));
                        } finally {
                            setCancellingOrderId(null);
                        }
                    },
                },
            ]
        );
    };

    const onRefresh = () => {
        fetchMyOrders(true);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return '#FFA500';
            case 'confirmed': return '#4CAF50';
            case 'completed': return '#2196F3';
            case 'cancelled': return '#F44336';
            case 'stock_issue': return '#FF5722';
            default: return '#999';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'time-outline';
            case 'confirmed': return 'checkmark-circle-outline';
            case 'completed': return 'checkmark-done-circle-outline';
            case 'cancelled': return 'close-circle-outline';
            case 'stock_issue': return 'alert-circle-outline';
            default: return 'help-circle-outline';
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

        const imageUrl = getFirstImage(order.listing?.media, 'https://via.placeholder.com/80?text=No+Image');
        const canCancel = isCancellable(order);
        const isCancelling = cancellingOrderId === order.order_id;

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', { orderId: order.order_id })}
                activeOpacity={0.7}
                disabled={isCancelling}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderIdRow}>
                        <Ionicons name="receipt-outline" size={16} color="#666" />
                        <Text style={styles.orderId}>{t('orderDetails.orderNumber')} #{order.order_id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Ionicons name={statusIcon} size={14} color="#fff" />
                        <Text style={styles.statusText}>
                            {t(`myOrders.${order.status?.toLowerCase()}`)}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderContent}>
                    <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
                    <View style={styles.orderInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>{title}</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="cube-outline" size={14} color="#666" />
                            <Text style={styles.infoText}>{t('myOrders.quantity')}: {order.quantity}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="storefront-outline" size={14} color="#666" />
                            <Text style={styles.infoText} numberOfLines={1}>{vendorName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="card-outline" size={14} color="#666" />
                            <Text style={styles.infoText}>
                                {order.payment_method === 'cod' ? t('myOrders.cashOnDelivery') : t('myOrders.bankTransfer')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    <View style={styles.footerLeft}>
                        <Text style={styles.amountLabel}>{t('myOrders.totalAmount')}</Text>
                        <Text style={styles.amount}>PKR {order.total_amount?.toLocaleString()}</Text>
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

                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelOrder(order.order_id)}
                        disabled={isCancelling}
                    >
                        {isCancelling ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={16} color="#fff" />
                                <Text style={styles.cancelButtonText}>Cancel Order</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <View style={styles.viewDetailsRow}>
                    <Text style={styles.viewDetailsText}>{t('myOrders.viewDetails')}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#036c5f" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>{t('myOrders.noOrders')}</Text>
            <Text style={styles.emptySubtitle}>{t('myOrders.noOrdersMessage')}</Text>
            <TouchableOpacity
                style={styles.shopButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.shopButtonText}>{t('myOrders.startShopping')}</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#036c5f" />
                <Text style={styles.loadingText}>{t('myOrders.loadingOrders')}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('myOrders.title')}</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh" size={24} color="#036c5f" />
                </TouchableOpacity>
            </View>

            {error && !loading && (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchMyOrders()}>
                        <Text style={styles.retryText}>{t('myOrders.retry')}</Text>
                    </TouchableOpacity>
                </View>
            )}

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
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F44336',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 8,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
});

export default MyOrdersScreen;