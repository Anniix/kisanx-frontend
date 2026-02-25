import { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getToken, removeToken } from "../../../utils/auth";
import { API_URL } from "../../../utils/api";
import { useRouter, useFocusEffect } from "expo-router";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [])
  );

  const fetchUser = async () => {
    try {
      const token = await getToken();
      if (!token) return router.replace("/auth/login");

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    router.replace("/auth/login");
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: user?.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.editBadge} onPress={() => router.push("/customer/edit-profile")}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : "User"}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => router.push("/customer/orders")}>
              <Text style={styles.statValue}>{user?.orderCount || 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            {/* ✨ UPDATED: Points box is now clickable and routes to the rewards page */}
            <TouchableOpacity style={styles.statBox} onPress={() => router.push("/customer/points")}>
              <Text style={styles.statValue}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.menuSection}>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push("/customer/edit-profile")} />
          <MenuItem icon="location-outline" label="Saved Addresses" onPress={() => router.push("/customer/addresses")} />
          <MenuItem icon="receipt-outline" label="My Orders" onPress={() => router.push("/customer/orders")} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuItem = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <View style={styles.iconBox}><Ionicons name={icon} size={20} color="#16A34A" /></View>
      <Text style={styles.menuText}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", paddingVertical: 40, backgroundColor: "#fff", borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 8 },
  avatarWrapper: { position: "relative", marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: "#16A34A" },
  editBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#16A34A", padding: 6, borderRadius: 15, borderWidth: 2, borderColor: "#fff" },
  name: { fontSize: 26, fontWeight: "900", color: "#111827" },
  email: { color: "#4B5563", marginTop: 4 },
  statsRow: { flexDirection: "row", marginTop: 30, backgroundColor: "#f0fdf4", borderRadius: 25, paddingVertical: 15, paddingHorizontal: 30 },
  statBox: { alignItems: "center", paddingHorizontal: 20 },
  statDivider: { width: 1, height: 30, backgroundColor: "#D1D5DB" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#16A34A" },
  statLabel: { fontSize: 13, color: "#6B7280" },
  menuSection: { padding: 20 },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 18, marginBottom: 10, elevation: 2 },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBox: { width: 40, height: 40, backgroundColor: "#ECFDF5", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  menuText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  logoutBtn: { margin: 20, backgroundColor: "#FEE2E2", padding: 18, borderRadius: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  logoutText: { color: "#DC2626", fontWeight: "800" },
});