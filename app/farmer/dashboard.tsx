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

  // ✨ UPGRADED ANALYSIS LOGIC
  const processedSalesData = useMemo(() => {
    // 1. Initialize data with ALL farmer products (so they show even with 0 sales)
    const analysisMap: { [key: string]: any } = {};
    
    myProducts.forEach(p => {
      analysisMap[p._id] = {
        name: p.name,
        category: p.category,
        unit: p.category === 'grains' ? 'Quintal' : 'kg',
        soldQty: 0,
        revenue: 0,
        totalStock: p.quantity,
        id: p._id
      };
    });

    // 2. Add sales data ONLY from DELIVERED orders
    allOrders.forEach(order => {
      if (order.orderStatus === "Delivered") {
        order.items.forEach((item: any) => {
          const prodId = item.productId?._id || item.productId;
          if (analysisMap[prodId]) {
            const qty = Number(item.quantity) || 0;
            const price = item.productId?.price || 0;
            
            analysisMap[prodId].soldQty += qty;
            analysisMap[prodId].revenue += (qty * price);
          }
        });
      }
    });

    const result = Object.values(analysisMap);
    return {
      essentials: result.filter(p => p.category !== 'grains'),
      grains: result.filter(p => p.category === 'grains')
    };
  }, [allOrders, myProducts]);

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

      // ✨ Earnings calculation updated: Sum only DELIVERED orders
      const deliveredEarnings = orders
        .filter((o: any) => o.orderStatus === "Delivered")
        .reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);

      setStats({
        totalProducts: filteredProducts.length,
        pendingOrders: orders.filter((o: any) => o.orderStatus === "Placed").length,
        earnings: deliveredEarnings,
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

  const handleDeleteProduct = async (id: string, name: string) => {
    Alert.alert("Delete Crop", `Are you sure?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/products/${id}`);
            fetchData();
            Alert.alert("Success", "Product removed");
          } catch (e) { Alert.alert("Error", "Could not delete"); }
        }
      }
    ]);
  };

  const AnalysisBarChart = ({ title, subtitle, data, color }: any) => {
    if (data.length === 0) return null;
    const maxVal = Math.max(...data.map((d: any) => d.revenue), 100);

    return (
      <View style={styles.analysisCard}>
        <View style={styles.insightHeader}>
          <View>
            <Text style={styles.insightTitle}>{title}</Text>
            <Text style={styles.insightSub}>{subtitle}</Text>
          </View>
          <View style={[styles.unitBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.unitBadgeText, { color: color }]}>{data[0].unit}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {data.map((item: any, index: number) => (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barInfoTop}>
                <Text style={[styles.barValueText, { color }]}>₹{item.revenue > 1000 ? `${(item.revenue/1000).toFixed(1)}k` : item.revenue.toFixed(0)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${(item.revenue / maxVal) * 100}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.soldQtyLabel}>{item.soldQty} Sold</Text>
            </View>
          ))}
        </View>
      </View>
    );
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
        <View style={styles.welcomeContainer}>
            <Text style={styles.greetingText}>Namaste!! {user?.firstName}!</Text>
            <Text style={styles.subGreeting}>Aapka farm aaj kaisa hai?</Text>
        </View>

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
        <View style={styles.actionRow}>
            <ActionBtn label="Add Crop" icon="add" color="#10B981" onPress={() => router.push("/farmer/add-product")} />
            <ActionBtn label="Orders" icon="list" color="#F59E0B" onPress={() => router.push("/farmer/orders" as any)} />
        </View>

        <Text style={styles.sectionTitle}>Sales Momentum & Analysis</Text>
        
        {/* ✨ DUAL ANALYSIS CARDS */}
        {myProducts.length > 0 ? (
            <>
                <AnalysisBarChart 
                    title="Essential Crops (kg)" 
                    subtitle="Fruits, Veggies & Spices performance" 
                    data={processedSalesData.essentials} 
                    color="#10B981" 
                />
                <View style={{ height: 15 }} />
                <AnalysisBarChart 
                    title="Grain Market (Quintal)" 
                    subtitle="Commercial grain sales analysis" 
                    data={processedSalesData.grains} 
                    color="#3B82F6" 
                />
            </>
        ) : (
            <View style={styles.emptyChart}>
                <MaterialCommunityIcons name="finance" size={40} color="#D1D5DB" />
                <Text style={styles.emptyChartText}>No products listed yet.</Text>
            </View>
        )}
      </ScrollView>

      {/* Inventory Modal */}
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
                                <TouchableOpacity onPress={() => handleDeleteProduct(item._id, item.name)}>
                                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.stockValue, item.quantity <= 0 && { color: '#EF4444' }]}>Remaining: {Number(item.quantity).toFixed(2)} kg</Text>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
      </Modal>

      <View style={styles.bottomNav}>
        <NavIcon icon="home" label="Home" active />
        <NavIcon icon="cube-outline" label="My Crops" onPress={() => setInventoryVisible(true)} />
        <NavIcon icon="chatbubbles-outline" label="AI Help" onPress={() => router.push("/farmer/chat")} />
        <NavIcon icon="person-outline" label="Profile" onPress={() => router.push("/farmer/profile")} />
      </View>
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
  header: { 
    backgroundColor: "#10B981", 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight + 10 : 40) : 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    elevation: 15 
  },
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
  
  // Analysis & Chart Styles
  analysisCard: { backgroundColor: '#fff', borderRadius: 30, padding: 20, elevation: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  insightTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  insightSub: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  unitBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  unitBadgeText: { fontSize: 10, fontWeight: '800' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-start', height: 160, gap: 12 },
  barWrapper: { alignItems: 'center', width: 60 },
  barInfoTop: { marginBottom: 5 },
  barValueText: { fontSize: 10, fontWeight: '900' },
  barTrack: { height: 90, width: 22, backgroundColor: '#F8FAFC', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 10, fontWeight: '800', color: '#334155', marginTop: 8, textAlign: 'center' },
  soldQtyLabel: { fontSize: 8, color: '#94A3B8', fontWeight: '700' },
  
  emptyChart: { paddingVertical: 40, alignItems: 'center', backgroundColor: '#fff', borderRadius: 30 },
  emptyChartText: { color: '#94A3B8', fontSize: 14, fontWeight: '700', marginTop: 10 },
  
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