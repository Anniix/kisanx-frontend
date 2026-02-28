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
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveToken } from "../../utils/auth";
import { API_URL } from "../../utils/api";

const { width } = Dimensions.get("window");
const API_BASE = `${API_URL}/auth`;

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState<"farmer" | "customer">("customer");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
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
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "", farmName: "",
    location: "", address: "",
  });

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
      if (res.ok) { 
        setOtpSent(true); 
        Alert.alert("OTP Sent", "Code sent to email."); 
      } else { 
        const data = await res.json(); 
        Alert.alert("Error", data.message || "Failed to send OTP"); 
      }
    } catch (err) { 
      Alert.alert("Error", "Server connection failed."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) return Alert.alert("Error", "Enter 6-digit OTP");
    try {
      const res = await fetch(`${API_BASE}/verify-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();
      if (data.success) { 
        setIsVerified(true); 
        Alert.alert("Success", "Email verified!"); 
      } else { 
        Alert.alert("Wrong OTP", data.message || "Check and try again."); 
      }
    } catch (err) { 
      Alert.alert("Error", "Failed to verify."); 
    }
  };

  const handleRegister = async () => {
    if (!isVerified) return Alert.alert("Required", "Please verify email first.");

    if (!form.firstName || !form.lastName || !form.phone || !form.password) {
      return Alert.alert("Error", "Please fill all required fields.");
    }

    if (form.password !== form.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role, isVerified: true }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // ✨ UPDATED: Ab generic message nahi, asli vajah dikhayega
        return Alert.alert("Registration Error", data.message || "Failed to create account");
      }

      if (data.token) {
        await saveToken(data.token);
        Alert.alert("Success", "Account created successfully!");
        router.replace(role === "farmer" ? "/farmer/dashboard" : "/customer/(tabs)");
      }
    } catch (err) { 
      Alert.alert("Error", "Network error. Please check your connection."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%' }}>
            
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Image source={require("../../assets/images/logo.png")} style={styles.logoImg} />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.headerSection}>
                <Text style={styles.title}>Join KisanX</Text>
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
                
                <View style={[styles.inputWrapper, focusedField === "email" && styles.focusedInput]}>
                  <Ionicons name="mail" size={20} color={focusedField === "email" ? "#10B981" : "#94A3B8"} style={styles.icon} />
                  <TextInput 
                    placeholder="Email Address" 
                    placeholderTextColor="#94A3B8"
                    style={styles.input} 
                    editable={!isVerified} 
                    onChangeText={(t)=>update("email",t)} 
                    autoCapitalize="none"
                  />
                  {!isVerified && (
                    <TouchableOpacity style={styles.verifyBtn} onPress={handleSendOTP} disabled={loading}>
                      <Text style={styles.verifyBtnText}>{otpSent ? "Resend" : "Get OTP"}</Text>
                    </TouchableOpacity>
                  )}
                  {isVerified && <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{marginRight: 10}} />}
                </View>

                {otpSent && !isVerified && (
                  <View style={[styles.inputWrapper, {borderColor: '#10B981'}]}>
                    <Ionicons name="keypad" size={20} color="#10B981" style={styles.icon} />
                    <TextInput placeholder="Enter OTP" style={styles.input} keyboardType="numeric" onChangeText={setOtp} maxLength={6} />
                    <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOTP}><Text style={styles.verifyBtnText}>Verify</Text></TouchableOpacity>
                  </View>
                )}

                <Input icon="call" placeholder="Phone Number" fieldName="phone" onFocus={setFocusedField} focusedField={focusedField} keyboardType="numeric" onChange={(t:any)=>update("phone",t)} />
                <Input icon="lock-closed" placeholder="Password" fieldName="password" onFocus={setFocusedField} focusedField={focusedField} secure onChange={(t:any)=>update("password",t)} />
                <Input icon="shield-checkmark" placeholder="Confirm Password" fieldName="confirmPassword" onFocus={setFocusedField} focusedField={focusedField} secure onChange={(t:any)=>update("confirmPassword",t)} />
                
                {role === "farmer" ? (
                  <>
                    <Input icon="business" placeholder="Farm Name" fieldName="farmName" onFocus={setFocusedField} focusedField={focusedField} onChange={(t:any)=>update("farmName",t)} />
                    <Input icon="location" placeholder="Location" fieldName="location" onFocus={setFocusedField} focusedField={focusedField} onChange={(t:any)=>update("location",t)} />
                  </>
                ) : (
                  <Input icon="home" placeholder="Address" fieldName="address" onFocus={setFocusedField} focusedField={focusedField} onChange={(t:any)=>update("address",t)} />
                )}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const Input = ({ icon, placeholder, secure, onChange, keyboardType, fieldName, onFocus, focusedField }: any) => (
  <View style={[styles.inputWrapper, focusedField === fieldName && styles.focusedInput]}>
    <Ionicons name={icon} size={20} color={focusedField === fieldName ? "#10B981" : "#94A3B8"} style={styles.icon} />
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
  mainContainer: { flex: 1, backgroundColor: "#F0FDF4" },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1, paddingTop: 60 },
  logoWrapper: { alignItems: 'center', marginBottom: 20 },
  logoCircle: { width: 90, height: 90, backgroundColor: "#fff", borderRadius: 45, elevation: 10, justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: 60, height: 60 },
  card: { backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 10 },
  headerSection: { marginBottom: 25, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#064E3B" },
  roleContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleCard: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  activeRole: { backgroundColor: "#10B981", borderColor: '#10B981' },
  roleText: { fontWeight: "700", color: "#10B981" },
  activeRoleText: { color: "#fff" },
  formContainer: { gap: 12 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: '#F8FAFC', borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0', minHeight: 55 },
  focusedInput: { borderColor: '#10B981' },
  icon: { marginLeft: 15 },
  input: { flex: 1, paddingHorizontal: 15, fontSize: 15, color: '#333' },
  verifyBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 10 },
  verifyBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  submitBtn: { backgroundColor: "#10B981", padding: 18, borderRadius: 15, marginTop: 20, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});