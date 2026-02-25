import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../../utils/api";
import { getToken } from "../../utils/auth";

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", profilePic: "" });

  useEffect(() => { loadCurrentData(); }, []);

  const loadCurrentData = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          profilePic: data.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Gallery access is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.1, // ✨ Size chota rakhne ke liye quality aur kam ki hai
      base64: true,
    });

    if (!result.canceled) {
      setForm({ ...form, profilePic: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/auth/update`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success 🎉", "Profile changes saved successfully!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (err) {
      Alert.alert("Error", "Server connection failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.photoSection}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: form.profilePic }} style={styles.profileImage} />
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#16A34A" style={styles.inputIcon} />
              <TextInput style={styles.input} value={form.firstName} onChangeText={(t) => setForm({...form, firstName: t})} />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#16A34A" style={styles.inputIcon} />
              <TextInput style={styles.input} value={form.lastName} onChangeText={(t) => setForm({...form, lastName: t})} />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#16A34A" style={styles.inputIcon} />
              <TextInput style={styles.input} value={form.phone} keyboardType="numeric" onChangeText={(t) => setForm({...form, phone: t})} />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: "#fff" },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  photoSection: { alignItems: "center", marginVertical: 30 },
  imageWrapper: { position: "relative" },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: "#16A34A" },
  cameraIcon: { position: "absolute", bottom: 5, right: 5, backgroundColor: "#16A34A", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#fff" },
  photoHint: { marginTop: 12, fontSize: 14, color: "#16A34A", fontWeight: "600" },
  form: { paddingHorizontal: 25, gap: 20 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: "700", color: "#4B5563" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 15, height: 58, borderWidth: 1, borderColor: "#E5E7EB" },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#1F2937" },
  saveBtn: { margin: 30, backgroundColor: "#16A34A", padding: 18, borderRadius: 20, alignItems: "center", elevation: 4 },
  saveText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});