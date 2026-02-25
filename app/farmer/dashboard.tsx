import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  StatusBar as RNStatusBar,
  Dimensions,
  Alert
} from "react-native";
import api from "../../utils/api"; 
import { getLoggedInUser, getToken } from "../../utils/auth"; 
import { API_URL } from "../../utils/api";
import * as Location from 'expo-location';

const { width } = Dimensions.get("window");

export default function FarmerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("Fetching location...");
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    earnings: 0,
    totalOrders: 0
  });

  const salesData = useMemo(() => {
    const analysis: { [key: string]: number } = {};
    allOrders.forEach(order => {
      order.items.forEach((item: any) => {
        const prodName = item.productId?.name || "Unknown";
        const isMyProduct = myProducts.some(p => p._id === item.productId?._id);
        if (isMyProduct) {
          analysis[prodName] = (analysis[prodName] || 0) + (item.quantity * (item.productId?.price / 100 || 0));
        }
      });
    });
    return Object.entries(analysis)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allOrders, myProducts]);

  const maxSales = Math.max(...salesData.map(d => d.value), 1);
  const topProduct = salesData.length > 0 ? salesData[0] : null;

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setAddress("Location Access Denied");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    let reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
    if (reverseGeocode.length > 0) {
      setAddress(`${reverseGeocode[0].district || reverseGeocode[0].city}, ${reverseGeocode[0].region}`);
    }
  };

  const fetchData = async () => {
    try {
      const token = await getToken();
      const decoded = await getLoggedInUser();
      const userRes = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const userData = await userRes.json();
      setUser(userData);

      const [prodRes, orderRes] = await Promise.all([
        api.get("/products"),
        api.get("/orders/farmer"),
      ]);

      const orders = orderRes.data || [];
      setAllOrders(orders);
      const filteredProducts = prodRes.data.filter((p: any) => p.farmerId?._id === decoded?.id || p.farmerId === decoded?.id);
      setMyProducts(filteredProducts);

      setStats({
        totalProducts: filteredProducts.length,
        pendingOrders: orders.filter((o: any) => o.orderStatus === "Placed").length,
        earnings: orders.reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0),
        totalOrders: orders.length
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    getLocation();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    getLocation();
  }, []);

  // ✨ DELETE PRODUCT HANDLER
  const handleDeleteProduct = async (id: string, name: string) => {
    Alert.alert("Delete Crop", `Are you sure you want to remove ${name}? Customer offers and listings will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/products/${id}`);
            fetchData(); // Dashboard reload
            Alert.alert("Success", "Product removed successfully");
          } catch (e) {
            Alert.alert("Error", "Could not delete product");
          }
        }
      }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}><Image source={require("../../assets/images/logo.png")} style={styles.logoImg} /></View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.logoText}>KisanX</Text>
            <TouchableOpacity style={styles.locationRow} onPress={getLocation}>
                <Ionicons name="location" size={12} color="#D1FAE5" /><Text style={styles.locationText} numberOfLines={1}>{address}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push("/farmer/profile")}>
          <Image source={{ uri: user?.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.avatarImg} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#10B981"]} />} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeContainer}><Text style={styles.greetingText}>Namaste!! {user?.firstName}!</Text><Text style={styles.subGreeting}>Aapka farm aaj kaisa hai?</Text></View>
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#F0FDF4' }]} onPress={() => setInventoryVisible(true)}>
            <View style={styles.statIconBox}><Ionicons name="cube-outline" size={22} color="#10B981" /></View>
            <Text style={styles.statVal}>{stats.totalProducts}</Text><Text style={styles.statLab}>My Crops</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}><View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}><Ionicons name="cart-outline" size={22} color="#F59E0B" /></View><Text style={styles.statVal}>{stats.pendingOrders}</Text><Text style={styles.statLab}>Pending</Text></View>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}><View style={[styles.statIconBox, { backgroundColor: '#DBEAFE' }]}><Ionicons name="wallet-outline" size={22} color="#3B82F6" /></View><Text style={styles.statVal}>₹{stats.earnings}</Text><Text style={styles.statLab}>Earnings</Text></View>
          <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}><View style={[styles.statIconBox, { backgroundColor: '#EDE9FE' }]}><Ionicons name="stats-chart-outline" size={22} color="#8B5CF6" /></View><Text style={styles.statVal}>{stats.totalOrders}</Text><Text style={styles.statLab}>Orders</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}><ActionBtn label="Add Crop" icon="add" color="#10B981" onPress={() => router.push("/farmer/add-product")} /><ActionBtn label="Orders" icon="list" color="#F59E0B" onPress={() => router.push("/farmer/orders" as any)} /></View>

        <Text style={styles.sectionTitle}>Sales Momentum & Analysis</Text>
        <View style={styles.analysisCard}>
            {salesData.length > 0 ? (
                <>
                    <View style={styles.insightHeader}><View><Text style={styles.insightTitle}>Performance Review</Text><Text style={styles.insightSub}>Your crop sales are growing! 📈</Text></View>{topProduct && (<View style={styles.bestSellerBadge}><Ionicons name="ribbon" size={14} color="#F59E0B" /><Text style={styles.bestSellerText}>Top: {topProduct.name}</Text></View>)}</View>
                    <View style={styles.chartContainer}>
                        {salesData.map((item, index) => (
                            <View key={index} style={styles.barWrapper}><View style={styles.barInfoTop}><Text style={styles.barValueText}>₹{item.value > 1000 ? `${(item.value/1000).toFixed(1)}k` : item.value.toFixed(0)}</Text></View><View style={styles.barTrack}><View style={[styles.barFill, { height: `${(item.value / maxSales) * 100}%` }, index === 0 && { backgroundColor: '#10B981' }]} /></View><Text style={styles.barLabel} numberOfLines={1}>{item.name}</Text></View>
                        ))}
                    </View>
                    <View style={styles.divider} /><View style={styles.summaryRow}><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total Revenue</Text><Text style={styles.summaryVal}>₹{stats.earnings.toFixed(2)}</Text></View><View style={styles.summaryDivider} /><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Average/Crop</Text><Text style={styles.summaryVal}>₹{(stats.earnings / (salesData.length || 1)).toFixed(0)}</Text></View></View>
                </>
            ) : (<View style={styles.emptyChart}><View style={styles.emptyIconCircle}><MaterialCommunityIcons name="finance" size={40} color="#D1D5DB" /></View><Text style={styles.emptyChartText}>No sales data recorded yet.</Text><Text style={styles.emptyChartSub}>Complete your first order to see analysis!</Text></View>)}
        </View>
      </ScrollView>

      <Modal visible={inventoryVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.modalHeader}><TouchableOpacity onPress={() => setInventoryVisible(false)} style={styles.closeBtn}><Ionicons name="close" size={28} color="#1F2937" /></TouchableOpacity><Text style={styles.modalTitle}>Stock Inventory</Text></View>
            <FlatList
                data={myProducts}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                    <View style={styles.invCard}>
                        <Image source={{ uri: item.image }} style={styles.invImg} />
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={styles.invName}>{item.name}</Text>
                                {/* ✨ DELETE BUTTON ADDED */}
                                <TouchableOpacity onPress={() => handleDeleteProduct(item._id, item.name)}>
                                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.stockValue, item.quantity <= 0 && { color: '#EF4444' }]}>Remaining: {Number(item.quantity).toFixed(3)} kg</Text>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
      </Modal>

      <View style={styles.bottomNav}><NavIcon icon="home" label="Home" active /><NavIcon icon="cube-outline" label="My Crops" onPress={() => setInventoryVisible(true)} /><NavIcon icon="chatbubbles-outline" label="AI Help" onPress={() => router.push("/farmer/chat")} /><NavIcon icon="person-outline" label="Profile" onPress={() => router.push("/farmer/profile")} /></View>
    </SafeAreaView>
  );
}

