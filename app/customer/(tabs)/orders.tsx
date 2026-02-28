import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert, Dimensions, Platform } from "react-native";
import { API_URL } from "../../../utils/api";
import { getToken } from "../../../utils/auth";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      { text: "Yes, Cancel", onPress: async () => {
          try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/orders/cancel/${orderId}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              Alert.alert("Success", "Order cancelled.");
              fetchOrders(); 
            }
          } catch (e) { console.log(e); }
        }
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    if (status === "Pending") return "#F59E0B";
    if (status === "Placed" || status === "Shipped") return "#3B82F6";
    if (status === "Delivered") return "#10B981";
    return "#EF4444";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
      </View>
      
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} />}
          renderItem={({ item }: any) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>#{item.trackingId || item._id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>{new Date(item.createdAt).toDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '15' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>{item.orderStatus}</Text>
                </View>
              </View>

              <View style={styles.itemsList}>
                {item.items.map((prod: any, idx: number) => (
                  <Text key={idx} style={styles.itemText} numberOfLines={1}>• {prod.productId?.name || "Product"} (x{prod.quantity})</Text>
                ))}
              </View>

              <View style={styles.footer}>
                <Text style={styles.totalText}>₹{item.totalAmount}</Text>
                <View style={styles.actionRow}>
                   {item.orderStatus === "Placed" && (
                     <TouchableOpacity style={styles.cancelLink} onPress={() => handleCancelOrder(item._id)}>
                       <Text style={styles.cancelLinkText}>Cancel</Text>
                     </TouchableOpacity>
                   )}
                   <TouchableOpacity style={styles.trackBtn} onPress={() => router.push(`/customer/track/${item._id}` as any)}>
                     <Text style={styles.trackBtnText}>Track</Text>
                     <Ionicons name="chevron-forward" size={14} color="#10B981" />
                   </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No orders yet. 🍎</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  orderDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  itemsList: { marginVertical: 12, borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 10 },
  itemText: { fontSize: 14, color: '#475569', marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  totalText: { fontSize: 18, fontWeight: '900', color: '#10B981' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  cancelLink: { paddingVertical: 5 },
  cancelLinkText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  trackBtnText: { color: '#10B981', fontWeight: '800', marginRight: 4, fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontSize: 16 }
});