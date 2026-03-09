import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../utils/api";

const { width } = Dimensions.get("window");

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<"email" | "phone">("email"); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle state

  const [form, setForm] = useState({
    identifier: "", 
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSendOTP = async () => {
    if (!form.identifier) return Alert.alert("Required", `Enter ${method}`);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: form.identifier.toLowerCase().trim(), method })
      });
      if (res.ok) { setStep(2); Alert.alert("OTP Sent", "Check your " + method); }
      else { const data = await res.json(); Alert.alert("Error", data.message); }
    } catch (err) { Alert.alert("Error", "Failed"); } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!form.otp || !form.newPassword) return Alert.alert("Required", "Fill all fields");
    if (form.newPassword !== form.confirmPassword) return Alert.alert("Error", "No match");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: form.identifier.toLowerCase().trim(), otp: form.otp, newPassword: form.newPassword })
      });
      if (res.ok) Alert.alert("Success", "Password updated!", [{ text: "Login", onPress: () => router.replace("/auth/login") }]);
      else Alert.alert("Error", "Invalid OTP");
    } catch (err) { Alert.alert("Error", "Failed"); } finally { setLoading(false); }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#064E3B" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>{step === 1 ? "📩" : "🔐"}</Text>
            <Text style={styles.title}>{step === 1 ? "Forgot Password" : "New Password"}</Text>
          </View>

          <View style={styles.card}>
            {step === 1 ? (
              <View style={styles.inputGroup}>
                <View style={styles.tabContainer}>
                  <TouchableOpacity style={[styles.tab, method === "email" && styles.activeTab]} onPress={() => setMethod("email")}><Text style={[styles.tabText, method === "email" && styles.activeTabText]}>Email</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.tab, method === "phone" && styles.activeTab]} onPress={() => setMethod("phone")}><Text style={[styles.tabText, method === "phone" && styles.activeTabText]}>Phone</Text></TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name={method === "email" ? "mail-outline" : "call-outline"} size={20} color="#16A34A" style={styles.icon} />
                  <TextInput placeholder={method === "email" ? "Email" : "Phone"} style={styles.input} value={form.identifier} onChangeText={(t) => setForm({ ...form, identifier: t })} />
                </View>
                <TouchableOpacity style={styles.mainBtn} onPress={handleSendOTP} disabled={loading}><Text style={styles.btnText}>Send OTP</Text></TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="keypad-outline" size={20} color="#16A34A" style={styles.icon} />
                  <TextInput placeholder="6-Digit OTP" style={styles.input} keyboardType="numeric" value={form.otp} onChangeText={(t) => setForm({ ...form, otp: t })} />
                </View>
                
                {/* New Password Fields with Toggles */}
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#16A34A" style={styles.icon} />
                  <TextInput placeholder="New Password" style={styles.input} secureTextEntry={!showPassword} value={form.newPassword} onChangeText={(t) => setForm({ ...form, newPassword: t })} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 15 }}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#16A34A" style={styles.icon} />
                  <TextInput placeholder="Confirm" style={styles.input} secureTextEntry={!showPassword} value={form.confirmPassword} onChangeText={(t) => setForm({ ...form, confirmPassword: t })} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 15 }}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.mainBtn} onPress={handleResetPassword} disabled={loading}><Text style={styles.btnText}>Update</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F0FDF4" },
  scroll: { paddingHorizontal: width * 0.06, paddingBottom: 40, flexGrow: 1, justifyContent: 'center', paddingTop: 40 },
  backBtn: { position: 'absolute', top: 40, left: 20, zIndex: 10, padding: 8, backgroundColor: '#fff', borderRadius: 12 },
  header: { alignItems: 'center', marginBottom: 30 },
  emoji: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#064E3B', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#16A34A' },
  inputGroup: { gap: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 15, paddingHorizontal: 15, minHeight: 60, borderWidth: 1, borderColor: '#E2E8F0' },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1A202C' },
  mainBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 15, marginTop: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 }
});