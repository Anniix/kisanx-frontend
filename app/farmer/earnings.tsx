import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
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
  StatusBar as RNStatusBar,
  RefreshControl,
  Dimensions,
} from "react-native";
import api from "../../utils/api";
import { getLoggedInUser } from "../../utils/auth";

const { width } = Dimensions.get("window");

const CATEGORY_COLORS: any = {
  vegetables: { bg: "#F0FDF4", text: "#10B981", badge: "#D1FAE5" },
  fruits:     { bg: "#FFF7ED", text: "#F97316", badge: "#FFEDD5" },
  grains:     { bg: "#EFF6FF", text: "#3B82F6", badge: "#DBEAFE" },
  spices:     { bg: "#FDF4FF", text: "#A855F7", badge: "#F3E8FF" },
};

const CATEGORY_ICONS: any = {
  vegetables: "leaf-outline",
  fruits:     "nutrition-outline",
  grains:     "ellipse-outline",
  spices:     "flame-outline",
};

export default function EarningsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const fetchData = async () => {
    try {
      const decoded = await getLoggedInUser();
      const [prodRes, orderRes] = await Promise.all([
        api.get("/products"),
        api.get("/orders/farmer"),
      ]);
      const orders = orderRes.data || [];
      setAllOrders(orders);
      const filteredProducts = prodRes.data.filter(
        (p: any) => p.farmerId?._id === decoded?.id || p.farmerId === decoded?.id
      );
      setMyProducts(filteredProducts);
    } catch (err) {
      console.error("Earnings fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // ─── Computed earnings per product ───────────────────────────────────────
  const earningsData = useMemo(() => {
    const map: { [key: string]: any } = {};

    myProducts.forEach((p) => {
      map[p._id] = {
        id: p._id,
        name: p.name,
        image: p.image,
        category: p.category,
        price: p.price,
        revenue: 0,
        soldQty: 0,
        orderCount: 0,
        remainingStock: p.quantity,
      };
    });

    allOrders.forEach((order) => {
      if (order.orderStatus === "Delivered") {
        order.items.forEach((item: any) => {
          const prodId = item.productId?._id || item.productId;
          if (map[prodId]) {
            const qty = Number(item.quantity) || 0;
            const price = item.productId?.price || map[prodId].price || 0;
            map[prodId].revenue += qty * price;
            map[prodId].soldQty += qty;
            map[prodId].orderCount += 1;
          }
        });
      }
    });

    return Object.values(map);
  }, [myProducts, allOrders]);

  // ─── Summary stats ────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalRevenue = earningsData.reduce((s, p) => s + p.revenue, 0);
    const totalSold    = earningsData.reduce((s, p) => s + p.soldQty, 0);
    const topProduct   = [...earningsData].sort((a, b) => b.revenue - a.revenue)[0];
    const deliveredOrders = allOrders.filter((o) => o.orderStatus === "Delivered").length;
    return { totalRevenue, totalSold, topProduct, deliveredOrders };
  }, [earningsData, allOrders]);

  // ─── Category breakdown ───────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const cats: { [key: string]: number } = {};
    earningsData.forEach((p) => {
      cats[p.category] = (cats[p.category] || 0) + p.revenue;
    });
    return Object.entries(cats)
      .map(([cat, rev]) => ({ category: cat, revenue: rev }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [earningsData]);

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const base = activeFilter === "all"
      ? earningsData
      : earningsData.filter((p) => p.category === activeFilter);
    return [...base].sort((a, b) => b.revenue - a.revenue);
  }, [earningsData, activeFilter]);

  const filters = ["all", "vegetables", "fruits", "grains", "spices"];

  const formatMoney = (n: number) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000
      ? `₹${(n / 1000).toFixed(1)}k`
      : `₹${n.toFixed(0)}`;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );

  const maxRevenue = Math.max(...filteredData.map((p) => p.revenue), 1);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Kamai ka Hisaab</Text>
          <Text style={styles.headerSub}>Product-wise earnings breakdown</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="wallet" size={16} color="#fff" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#10B981"]} />
        }
      >

        {/* ── Hero Total Earnings Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Kul Kamai</Text>
              <Text style={styles.heroAmount}>{formatMoney(summary.totalRevenue)}</Text>
              <Text style={styles.heroSub}>From {summary.deliveredOrders} delivered orders</Text>
            </View>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="cash-multiple" size={32} color="#10B981" />
            </View>
          </View>

          {/* mini stats row */}
          <View style={styles.miniRow}>
            <View style={styles.miniItem}>
              <Text style={styles.miniVal}>{summary.totalSold}</Text>
              <Text style={styles.miniLab}>Kg Becha</Text>
            </View>
            <View style={styles.miniDivider} />
            <View style={styles.miniItem}>
              <Text style={styles.miniVal}>{earningsData.filter(p => p.revenue > 0).length}</Text>
              <Text style={styles.miniLab}>Active Crops</Text>
            </View>
            <View style={styles.miniDivider} />
            <View style={styles.miniItem}>
              <Text style={styles.miniVal}>{earningsData.length}</Text>
              <Text style={styles.miniLab}>Total Listed</Text>
            </View>
          </View>
        </View>

        {/* ── Top Performer ── */}
        {summary.topProduct && summary.topProduct.revenue > 0 && (
          <View style={styles.topCard}>
            <View style={styles.topBadge}>
              <Ionicons name="trophy" size={13} color="#F59E0B" />
              <Text style={styles.topBadgeText}>Top Performer</Text>
            </View>
            <View style={styles.topContent}>
              <Image source={{ uri: summary.topProduct.image }} style={styles.topImg} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.topName}>{summary.topProduct.name}</Text>
                <Text style={styles.topCat}>{summary.topProduct.category}</Text>
                <Text style={styles.topRev}>{formatMoney(summary.topProduct.revenue)}</Text>
              </View>
              <View style={styles.topSoldBox}>
                <Text style={styles.topSoldVal}>{summary.topProduct.soldQty}</Text>
                <Text style={styles.topSoldLab}>kg sold</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Category Breakdown ── */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Category-wise Kamai</Text>
            {categoryBreakdown.map((c) => {
              const clr = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.vegetables;
              const pct = summary.totalRevenue > 0 ? (c.revenue / summary.totalRevenue) * 100 : 0;
              return (
                <View key={c.category} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: clr.text }]} />
                  <Text style={styles.catName}>{c.category.charAt(0).toUpperCase() + c.category.slice(1)}</Text>
                  <View style={styles.catBarOuter}>
                    <View style={[styles.catBarInner, { width: `${pct}%`, backgroundColor: clr.text }]} />
                  </View>
                  <Text style={[styles.catAmt, { color: clr.text }]}>{formatMoney(c.revenue)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Filter Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Product Cards ── */}
        <Text style={styles.listHeader}>
          {filteredData.length} crop{filteredData.length !== 1 ? "s" : ""}
        </Text>

        {filteredData.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="sprout-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Is category mein koi crop nahi hai</Text>
          </View>
        ) : (
          filteredData.map((item, index) => {
            const clr = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.vegetables;
            const barPct = (item.revenue / maxRevenue) * 100;
            const rank = index + 1;
            return (
              <View key={item.id} style={[styles.productCard, { borderLeftColor: clr.text }]}>
                {/* rank badge */}
                <View style={[styles.rankBadge, { backgroundColor: rank <= 3 ? clr.badge : "#F8FAFC" }]}>
                  <Text style={[styles.rankText, { color: rank <= 3 ? clr.text : "#94A3B8" }]}>
                    {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : `#${rank}`}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Image source={{ uri: item.image }} style={styles.cardImg} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                      <View style={[styles.catChip, { backgroundColor: clr.badge }]}>
                        <Ionicons name={CATEGORY_ICONS[item.category]} size={10} color={clr.text} />
                        <Text style={[styles.catChipText, { color: clr.text }]}>
                          {item.category}
                        </Text>
                      </View>
                      <Text style={styles.priceText}>₹{item.price}/kg</Text>
                    </View>
                    <View style={styles.revenueBox}>
                      <Text style={[styles.revenueAmt, { color: item.revenue > 0 ? "#10B981" : "#94A3B8" }]}>
                        {formatMoney(item.revenue)}
                      </Text>
                      <Text style={styles.revenueLabel}>earned</Text>
                    </View>
                  </View>

                  {/* progress bar */}
                  <View style={styles.progressOuter}>
                    <View
                      style={[
                        styles.progressInner,
                        {
                          width: `${barPct}%`,
                          backgroundColor: item.revenue > 0 ? clr.text : "#E5E7EB",
                        },
                      ]}
                    />
                  </View>

                  {/* bottom stats */}
                  <View style={styles.cardStats}>
                    <View style={styles.statChip}>
                      <Ionicons name="scale-outline" size={11} color="#64748B" />
                      <Text style={styles.statChipText}>{item.soldQty} kg sold</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Ionicons name="receipt-outline" size={11} color="#64748B" />
                      <Text style={styles.statChipText}>{item.orderCount} orders</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Ionicons name="archive-outline" size={11} color="#64748B" />
                      <Text style={[styles.statChipText, item.remainingStock <= 0 && { color: "#EF4444" }]}>
                        {item.remainingStock.toFixed(1)} left
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight + 10 : 40) : 10,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 15,
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 11, color: "#D1FAE5", fontWeight: "600", marginTop: 1 },
  headerBadge: { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },

  scroll: { padding: 20, paddingTop: 18 },

  // Hero Card
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  heroLabel: { fontSize: 13, color: "#64748B", fontWeight: "700" },
  heroAmount: { fontSize: 40, fontWeight: "900", color: "#1F2937", marginTop: 2 },
  heroSub: { fontSize: 12, color: "#94A3B8", fontWeight: "600", marginTop: 4 },
  heroIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center" },
  miniRow: { flexDirection: "row", backgroundColor: "#F8FAFC", borderRadius: 18, padding: 14 },
  miniItem: { flex: 1, alignItems: "center" },
  miniVal: { fontSize: 18, fontWeight: "900", color: "#1F2937" },
  miniLab: { fontSize: 10, color: "#94A3B8", fontWeight: "700", marginTop: 2 },
  miniDivider: { width: 1, backgroundColor: "#E2E8F0", marginHorizontal: 8 },

  // Top Card
  topCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    elevation: 4,
  },
  topBadge: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 5 },
  topBadgeText: { fontSize: 12, fontWeight: "800", color: "#F59E0B" },
  topContent: { flexDirection: "row", alignItems: "center" },
  topImg: { width: 60, height: 60, borderRadius: 16 },
  topName: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
  topCat: { fontSize: 11, color: "#94A3B8", fontWeight: "700", marginTop: 2, textTransform: "capitalize" },
  topRev: { fontSize: 20, fontWeight: "900", color: "#10B981", marginTop: 4 },
  topSoldBox: { alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 10, minWidth: 60 },
  topSoldVal: { fontSize: 20, fontWeight: "900", color: "#1F2937" },
  topSoldLab: { fontSize: 10, color: "#94A3B8", fontWeight: "700" },

  // Category Breakdown
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionTitle: { fontSize: 15, fontWeight: "900", color: "#1E293B", marginBottom: 16 },
  catRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  catName: { width: 80, fontSize: 12, fontWeight: "700", color: "#374151" },
  catBarOuter: { flex: 1, height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, marginHorizontal: 10, overflow: "hidden" },
  catBarInner: { height: "100%", borderRadius: 4 },
  catAmt: { width: 50, fontSize: 12, fontWeight: "800", textAlign: "right" },

  // Filter pills
  filterRow: { paddingBottom: 4, gap: 8, marginBottom: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E2E8F0" },
  filterPillActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  filterText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  filterTextActive: { color: "#fff" },

  listHeader: { fontSize: 13, fontWeight: "700", color: "#94A3B8", marginBottom: 12 },

  // Product Card
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    marginBottom: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderLeftWidth: 4,
    overflow: "hidden",
  },
  rankBadge: { paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start", borderBottomRightRadius: 14 },
  rankText: { fontSize: 13, fontWeight: "800" },
  cardBody: { padding: 14, paddingTop: 8 },
  cardTop: { flexDirection: "row", alignItems: "center" },
  cardImg: { width: 56, height: 56, borderRadius: 14 },
  cardName: { fontSize: 15, fontWeight: "900", color: "#1F2937" },
  catChip: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, gap: 3 },
  catChipText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  priceText: { fontSize: 11, color: "#94A3B8", fontWeight: "600", marginTop: 3 },
  revenueBox: { alignItems: "flex-end" },
  revenueAmt: { fontSize: 20, fontWeight: "900" },
  revenueLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "700" },
  progressOuter: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, marginTop: 12, marginBottom: 10, overflow: "hidden" },
  progressInner: { height: "100%", borderRadius: 3 },
  cardStats: { flexDirection: "row", gap: 8 },
  statChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statChipText: { fontSize: 10, fontWeight: "700", color: "#64748B" },

  // Empty
  empty: { alignItems: "center", paddingVertical: 50 },
  emptyText: { color: "#94A3B8", fontSize: 14, fontWeight: "700", marginTop: 12 },
});
