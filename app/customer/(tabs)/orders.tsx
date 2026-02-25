import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { API_URL } from "../../../utils/api";
import { getToken } from "../../../utils/auth";

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  // ✨ HANDLE CANCEL ORDER (Fixed: Method changed from PUT to PATCH)
  const handleCancelOrder = async (orderId: string) => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      { text: "Yes, Cancel", onPress: async () => {
          try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/orders/cancel/${orderId}`, {
              method: "PATCH", // Changed to match backend route
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
              Alert.alert("Success", "Order has been cancelled.");
              fetchOrders(); 
            } else {
              Alert.alert("Error", data.message);
            }
          } catch (e) {
            Alert.alert("Error", "Server connection failed.");
          }
        }
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    if (status === "Pending") return "#F59E0B";
    if (status === "Placed" || status === "Shipped") return "#3B82F6";
    if (status === "Delivered") return "#10B981";
    if (status === "Cancelled") return "#EF4444";
    return "#EF4444";
  };

  const renderOrderItem = ({ item }: any) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.trackingId || item._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>{item.orderStatus}</Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {item.items.map((prod: any, idx: number) => (
          <Text key={idx} style={styles.itemText}>• {prod.productId?.name || "Product"} (x{prod.quantity})</Text>
        ))}
      </View>

      {item.orderStatus !== "Cancelled" && !["In-Transit", "Delivered"].includes(item.orderStatus) && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelOrder(item._id)}>
          <Text style={styles.cancelBtnText}>Cancel Order</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: ₹{item.totalAmount}</Text>
        <TouchableOpacity 
          style={styles.trackBtn} 
          onPress={() => router.push(`/customer/track/${item._id}` as any)}
        >
          <Text style={styles.trackBtnText}>Track Order</Text>
          <Ionicons name="chevron-forward" size={16} color="#10B981" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item: any) => item._id}
        renderItem={renderOrderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} />}
        ListEmptyComponent={<Text style={styles.empty}>No orders found yet. 🍎</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  orderDate: { fontSize: 12, color: '#94A3B8' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  itemsList: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9', paddingVertical: 10, marginVertical: 10 },
  itemText: { fontSize: 14, color: '#475569', marginBottom: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  trackBtn: { flexDirection: 'row', alignItems: 'center' },
  trackBtnText: { color: '#10B981', fontWeight: '700', marginRight: 4 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8' },
  cancelBtn: { backgroundColor: '#FEE2E2', padding: 10, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  cancelBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 }
});