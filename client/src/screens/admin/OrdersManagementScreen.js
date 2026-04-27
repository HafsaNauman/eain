import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    Platform,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getAllOrdersAdmin, updateDisputeStatus } from '../../api/adminService';

const OrdersManagementScreen = ({ navigation }) => {
    const { t } = useTranslation();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Modal state
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [disputeStatus, setDisputeStatus] = useState('under_review');

    const LIMIT = 20;

    // ✅ Fetch Orders (fixed pagination + state)
    const fetchOrders = useCallback(async (isRefresh = false, append = false, customPage = page) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
                setPage(0);
            } else {
                setLoading(true);
            }

            setError(null);

            const params = {
                limit: LIMIT,
                offset: isRefresh ? 0 : customPage * LIMIT,
            };

            const result = await getAllOrdersAdmin(params);

            if (result.success) {
                const newOrders = result.data.orders || [];

                setOrders(prev =>
                    append ? [...prev, ...newOrders] : newOrders
                );

                setHasMore(
                    result.data.pagination?.hasMore ?? newOrders.length === LIMIT
                );
            } else {
                setError(result.error || 'Failed to fetch orders');
                setHasMore(false);
            }
        } catch (err) {
            console.error('Fetch orders error:', err);
            setError('Network error');
            setHasMore(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setUpdatingOrderId(null);
        }
    }, [page]);

    useEffect(() => {
        fetchOrders(true);
    }, []);

    // ✅ Open Modal
    const openDisputeModal = (order) => {
        setSelectedOrder(order);
        setDisputeStatus(order.dispute_status || 'under_review');
        setResolutionNote('');
        setShowDisputeModal(true);
    };

    // ✅ Update Dispute
    const handleUpdateDispute = async () => {
        if (!selectedOrder) return;

        try {
            setUpdatingOrderId(selectedOrder.order_id);

            const result = await updateDisputeStatus(selectedOrder.order_id, {
                dispute_status: disputeStatus,
                resolution_note: resolutionNote
            });

            if (result.success) {
                Alert.alert('Success', 'Dispute updated');
                setShowDisputeModal(false);
                fetchOrders(true);
            } else {
                Alert.alert('Error', result.error);
            }
        } catch (err) {
            Alert.alert('Error', 'Server error');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // ✅ Pagination
    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchOrders(false, true, nextPage);
        }
    };

    const onRefresh = () => fetchOrders(true);

    // ✅ Order Card
    const renderOrderCard = ({ item: order }) => {
        const isUpdating = updatingOrderId === order.order_id;
        const statusColor =
            (order.status || 'pending') === 'delivered'
                ? '#4CAF50'
                : '#F44336';

        const hasDispute = !!order.dispute_status;

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderId}>
                            Order #{order.order_id}
                        </Text>
                        <Text style={styles.orderAmount}>
                            PKR {order.total_amount?.toLocaleString()}
                        </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>
                            {(order.status || 'unknown').toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <Text style={styles.detailText}>
                        Customer ID: {order.customer_id}
                    </Text>

                    {hasDispute && (
                        <Text style={styles.disputeText}>
                            Dispute: {order.dispute_status.replace('_', ' ').toUpperCase()}
                        </Text>
                    )}

                    <Text style={styles.createdDate}>
                        {order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : 'N/A'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.disputeButton}
                    onPress={() => openDisputeModal(order)}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="shield-half-outline" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>
                                {hasDispute ? 'Manage Dispute' : 'Open Dispute'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    // ✅ Empty State
    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Orders</Text>
        </View>
    );

    // ✅ Modal
    const renderDisputeModal = () => (
        <Modal visible={showDisputeModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Manage Dispute</Text>
                    <Text style={styles.modalSubtitle}>
                        Order #{selectedOrder?.order_id}
                    </Text>

                    <View style={styles.statusRow}>
                        {['under_review', 'resolved', 'rejected'].map(status => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.statusBtn,
                                    disputeStatus === status && styles.activeStatus
                                ]}
                                onPress={() => setDisputeStatus(status)}
                            >
                                <Text style={styles.statusBtnText}>
                                    {status.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter resolution note..."
                        multiline
                        value={resolutionNote}
                        onChangeText={setResolutionNote}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setShowDisputeModal(false)}
                        >
                            <Text>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleUpdateDispute}
                        >
                            <Text style={{ color: '#fff' }}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            {error && <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>}

            <FlatList
                data={orders}
                renderItem={renderOrderCard}
                keyExtractor={(item) => item.order_id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={renderEmpty}
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
            />

            {loading && <ActivityIndicator style={{ margin: 10 }} />}

            {renderDisputeModal()}
        </SafeAreaView>
    );
};

export default OrdersManagementScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
    },

    // ───────────────────────── Header Cards
    orderCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 14,
        padding: 16,

        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },

    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },

    orderAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#036c5f',
        marginTop: 4,
    },

    // ───────────────────────── Status Badge
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },

    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },

    // ───────────────────────── Details
    orderDetails: {
        marginBottom: 12,
    },

    detailText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 6,
    },

    disputeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ff9800',
        marginTop: 4,
    },

    createdDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 6,
    },

    // ───────────────────────── Button
    disputeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        backgroundColor: '#FF9800',
        paddingVertical: 10,
        borderRadius: 10,

        gap: 8,
    },

    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },

    // ───────────────────────── Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#666',
        marginTop: 12,
    },

    // ───────────────────────── Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1a1a1a',
    },

    modalSubtitle: {
        fontSize: 13,
        color: '#777',
        textAlign: 'center',
        marginBottom: 16,
        marginTop: 4,
    },

    // ───────────────────────── Status buttons
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },

    statusBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',
    },

    activeStatus: {
        backgroundColor: '#036c5f',
    },

    statusBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },

    // ───────────────────────── Input
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },

    // ───────────────────────── Modal actions
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
    },

    cancelBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },

    saveBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#036c5f',
        alignItems: 'center',
    },
});