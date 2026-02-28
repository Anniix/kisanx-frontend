import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, 
  TouchableOpacity, SafeAreaView, Dimensions, Platform, StatusBar 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { API_URL } from "../../../utils/api";
import { getToken } from "../../../utils/auth";

const { width } = Dimensions.get("window");
const STATUS_STEPS = ["Pending", "Placed", "Dispatched", "In-Transit", "Delivered"];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchStatus = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/orders/track/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTracking(data);
      }
    } catch (err) {
      console.error("Tracking fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;

  const isCancelled = tracking?.status === "Cancelled";
  const currentStep = STATUS_STEPS.indexOf(tracking?.status || "Pending");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Your Order</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.idLabel}>Order ID</Text>
          <Text style={styles.idValue}>#{tracking?.trackingId || id?.toString().slice(-8).toUpperCase()}</Text>

          {isCancelled ? (
            /* ✨ CANCELLED UI SECTION */
            <View style={styles.cancelledContainer}>
              <View style={styles.cancelledIconBox}>
                <MaterialCommunityIcons name="order-bool-ascending-variant" size={50} color="#EF4444" />
                <View style={styles.cancelCross}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </View>
              </View>
              <Text style={styles.cancelledTitle}>Order Cancelled</Text>
              <Text style={styles.cancelledSubText}>This order was cancelled and will not be delivered.</Text>
            </View>
          ) : (
            /* NORMAL STEPPER UI */
            <View style={styles.stepperContainer}>
              {STATUS_STEPS.map((step, index) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.iconCol}>
                    <View style={[styles.dot, index <= currentStep && styles.activeDot]} />
                    {index < STATUS_STEPS.length - 1 && (
                      <View style={[styles.line, index < currentStep && styles.activeLine]} />
                    )}
                  </View>
                  <View style={styles.textCol}>
                    <Text style={[styles.stepText, index <= currentStep && styles.activeText]}>{step}</Text>
                    {index === currentStep && (
                      <Text style={styles.subText}>
                        {step === "Delivered" ? "Order Delivered! 🎉" : "In Progress..."}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="location-sharp" size={20} color={isCancelled ? "#94A3B8" : "#10B981"} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Delivery Address</Text>
            <Text style={[styles.infoText, isCancelled && { color: "#94A3B8" }]}>
              {tracking?.address || "Address details not found"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 20 : 45, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginLeft: 15 },
  container: { padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 25, padding: 25, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  idLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  idValue: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 25 },
  
  // Cancelled Specific Styles
  cancelledContainer: { alignItems: 'center', paddingVertical: 20 },
  cancelledIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cancelCross: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#fff', borderRadius: 12 },
  cancelledTitle: { fontSize: 20, fontWeight: '900', color: '#EF4444' },
  cancelledSubText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 18 },

  stepperContainer: { paddingLeft: 5 },
  stepRow: { flexDirection: 'row', minHeight: 70 },
  iconCol: { alignItems: 'center', marginRight: 15 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#E2E8F0" },
  activeDot: { backgroundColor: "#10B981", borderWidth: 2, borderColor: "#D1FAE5" },
  line: { width: 2, flex: 1, backgroundColor: "#E2E8F0" },
  activeLine: { backgroundColor: "#10B981" },
  textCol: { flex: 1 },
  stepText: { fontSize: 15, fontWeight: "700", color: "#94A3B8" },
  activeText: { color: "#1E293B" },
  subText: { fontSize: 11, color: "#10B981", fontWeight: "600", marginTop: 2 },
  infoCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginTop: 20, alignItems: 'center', elevation: 2 },
  infoContent: { marginLeft: 15, flex: 1 },
  infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  infoText: { fontSize: 14, color: '#1E293B', marginTop: 2 }
});