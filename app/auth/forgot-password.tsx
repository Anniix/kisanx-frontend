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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../utils/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Input, 2: OTP & Reset
  const [method, setMethod] = useState<"email" | "phone">("email"); 
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    identifier: "", 
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 1. OTP Bhejne ka logic (Email/Phone)
  const handleSendOTP = async () => {
    if (!form.identifier) {
      return Alert.alert("Required", `Please enter your ${method}`);
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contact: form.identifier.toLowerCase().trim(),
          method: method 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(2);
        Alert.alert("OTP Sent 📲", `OTP has been sent to your ${method}.`);
      } else {
        Alert.alert("Error", data.message || "User not found.");
      }
    } catch (err) {
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Password Reset logic (Strict Validation)
  const handleResetPassword = async () => {
    if (!form.otp || !form.newPassword) {
      return Alert.alert("Required", "Please fill all fields");
    }
    if (form.newPassword !== form.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: form.identifier.toLowerCase().trim(),
          otp: form.otp,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success 🎉", "Password updated successfully!", [
          { text: "Login Now", onPress: () => router.replace("/auth/login") }
        ]);
      } else {
        // ✨ Invalid OTP hone par password change nahi hoga
        Alert.alert("Error", data.message || "Invalid OTP");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#064E3B" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>{step === 1 ? "📲" : "🔒"}</Text>
          <Text style={styles.title}>{step === 1 ? "Forgot Password" : "New Password"}</Text>
        </View>

        <View style={styles.card}>
          {step === 1 ? (
            <View style={styles.inputGroup}>
              {/* Method Selection Tabs */}
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, method === "email" && styles.activeTab]} 
                  onPress={() => setMethod("email")}
                >
                  <Text style={[styles.tabText, method === "email" && styles.activeTabText]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, method === "phone" && styles.activeTab]} 
                  onPress={() => setMethod("phone")}
                >
                  <Text style={[styles.tabText, method === "phone" && styles.activeTabText]}>Phone</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name={method === "email" ? "mail-outline" : "call-outline"} size={20} color="#16A34A" style={styles.icon} />
                <TextInput
                  placeholder={method === "email" ? "Email Address" : "Phone Number"}
                  value={form.identifier}
                  onChangeText={(text) => setForm({ ...form, identifier: text })}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType={method === "email" ? "email-address" : "numeric"}
                />
              </View>
              <TouchableOpacity style={styles.mainBtn} onPress={handleSendOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Ionicons name="keypad-outline" size={20} color="#16A34A" style={styles.icon} />
                <TextInput
                  placeholder="6-Digit OTP"
                  value={form.otp}
                  onChangeText={(text) => setForm({ ...form, otp: text })}
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#16A34A" style={styles.icon} />
                <TextInput placeholder="New Password" value={form.newPassword} onChangeText={(text) => setForm({ ...form, newPassword: text })} style={styles.input} secureTextEntry />
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#16A34A" style={styles.icon} />
                <TextInput placeholder="Confirm Password" value={form.confirmPassword} onChangeText={(text) => setForm({ ...form, confirmPassword: text })} style={styles.input} secureTextEntry />
              </View>
              <TouchableOpacity style={styles.mainBtn} onPress={handleResetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FDF4" },
  scroll: { padding: 25, justifyContent: 'center', flexGrow: 1 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 30 },
  emoji: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#064E3B' },
  card: { backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#16A34A' },
  inputGroup: { gap: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 15, paddingHorizontal: 15, height: 60, borderWidth: 1, borderColor: '#E2E8F0' },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1A202C' },
  mainBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 15, marginTop: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 }
});