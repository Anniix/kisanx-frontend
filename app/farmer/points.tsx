// app/farmer/points.tsx
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FarmerPointsDetails() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.title}>Farmer Rewards Program</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rewardCard}>
          <FontAwesome5 name="seedling" size={50} color="#10B981" />
          <Text style={styles.rewardTitle}>Earn as you Grow!</Text>
          <Text style={styles.rewardDesc}>Aapko har successfully delivered order par 10 points milenge. 🌾</Text>
        </View>

        <Text style={styles.sectionTitle}>Farmer Benefits</Text>
        
        <BenefitItem icon="trending-up" title="100 Points" desc="Aapke crops ko search mein 'Top Priority' milegi." />
        <BenefitItem icon="shield-checkmark" title="500 Points" desc="Verify Farmer Badge aur 0% platform commission." />
        <BenefitItem icon="rocket" title="1000 Points" desc="Next payout par 1.5x bonus payment receive karein! 💰" />
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