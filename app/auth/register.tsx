import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveToken } from "../../utils/auth";
import { API_URL } from "../../utils/api";

const API_BASE = `${API_URL}/auth`;

type Role = "farmer" | "customer";

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("customer");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otp, setOtp] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, useNativeDriver: true })
    ]).start();
  }, []);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    farmName: "",
    location: "",
    address: "",
  });

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 📧 Logic to Send OTP
  const handleSendOTP = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return Alert.alert("Error", "Please enter a valid email.");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/send-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        Alert.alert("OTP Sent", "Verification code sent to your email.");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logic to Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length < 6) return Alert.alert("Error", "Enter 6-digit OTP.");
    try {
      const res = await fetch(`${API_BASE}/verify-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
        Alert.alert("Success", "Email verified successfully! ✅");
      } else {
        Alert.alert("Wrong OTP", "Aapne galat OTP dala hai.");
      }
    } catch (err) {
      Alert.alert("Error", "Verification failed.");
    }
  };

  const handleRegister = async () => {
    if (!isVerified) return Alert.alert("Required", "Please verify your email first.");
    if (!form.firstName || !form.password) return Alert.alert("Required", "Fill all fields.");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(form.password)) {
      return Alert.alert("Weak Password", "Use 8+ characters with uppercase, a number, and a symbol.");
    }

    if (form.password !== form.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    setLoading(true);
    try {
      const payload: any = { ...form, role, isVerified: true };
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) return Alert.alert("Error", data.message);

      if (data.token) await saveToken(data.token);
      
      Alert.alert("Success 🎉", "Account ready!", [
        { text: "Go", onPress: () => router.replace(role === "farmer" ? "/farmer/dashboard" : "/customer/(tabs)") }
      ]);
    } catch (err) {
      Alert.alert("Error", "Server failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Image source={require("../../assets/images/logo.png")} style={styles.logoImg} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Join KisanX</Text>
              <Text style={styles.subtitle}>Fresh farm products at your doorstep</Text>
            </View>

            <View style={styles.roleContainer}>
              <TouchableOpacity style={[styles.roleCard, role === "customer" && styles.activeRole]} onPress={() => setRole("customer")}>
                <Ionicons name="cart" size={18} color={role === "customer" ? "#fff" : "#10B981"} />
                <Text style={[styles.roleText, role === "customer" && styles.activeRoleText]}>Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleCard, role === "farmer" && styles.activeRole]} onPress={() => setRole("farmer")}>
                <Ionicons name="bus" size={18} color={role === "farmer" ? "#fff" : "#10B981"} />
                <Text style={[styles.roleText, role === "farmer" && styles.activeRoleText]}>Farmer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Input icon="person" placeholder="First Name" fieldName="firstName" onFocus={setFocusedField} focusedField={focusedField} onChange={(t:any)=>update("firstName",t)} />
              <Input icon="person" placeholder="Last Name" fieldName="lastName" onFocus={setFocusedField} focusedField={focusedField} onChange={(t:any)=>update("lastName",t)} />
              
              {/* ✨ EMAIL FIELD WITH VERIFICATION ACTION */}
              <View style={[styles.inputWrapper, focusedField === "email" && styles.focusedInput]}>
                {focusedField === "email" && <Ionicons name="mail" size={20} color="#10B981" style={styles.icon} />}
                <TextInput 
                  placeholder="Email Address" 
                  style={styles.input} 
                  editable={!isVerified} 
                  onFocus={()=>setFocusedField("email")} 
                  onBlur={()=>setFocusedField(null)}
                  onChangeText={(t)=>update("email",t)} 
                />
                {isVerified ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{marginRight: 15}} />
                ) : (
                  <TouchableOpacity style={styles.verifyBtn} onPress={handleSendOTP} disabled={loading}>
                    <Text style={styles.verifyBtnText}>{otpSent ? "Resend" : "Get OTP"}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ✨ OTP INPUT BOX (Appears after Get OTP) */}
              {otpSent && !isVerified && (
                <View style={[styles.inputWrapper, {borderColor: '#10B981'}]}>
                  <TextInput 
                    placeholder="Enter 6-digit OTP" 
                    style={styles.input} 
                    keyboardType="numeric" 
                    onChangeText={setOtp} 
                  />
                  <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOTP}>
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Input icon="call" placeholder="Phone Number" fieldName="phone" onFocus={setFocusedField} focusedField={focusedField} keyboardType="numeric" onChange={(t:any)=>update("phone",t)} />
              <Input icon="lock-closed" placeholder="Password" fieldName="password" onFocus={setFocusedField} focusedField={focusedField} secure onChange={(t:any)=>update("password",t)} />
              <Input icon="shield-checkmark" placeholder="Confirm Password" fieldName="confirmPassword" onFocus={setFocusedField} focusedField={focusedField} secure onChange={(t:any)=>update("confirmPassword",t)} />

              {role === "farmer" ? (
                <>
                  <Input icon="business" placeholder="Farm Name" fieldName="farmName" onFocus={setFocusedField} focusedField={focusedField} onChange={(t:any)=>update("farmName",t)} />
                  <Input icon="location" placeholder="Farm Location" fieldName="location" onFocus={setFocusedField} focusedField={focusedField} onChange={(t:any)=>update("location",t)} />
                </>
              ) : (
                <Input icon="home" placeholder="Delivery Address" fieldName="address" onFocus={setFocusedField} focusedField={focusedField} onChange={(t:any)=>update("address",t)} />
              )}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.footerLink}>
              <Text style={styles.footerText}>Already have an account? <Text style={styles.loginText}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Input = ({ icon, placeholder, secure, onChange, keyboardType, fieldName, onFocus, focusedField }: any) => (
  <View style={[styles.inputWrapper, focusedField === fieldName && styles.focusedInput]}>
    {focusedField === fieldName && <Ionicons name={icon} size={20} color="#10B981" style={styles.icon} />}
    <TextInput
      placeholder={placeholder}
      secureTextEntry={secure}
      style={styles.input}
      onChangeText={onChange}
      onFocus={() => onFocus(fieldName)}
      onBlur={() => onFocus(null)}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      autoCapitalize="none"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FDF4" },
  scrollContainer: { padding: 25, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' },
  logoWrapper: { alignItems: 'center', marginBottom: 20 },
  logoCircle: { width: 90, height: 90, backgroundColor: "#fff", borderRadius: 45, elevation: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: '100%', height: '100%' },
  card: { backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 10 },
  headerSection: { marginBottom: 25, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#064E3B" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 5, textAlign: 'center' },
  roleContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleCard: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', gap: 8 },
  activeRole: { backgroundColor: "#10B981", borderColor: '#10B981' },
  roleText: { fontWeight: "700", color: "#10B981", fontSize: 14 },
  activeRoleText: { color: "#fff" },
  formContainer: { gap: 12 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: '#F8FAFC', borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  focusedInput: { borderColor: '#10B981', backgroundColor: '#fff' },
  icon: { marginLeft: 15 },
  input: { flex: 1, padding: 16, fontSize: 15, color: '#333' },
  verifyBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 10 },
  verifyBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  submitBtn: { backgroundColor: "#10B981", padding: 18, borderRadius: 15, marginTop: 20, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  footerLink: { marginTop: 20, alignItems: "center" },
  footerText: { color: "#64748B", fontSize: 14 },
  loginText: { color: "#10B981", fontWeight: 'bold' },
});