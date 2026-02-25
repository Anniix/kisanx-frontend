import { View, Text, StyleSheet, ActivityIndicator, Animated, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { getToken, getLoggedInUser } from "../utils/auth"; 
import { Ionicons } from "@expo/vector-icons";

export default function AppEntry() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();

    const checkLogin = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      const token = await getToken(); 
      const user = await getLoggedInUser(); 

      // ✨ UPDATED: Strict role-based routing from token data
      if (token && user && user.role) {
        if (user.role === "farmer") {
          router.replace("/farmer/dashboard"); 
        } else if (user.role === "customer") {
          router.replace("/customer/(tabs)"); 
        } else {
          setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    };
    checkLogin();
  }, []);

  if (checkingAuth) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.splashIconCircle}>
            <Image source={require("../assets/images/logo.png")} style={styles.logoImage} resizeMode="cover" />
          </View>
        </Animated.View>
        <Text style={styles.splashTitle}>KisanX</Text>
        <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 25 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Image source={require("../assets/images/logo.png")} style={styles.logoImage} resizeMode="cover" />
        </View>
        <Text style={styles.title}>KisanX</Text>
        <Text style={styles.tagline}>Freshness delivered from farm to fork</Text>
      </View>

      <View style={styles.glassCard}>
        <Text style={styles.subtitle}>Choose your role to continue</Text>
        <TouchableOpacity style={styles.farmerBtn} onPress={() => router.push("/auth/login?role=farmer")}>
          <Ionicons name="bus" size={24} color="#fff" />
          <Text style={styles.btnText}>I am a Farmer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.customerBtn} onPress={() => router.push("/auth/login?role=customer")}>
          <Ionicons name="cart" size={24} color="#10B981" />
          <Text style={[styles.btnText, { color: '#10B981' }]}>I am a Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center" },
  splashIconCircle: { width: 140, height: 140, backgroundColor: "#fff", borderRadius: 70, elevation: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  splashTitle: { marginTop: 20, fontSize: 28, fontWeight: "900", color: "#064E3B" },
  container: { flex: 1, backgroundColor: "#ECFDF5", justifyContent: "center", padding: 25 },
  logoContainer: { alignItems: "center", marginBottom: 50 },
  iconCircle: { width: 120, height: 120, backgroundColor: "#fff", borderRadius: 60, elevation: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 42, fontWeight: "900", color: "#064E3B" },
  tagline: { fontSize: 16, color: "#059669", fontWeight: "500" },
  glassCard: { backgroundColor: "rgba(255, 255, 255, 0.8)", borderRadius: 30, padding: 25, elevation: 5 },
  subtitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 25 },
  farmerBtn: { backgroundColor: "#10B981", paddingVertical: 18, paddingHorizontal: 20, borderRadius: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 15 },
  customerBtn: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#10B981", paddingVertical: 18, paddingHorizontal: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" }
});