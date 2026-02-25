import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../utils/api"; 

export default function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchFarmerOrders = async () => {
    try {
      const res = await api.get("/orders/farmer"); 
      setOrders(res.data);
    } catch (e) { 
      console.log(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchFarmerOrders(); 
  }, []);

  // Status ke hisaab se color change karne ke liye helper
  const getStatusStyle = (status: string) => {
    switch(status) {
      case "Delivered": return { bg: "#DCFCE7", text: "#16A34A" };
      case "Cancelled": return { bg: "#FEE2E2", text: "#EF4444" };
      case "Placed": return { bg: "#DBEAFE", text: "#2563EB" };
      default: return { bg: "#FEF3C7", text: "#D97706" };
    }
  };

  const renderOrderItem = ({ item }: any) => {
    const statusStyle = getStatusStyle(item.orderStatus);

    return (
      <View style={styles.orderCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.orderId}>Order #{item.trackingId}</Text>
            <Text style={styles.customerName}>Customer: {item.userId?.firstName} {item.userId?.lastName}</Text>
          </View>
          {/* ✨ Status ab sirf show hoga, update nahi hoga */}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.orderStatus}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {item.items.map((prod: any, idx: number) => (
          <Text key={idx} style={styles.itemText}>• {prod.productId?.name} (x{prod.quantity})</Text>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.total}>Amount: ₹{item.totalAmount}</Text>
          {/* Tracking Path Info */}
          <View style={styles.trackingInfo}>
             <Ionicons name="location-outline" size={14} color="#64748B" />
             <Text style={styles.trackingText}>Tracking Route Active</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>My Sales / Orders</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: any) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFarmerOrders} />}
          ListEmptyComponent={<Text style={styles.empty}>No sales recorded yet. 🌾</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 15 },
  title: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  customerName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  itemText: { fontSize: 14, color: '#475569', marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  total: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  trackingInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackingText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});