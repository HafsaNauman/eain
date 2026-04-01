/**
 * Vendor Order Detail Screen
 * Shows detailed view of a single order with status timeline and actions
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { getOrderDetails, updateOrderStatus as apiUpdateOrderStatus } from "../api/orderService";

import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { selectOrders, updateOrderStatus } from "../redux/slices/orderSlice";

const VendorOrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { i18n, t } = useTranslation();
  const isUrdu = i18n.language === "ur";

  const dispatch = useAppDispatch();
  const reduxOrders = useAppSelector((state) =>
    state.orders.list.filter((o) => o.order_id === orderId)
  );
  const reduxOrder = reduxOrders[0] || null;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getOrderDetails(orderId);

      if (result.success) {
        const backendOrder = result.data;
        setOrder(backendOrder);
        dispatch(updateOrderStatus({ orderId, status: backendOrder.status }));
      } else {
        setError(result.error);
        Alert.alert(t("common.error"), result.error);
      }
    } catch (err) {
      console.error("❌ Fetch Order Details Error:", err);
      setError(t("errors.serverError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCallCustomer = () => {
    if (order?.customer_phone) {
      Linking.openURL(`tel:${order.customer_phone}`);
    } else {
      Alert.alert(t("common.alert"), t("orderDetails.noContact"));
    }
  };

  const handleUpdateStatus = (newStatus) => {
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
            setUpdating(true);
            try {
              const result = await apiUpdateOrderStatus(order.order_id, newStatus);
              if (result.success) {
                Alert.alert(
                  t("vendorOrders.success"),
                  t("vendorOrders.orderStatusUpdated")
                );
                // Update Redux
                dispatch(
                  updateOrderStatus({
                    orderId,
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                  })
                );
                // Re‑fetch backend
                fetchOrderDetails();
              } else {
                Alert.alert(t("common.error"), result.error);
              }
            } catch (err) {
              Alert.alert(t("common.error"), t("errors.serverError"));
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#FFA500";
      case "confirmed":
        return "#4CAF50";
      case "shipped":
        return "#2196F3";
      case "delivered":
        return "#388E3C";
      case "cancelled":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const statusColor = getStatusColor(order?.status);
  const title =
    isUrdu && order?.listing?.title_ur
      ? order.listing.title_ur
      : order?.listing?.title_en || t("orderDetails.product");
  const vendorName =
    isUrdu && order?.vendor?.business_name_ur
      ? order.vendor.business_name_ur
      : order?.vendor?.business_name_en || t("orderDetails.vendor");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#036c5f" />
        <Text style={styles.loadingText}>{t("orderDetails.loading")}</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>
          {error || t("orderDetails.notFound")}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t("common.goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("orderDetails.orderDetails")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.orderIdText}>
              {t("orderDetails.orderNumber")} #{order.order_id}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {t(`vendorOrders.${order.status?.toLowerCase()}`).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            {t("orderDetails.orderDate")}:{" "}
            {new Date(order.created_at).toLocaleString("en-US", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </Text>
        </View>

        {/* Order Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("orderDetails.statusTimeline")}</Text>
          <View style={styles.timeline}>
            {["pending", "confirmed", "shipped", "delivered"].map((key, index) => {
              const statusOrder = ["pending", "confirmed", "shipped", "delivered"];
              const currentIndex = statusOrder.indexOf(order.status?.toLowerCase());
              const isDone = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <View key={key} style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      isActive && styles.timelineDotActive,
                      isCurrent && styles.timelineDotCurrent,
                    ]}
                  />
                  <Text
                    style={[
                      styles.timelineLabel,
                      isActive && styles.timelineLabelActive,
                      isCurrent && styles.timelineLabelCurrent,
                    ]}
                  >
                    {t(`vendorOrders.${key}`).toUpperCase()}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {isCurrent
                      ? new Date(order.created_at).toLocaleString("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Delivery Info */}
        {order.shipping_courier || order.tracking_number || order.estimated_delivery_date ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("orderDetails.deliveryInfo")}</Text>
            <View style={styles.deliveryCard}>
              {order.shipping_courier && (
                <View style={styles.deliveryRow}>
                  <Ionicons name="truck" size={16} color="#036c5f" />
                  <Text style={styles.deliveryText}>
                    {t("orderDetails.courier")}: {order.shipping_courier}
                  </Text>
                </View>
              )}
              {order.tracking_number && (
                <View style={styles.deliveryRow}>
                  <Ionicons name="barcode" size={16} color="#036c5f" />
                  <Text style={styles.deliveryText}>
                    {t("orderDetails.trackingNumber")}: {order.tracking_number}
                  </Text>
                </View>
              )}
              {order.estimated_delivery_date && (
                <View style={styles.deliveryRow}>
                  <Ionicons name="calendar" size={16} color="#036c5f" />
                  <Text style={styles.deliveryText}>
                    {t("orderDetails.estimatedDelivery")}:{" "}
                    {new Date(order.estimated_delivery_date).toLocaleDateString("en-US")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("orderDetails.productDetails")}</Text>
          <View style={styles.productCard}>
            {order.listing?.media?.images?.[0] ? (
              <Image
                source={{ uri: order.listing.media.images[0] }}
                style={styles.productImage}
              />
            ) : (
              <View style={styles.productPlaceholder}>
                <Ionicons name="image-outline" size={24} color="#999" />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>{title}</Text>
              <Text style={styles.productPrice}>
                PKR {order.listing?.price?.toLocaleString()}
              </Text>
              <Text style={styles.productQuantity}>
                {t("orderDetails.quantity")}: {order.quantity}
              </Text>
              {/* ✅ STOCK STATUS */}
{order.listing?.track_inventory && (
  <View style={styles.stockContainer}>
    <Text style={[
      styles.stockText,
      order.listing.stock_quantity <= 5 && styles.lowStockWarning
    ]}>
      📦 Available: {order.listing.stock_quantity || 0} 
    </Text>
    {order.listing.stock_quantity < order.quantity && (
      <Text style={styles.insufficientStock}>⚠️ INSUFFICIENT STOCK</Text>
    )}
  </View>
)}

            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("orderDetails.deliveryAddress")}</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={20} color="#036c5f" />
              <View style={styles.addressInfo}>
                <Text style={styles.addressText}>{order.shipping_address}</Text>
                <Text style={styles.addressCity}>
                  {order.area ? `${order.area}, ` : ""}
                  {order.city}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("orderDetails.vendorInfo")}</Text>
          <View style={styles.vendorCard}>
            <View style={styles.vendorHeader}>
              <Ionicons name="storefront" size={24} color="#036c5f" />
              <Text style={styles.vendorName}>{vendorName}</Text>
            </View>
            {order.vendor.city && (
              <Text style={styles.vendorLocation}>
                {order.vendor.city}
                {order.vendor.area ? `, ${order.vendor.area}` : ""}
              </Text>
            )}
            {order.vendor.phone && (
              <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.callButtonText}>{t("orderDetails.callCustomer")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("orderDetails.paymentDetails")}</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{t("orderDetails.paymentMethod")}</Text>
              <Text style={styles.paymentValue}>
                {order.payment_method === "cod"
                  ? t("vendorOrders.cashOnDelivery")
                  : t("vendorOrders.bankTransfer")}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{t("orderDetails.subtotal")}</Text>
              <Text style={styles.paymentValue}>
                PKR {(order.listing?.price * order.quantity).toLocaleString()}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>{t("orderDetails.totalAmount")}</Text>
              <Text style={styles.totalValue}>
                PKR {order.total_amount?.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
{/* ✅ STOCK WARNING BANNER */}
{order.status === "pending" && order.listing?.track_inventory && order.listing.stock_quantity <= 5 && (
  <View style={styles.stockAlert}>
    <Ionicons name="warning-outline" size={20} color="#F59E0B" />
    <Text style={styles.stockAlertText}>
      LOW STOCK: {order.listing.stock_quantity} items remaining
    </Text>
  </View>
)}

        {/* Quick Actions by Status */}
        {order.status === "pending" && (
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>{t("vendorOrders.quickActions")}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => {
  // ✅ STOCK VALIDATION
  if (order.listing?.track_inventory && order.listing.stock_quantity != null) {
    const available = (order.listing.stock_quantity || 0) - (order.listing.reserved_quantity || 0);
    if (available < order.quantity) {
      Alert.alert(
        '❌ Insufficient Stock',
        `Only ${available} items available but order needs ${order.quantity}.\n\nAdd stock first or cancel order.`,
        [{ text: 'OK' }]
      );
      return;
    }
  }
  handleUpdateStatus("confirmed");
}}

                disabled={updating}>
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>{t("vendorOrders.confirmOrder")}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleUpdateStatus("cancelled")}
                disabled={updating}>
                <Text style={styles.actionButtonText}>{t("vendorOrders.cancelOrder")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {order.status === "confirmed" && (
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>{t("vendorOrders.quickActions")}</Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.shipButton]}
              onPress={() => handleUpdateStatus("shipped")}
              disabled={updating}>
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>{t("vendorOrders.markAsShipped")}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#036c5f",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  orderDate: {
    fontSize: 13,
    color: "#666",
  },

  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },

  // Timeline
  timeline: {
    marginLeft: 12,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotActive: {
    backgroundColor: "#036c5f",
  },
  timelineDotCurrent: {
    backgroundColor: "#036c5f",
    width: 10,
    height: 10,
    marginTop: 3,
  },
  timelineLabel: {
    fontSize: 14,
    color: "#999",
    flex: 1,
  },
  timelineLabelActive: {
    color: '#1a1a1a',
  },
  timelineLabelCurrent: {
    fontWeight: 'bold',
    color: '#036c5f',
  },
  timelineTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  // Delivery Info
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 12,
  },

  // Product Info
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
  },
  productPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Delivery Address
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

  // Vendor Info
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

  // Payment Info
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

  // Quick Actions
  actionSection: {
    marginTop: 16,
  },
  actionSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  shipButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stockContainer: {
  marginTop: 4,
},
stockText: {
  fontSize: 12,
  color: '#F59E0B',
  fontWeight: '500',
},
lowStockWarning: {
  color: '#DC2626',
  fontWeight: 'bold',
},
insufficientStock: {
  fontSize: 11,
  color: '#DC2626',
  fontWeight: 'bold',
  backgroundColor: '#FEE2E2',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  alignSelf: 'flex-start',
  marginTop: 2,
},
stockAlert: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF8E1',
  padding: 12,
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#F59E0B',
  marginBottom: 12,
},
stockAlertText: {
  fontSize: 14,
  color: '#92400E',
  fontWeight: '600',
  marginLeft: 8,
  flex: 1,
},

});
export default VendorOrderDetailScreen;