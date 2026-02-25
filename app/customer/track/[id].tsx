import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../../utils/api";
import { getToken } from "../../../utils/auth";

const STATUS_STEPS = ["Pending", "Placed", "Dispatched", "In-Transit", "Delivered"];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchStatus = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/orders/track/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // HTML error response aane par JSON parse na karein (Fixes "<" SyntaxError)
      if (!res.ok) {
        console.error("Tracking Error: Server returned status", res.status);
        return;
      }

      const data = await res.json();
      setTracking(data);
    } catch (err) {
      console.error("Tracking Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>
  );

  const currentStep = STATUS_STEPS.indexOf(tracking?.status || "Pending");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.idLabel}>Order ID</Text>
          <Text style={styles.idValue}>#{tracking?.trackingId || id?.toString().slice(-8).toUpperCase()}</Text>

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
                    <Text style={styles.subText}>Your package is {step.toLowerCase()}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {tracking?.address && (
          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={20} color="#10B981" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoText}>{tracking.address}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', paddingTop: 50 },
  backBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginLeft: 15 },
  container: { padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 25, padding: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  idLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  idValue: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 30 },
  stepperContainer: { paddingLeft: 5 },
  stepRow: { flexDirection: 'row', minHeight: 80 },
  iconCol: { alignItems: 'center', marginRight: 20 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#E2E8F0" },
  activeDot: { backgroundColor: "#10B981", borderWidth: 3, borderColor: "#D1FAE5" },
  line: { width: 2, flex: 1, backgroundColor: "#E2E8F0", marginVertical: 4 },
  activeLine: { backgroundColor: "#10B981" },
  textCol: { flex: 1 },
  stepText: { fontSize: 16, fontWeight: "700", color: "#94A3B8" },
  activeText: { color: "#1E293B" },
  subText: { fontSize: 12, color: "#10B981", fontWeight: "600", marginTop: 4 },
  infoCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginTop: 20, alignItems: 'center', elevation: 2 },
  infoContent: { marginLeft: 15, flex: 1 },
  infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  infoText: { fontSize: 14, color: '#1E293B', marginTop: 2 }
});