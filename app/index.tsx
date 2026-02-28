import { View, Text, StyleSheet, ActivityIndicator, Animated, Image, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { getToken, getLoggedInUser } from "../utils/auth"; 
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function AppEntry() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();

    const checkLogin = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      const token = await getToken(); 
      const user = await getLoggedInUser(); 

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
            {/* resizeMode cover se image circle ke kone tak fill ho jayegi */}
            <Image 
              source={require("../assets/images/logo.png")} 
              style={styles.logoImage} 
              resizeMode="cover" 
            />
          </View>
        </Animated.View>
        <Text style={styles.splashTitle}>KisanX</Text>
        <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 25 }} />
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer} 
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Image 
            source={require("../assets/images/logo.png")} 
            style={styles.logoImage} 
            resizeMode="cover" 
          />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center" },
  splashIconCircle: { 
    width: width * 0.35, 
    height: width * 0.35, 
    backgroundColor: "#fff", 
    borderRadius: (width * 0.35) / 2, 
    elevation: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden' // Isse image corners ke bahar nahi jayegi
  },
  logoImage: { width: '100%', height: '100%' }, // Image ko container ka pura size de diya
  splashTitle: { marginTop: 20, fontSize: 28, fontWeight: "900", color: "#064E3B" },
  
  scrollContainer: { 
    flexGrow: 1, 
    backgroundColor: "#ECFDF5", 
    justifyContent: "center", 
    padding: width * 0.08 // Dynamic padding
  },
  logoContainer: { alignItems: "center", marginBottom: height * 0.05 },
  iconCircle: { 
    width: width * 0.3, 
    height: width * 0.3, 
    backgroundColor: "#fff", 
    borderRadius: (width * 0.3) / 2, 
    elevation: 10, 
    overflow: 'hidden', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  title: { fontSize: width * 0.1, fontWeight: "900", color: "#064E3B" },
  tagline: { fontSize: 16, color: "#059669", fontWeight: "500", textAlign: 'center' },
  
  glassCard: { 
    backgroundColor: "rgba(255, 255, 255, 0.8)", 
    borderRadius: 30, 
    padding: 25, 
    elevation: 5, 
    width: '100%',
    marginBottom: 20
  },
  subtitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 25 },
  farmerBtn: { 
    backgroundColor: "#10B981", 
    paddingVertical: 18, 
    borderRadius: 20, 
    marginBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 15 
  },
  customerBtn: { 
    backgroundColor: "#fff", 
    borderWidth: 1.5, 
    borderColor: "#10B981", 
    paddingVertical: 18, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 15 
  },
  btnText: { fontSize: 18, fontWeight: "700", color: "#fff" }
});