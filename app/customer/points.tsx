// app/customer/points.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PointsDetails() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.title}>KisanX Rewards</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rewardCard}>
          <MaterialCommunityIcons name="medal" size={50} color="#F59E0B" />
          <Text style={styles.rewardTitle}>How to earn points?</Text>
          <Text style={styles.rewardDesc}>Earn 10 points for every successfully delivered order! 🍎</Text>
        </View>

        <Text style={styles.sectionTitle}>Unlock Benefits</Text>
        
        <BenefitItem icon="gift" title="100 Points" desc="Get a 5% discount on your next order." />
        <BenefitItem icon="truck-delivery" title="500 Points" desc="Free Delivery for 1 month." />
        <BenefitItem icon="star" title="1000 Points" desc="Get ₹500 shopping credit for FREE! 🎁" />
      </ScrollView>
    </SafeAreaView>
  );
}

const BenefitItem = ({ icon, title, desc }: any) => (
  <View style={styles.benefitItem}>
    <View style={styles.iconCircle}><Ionicons name={icon} size={24} color="#10B981" /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 15, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "900" },
  content: { padding: 20 },
  rewardCard: { backgroundColor: "#fff", padding: 25, borderRadius: 25, alignItems: "center", elevation: 5, marginBottom: 30 },
  rewardTitle: { fontSize: 18, fontWeight: "800", marginTop: 15 },
  rewardDesc: { textAlign: "center", color: "#64748B", marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
  benefitItem: { flexDirection: "row", backgroundColor: "#fff", padding: 15, borderRadius: 20, marginBottom: 10, alignItems: "center", gap: 15 },
  iconCircle: { width: 45, height: 45, borderRadius: 22, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center" },
  benefitTitle: { fontSize: 16, fontWeight: "700" },
  benefitDesc: { fontSize: 13, color: "#64748B" }
});