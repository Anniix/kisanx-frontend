import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { 
  ActivityIndicator, 
  Alert, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { saveToken } from "../../utils/auth";
import { API_URL } from "../../utils/api";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const { role: selectedRole } = useLocalSearchParams<{ role: "farmer" | "customer" }>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Try-catch wrap kiya taaki Firebase error pe app crash na kare
  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) return null;
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') return null;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
        });
      }

      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId || 
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('Project ID nahi mila, skip kar raha hoon');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push Token:', token);
      return token;

    } catch (error) {
      // ✅ Error aaye toh login rok nahi — sirf log karo
      console.log('Push notification setup failed (login continue karega):', error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Missing Info", "Please fill all fields");
    
    setLoading(true);
    try {
      const pushToken = await registerForPushNotificationsAsync();

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password,
          pushToken: pushToken || "" // ✅ null ki jagah empty string
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      if (data.user.role !== selectedRole) {
        throw new Error(`This account is registered as a ${data.user.role}. Please login with the correct role.`);
      }

      await saveToken(data.token);
      
      if (data.user.role === "farmer") {
        router.replace("/farmer/dashboard");
      } else {
        router.replace("/customer/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1, backgroundColor: "#F0FDF4" }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.replace("/")}>
          <Ionicons name="arrow-back" size={24} color="#064E3B" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.emoji}>{selectedRole === "farmer" ? "🌾" : "🛒"}</Text>
          <Text style={styles.title}>Login as {selectedRole === "farmer" ? "Farmer" : "Customer"}</Text>
          <Text style={styles.subtitle}>Welcome back to KisanX</Text>

          <View style={styles.inputGroup}>
            <TextInput 
              placeholder="Email" 
              placeholderTextColor="#64748B"
              value={email} 
              onChangeText={setEmail} 
              style={styles.input} 
              autoCapitalize="none" 
            />
            <TextInput 
              placeholder="Password" 
              placeholderTextColor="#64748B"
              value={password} 
              onChangeText={setPassword} 
              style={styles.input} 
              secureTextEntry 
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/auth/forgot-password" as any)}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push(`/auth/register?role=${selectedRole}`)}>
            <Text style={styles.link}>
              New here? <Text style={{ fontWeight: 'bold' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: width * 0.06 },
  back: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  card: { backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 10 },
  emoji: { fontSize: 50, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: width * 0.06, fontWeight: '800', textAlign: 'center', color: '#064E3B' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#64748B', marginBottom: 25 },
  inputGroup: { gap: 15 },
  input: { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 15, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', color: '#333' },
  button: { backgroundColor: '#10B981', padding: 18, borderRadius: 15, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  forgotText: { color: '#10B981', marginTop: 15, textAlign: 'center', fontSize: 14, fontWeight: '600' },
  link: { color: '#10B981', marginTop: 15, textAlign: 'center', fontSize: 14 }
});