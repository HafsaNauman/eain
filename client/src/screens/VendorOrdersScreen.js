/**
 * Vendor Orders Screen
 * Shows all orders for the vendor's shop with status management
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { getVendorOrders, updateOrderStatus as apiUpdateOrderStatus } from "../api/vendorOrderService";

import { useAppDispatch, useAppSelector} from "../redux/hooks";
import { selectOrders, setOrders, updateOrderStatus } from "../redux/slices/orderSlice";

const VendorOrdersScreen = ({ navigation, route }) => {
  const { i18n, t } = useTranslation();
  const isUrdu = i18n.language === "ur";
  const { initialFilter } = route.params || {};

  const dispatch = useAppDispatch();

  // Redux se orders
  const reduxOrders = useAppSelector(selectOrders);

  const [orders, setOrdersState] = useState(reduxOrders);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(initialFilter || "all");
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchVendorOrders();
  }, []);

  const fetchVendorOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const result = await getVendorOrders();

      if (result.success) {
        const backendOrders = result.data.orders || [];

        setOrdersState(backendOrders);
        dispatch(setOrders(backendOrders)); // Redux

        console.log(`✅ Loaded ${backendOrders.length} orders`);
      } else {
        setError(result.error);
        if (!isRefresh) {
          Alert.alert(t("common.error"), result.error);
        }
      }
    } catch (err) {
      console.error("❌ Fetch Orders Error:", err);
      setError(t("errors.networkError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    Alert.alert(
      t("vendorOrders.confirmAction"),
      `${t("vendorOrders.confirmMessage")} ${t(
        `vendorOrders.${newStatus}`
      )} ${t("vendorOrders.thisOrder")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.yes"),
          onPress: async () => {
            setUpdatingOrderId(orderId);
            try {
              const result = await apiUpdateOrderStatus(orderId, newStatus);

              if (result.success) {
                Alert.alert(
                  t("vendorOrders.success"),
                  `${t(
                    "orderDetails.orderNumber"
                  )} ${t(
                    `vendorOrders.${newStatus}`
                  )} ${t("vendorOrders.orderStatusUpdated")}`
                );

                // Update Redux (global state)
                dispatch(
                  updateOrderStatus({
                    orderId,
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                  })
                );

                // Optional: backend se phir fetch
                // fetchVendorOrders(true);
              } else {
                Alert.alert(t("common.error"), result.error);
              }
            } catch (err) {
              Alert.alert(t("common.error"), t("errors.serverError"));
            } finally {
              setUpdatingOrderId(null);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    fetchVendorOrders(true);
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#FFA500";
      case "confirmed":
        return "#4CAF50";
      case "completed":
        return "#2196F3";
      case "cancelled":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const renderOrderCard = ({ item: order }) => {
    const statusColor = getStatusColor(order.status);
    const isUpdating = updatingOrderId === order.order_id;
    const productTitle =
      isUrdu && order.listing?.title_ur
        ? order.listing.title_ur
        : order.listing?.title_en || t("vendorOrders.product");

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdRow}>
            <Ionicons name="receipt-outline" size={16} color="#666" />
            <Text style={styles.orderId}>
              {t("orderDetails.orderNumber")} #{order.order_id}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {t(
                `vendorOrders.${order.status?.toLowerCase()}`
              ).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productSection}>
          <Text style={styles.sectionLabel}>{t("vendorOrders.product")}</Text>
          <Text style={styles.productTitle} numberOfLines={2}>
            {productTitle}
          </Text>
          <Text style={styles.productQuantity}>
            {t("orderDetails.quantity")}: {order.quantity}
          </Text>
          {/* ✅ STOCK CHECK - WARN if low stock */}
{order.listing?.track_inventory && order.listing.stock_quantity != null && (
  <Text 
    style={[
      styles.stockWarning, 
      order.listing.stock_quantity < order.quantity && styles.stockCritical
    ]}
  >
    📦 Stock: {order.listing.stock_quantity || 0} 
    {order.listing.stock_quantity < order.quantity && ' ⚠️ INSUFFICIENT'}
  </Text>
)}
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionLabel}>
            {t("vendorOrders.customerDetails")}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              {order.customer?.full_name ||
                order.customer_name ||
                t("vendorOrders.customerDetails")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{order.customer_phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.infoText} numberOfLines={2}>
              {order.shipping_address}, {order.city}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              {order.payment_method === "cod"
                ? t("vendorOrders.cashOnDelivery")
                : t("vendorOrders.bankTransfer")}
            </Text>
          </View>
        </View>

        {/* Total Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>
            {t("vendorOrders.totalAmount")}
          </Text>
          <Text style={styles.amount}>
            PKR {order.total_amount?.toLocaleString()}
          </Text>
        </View>

        {/* Action Buttons */}
        {order.status === "pending" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => {
  // ✅ STOCK CHECK BEFORE CONFIRM
  if (order.listing?.track_inventory && order.listing.stock_quantity != null) {
    const available = order.listing.stock_quantity - (order.listing.reserved_quantity || 0);
    if (available < order.quantity) {
      Alert.alert(
        'Low Stock Warning ⚠️',
        `Only ${available} items available, but order needs ${order.quantity}. 
         Add stock or cancel order.`,
        [{ text: 'OK' }]
      );
      return;
    }
  }
  handleStatusChange(order.order_id, "confirmed");
}}

              disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.confirmButtonText}>
                    {t("vendorOrders.confirm")}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleStatusChange(order.order_id, "cancelled")}
              disabled={isUpdating}>
              <Ionicons
                name="close-circle"
                size={18}
                color="#fff"
              />
              <Text style={styles.cancelButtonText}>
                {t("vendorOrders.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === "confirmed" && (
          <View style={styles.statusMessage}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.confirmedText}>
              {t("vendorOrders.orderConfirmed")}
            </Text>
          </View>
        )}

        {order.status === "cancelled" && (
          <View style={styles.statusMessage}>
            <Ionicons name="close-circle" size={20} color="#F44336" />
            <Text style={styles.cancelledText}>
              {t("vendorOrders.orderCancelled")}
            </Text>
          </View>
        )}

        {/* Order Date */}
        <Text style={styles.orderDate}>
          {new Date(order.created_at).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>{t("vendorOrders.noOrders")}</Text>
      <Text style={styles.emptySubtitle}>
        {filter === "all"
          ? t("vendorOrders.noOrdersMessage")
          : `${t("vendorOrders.noFilteredOrders")} ${t(
              `vendorOrders.${filter}`
            )}`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#036c5f" />
        <Text style={styles.loadingText}>
          {t("vendorOrders.loadingOrders")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#036c5f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("vendorOrders.title")}
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#036c5f" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {["all", "pending", "confirmed", "cancelled"].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            style={[
              styles.filterTab,
              filter === status && styles.filterTabActive,
            ]}>
            <Text
              style={[
                styles.filterTabText,
                filter === status && styles.filterTabTextActive,
              ]}>
              {t(`vendorOrders.${status}`)}
            </Text>
            {filter === status && (
              <View style={styles.filterTabIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchVendorOrders()}>
            <Text style={styles.retryText}>{t("myOrders.retry")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => `vendor-order-${item.order_id}`}
        contentContainerStyle={[
          styles.listContent,
          filteredOrders.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#036c5f"]}
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
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#036c5f",
    fontWeight: "bold",
  },
  filterTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#036c5f",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#c62828",
  },
  retryText: {
    fontSize: 14,
    color: "#036c5f",
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  productSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 13,
    color: "#666",
  },
  customerSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  amountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#036c5f",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  confirmedText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelledText: {
    color: "#F44336",
    fontWeight: "bold",
    fontSize: 14,
  },
  orderDate: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  stockWarning: {
  fontSize: 12,
  marginTop: 2,
  color: '#F59E0B',
},
stockCritical: {
  color: '#DC2626',
  fontWeight: 'bold',
  backgroundColor: '#FEE2E2',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  alignSelf: 'flex-start',
},

});

export default VendorOrdersScreen;