const ActionBtn = ({ label, icon, color, onPress }: any) => (
  <TouchableOpacity style={[styles.bigBtn, { backgroundColor: color }]} onPress={onPress}><Ionicons name={icon} size={28} color="white" /><Text style={styles.btnLab}>{label}</Text></TouchableOpacity>
);

const NavIcon = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}><Ionicons name={icon} size={22} color={active ? "#10B981" : "#94A3B8"} /><Text style={[styles.navLab, active && { color: "#10B981" }]}>{label}</Text></TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#10B981", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: Platform.OS === 'ios' ? 120 : 105, paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight + 10 : 25) : 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 15 },
  logoRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', marginRight: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: '100%', height: '100%' },
  headerTextContainer: { flex: 1 },
  logoText: { color: "white", fontSize: 24, fontWeight: "900", letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { color: "#D1FAE5", fontSize: 11, fontWeight: "600", marginLeft: 4, maxWidth: '90%' },
  avatarImg: { width: 50, height: 50, borderRadius: 18, borderWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  scroll: { padding: 20, paddingBottom: 110 },
  welcomeContainer: { marginBottom: 25 },
  greetingText: { fontSize: 28, fontWeight: "900", color: "#1F2937" },
  subGreeting: { fontSize: 15, color: "#6B7280", marginTop: 2, fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  statCard: { width: "48%", padding: 18, borderRadius: 24, elevation: 3, marginBottom: 5 },
  statIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statVal: { fontSize: 22, fontWeight: "900", color: "#1F2937" },
  statLab: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 19, fontWeight: "800", marginTop: 25, marginBottom: 15, color: "#374151" },
  actionRow: { flexDirection: "row", gap: 15 },
  bigBtn: { flex: 1, height: 95, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  btnLab: { color: "white", fontWeight: "800", marginTop: 8 },
  analysisCard: { backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 8, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  insightTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  insightSub: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  bestSellerBadge: { backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#FEF3C7' },
  bestSellerText: { color: '#B45309', fontSize: 10, fontWeight: '800' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 180, marginBottom: 20 },
  barWrapper: { alignItems: 'center', width: 55 },
  barInfoTop: { marginBottom: 8 },
  barValueText: { fontSize: 10, fontWeight: '900', color: '#10B981' },
  barTrack: { height: 110, width: 18, backgroundColor: '#F8FAFC', borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { backgroundColor: '#34D399', width: '100%', borderRadius: 10 },
  barLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', marginTop: 12, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginBottom: 4 },
  summaryVal: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  summaryDivider: { width: 1, height: 25, backgroundColor: '#F1F5F9' },
  emptyChart: { paddingVertical: 40, alignItems: 'center' },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  emptyChartText: { color: '#475569', fontSize: 16, fontWeight: '800' },
  emptyChartSub: { color: '#94A3B8', fontSize: 12, marginTop: 5, fontWeight: '600' },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 75, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderColor: '#F1F5F9', paddingBottom: 10 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navLab: { fontSize: 10, color: "#94A3B8", marginTop: 4, fontWeight: '700' },
  modalHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  closeBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1F2937', marginLeft: 15 },
  invCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  invImg: { width: 70, height: 70, borderRadius: 15 },
  invName: { fontSize: 17, fontWeight: '800', color: '#1F2937' },
  stockValue: { fontSize: 15, fontWeight: '700', color: '#10B981', marginTop: 4 }
});