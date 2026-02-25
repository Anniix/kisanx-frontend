import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // ✨ Added
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  Alert, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from "react-native";
import api from "../../utils/api"; 

export default function FarmerEditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ 
    firstName: "", lastName: "", phone: "", 
    farmName: "", location: "", profilePic: "" 
  });

  useEffect(() => { loadCurrentData(); }, []);

  const loadCurrentData = async () => {
    try {
      const res = await api.get("/auth/me"); 
      const data = res.data;
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        farmName: data.farmName || "",
        location: data.location || "",
        profilePic: data.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
      });
    } catch (err) { console.error(err); } finally { setFetching(false); }
  };

  // ✨ IMAGE PICKER LOGIC (Same as Customer)
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
      quality: 0.1, 
      base64: true,
    });

    if (!result.canceled) {
      setForm({ ...form, profilePic: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/auth/update", form); 
      Alert.alert("Success 🎉", "Farmer profile updated!", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err) { Alert.alert("Error", "Update failed."); } finally { setLoading(false); }
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Farmer Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ✨ UPDATED PHOTO SECTION WITH CAMERA ICON */}
        <View style={styles.photoSection}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: form.profilePic }} style={styles.profileImage} />
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>Tap to change farm/profile photo</Text>
        </View>

        <View style={styles.form}>
          <InputItem label="First Name" value={form.firstName} onChange={(t: string) => setForm({...form, firstName: t})} icon="person-outline" />
          <InputItem label="Last Name" value={form.lastName} onChange={(t: string) => setForm({...form, lastName: t})} icon="person-outline" />
          <InputItem label="Farm Name" value={form.farmName} onChange={(t: string) => setForm({...form, farmName: t})} icon="business-outline" />
          <InputItem label="Farm Location" value={form.location} onChange={(t: string) => setForm({...form, location: t})} icon="location-outline" />
          <InputItem label="Phone" value={form.phone} onChange={(t: string) => setForm({...form, phone: t})} icon="call-outline" keyboard="numeric" />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InputItem = ({ label, value, onChange, icon, keyboard }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color="#16A34A" style={{ marginRight: 12 }} />
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType={keyboard || "default"} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: "#fff" },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  
  // ✨ PHOTO STYLES (Matched with Customer UI)
  photoSection: { alignItems: "center", marginVertical: 30 },
  imageWrapper: { position: "relative" },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: "#16A34A" },
  cameraIcon: { position: "absolute", bottom: 5, right: 5, backgroundColor: "#16A34A", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#fff" },
  photoHint: { marginTop: 12, fontSize: 14, color: "#16A34A", fontWeight: "600" },

  form: { paddingHorizontal: 25, gap: 15 },
  inputContainer: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: "#4B5563" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: "#E5E7EB" },
  input: { flex: 1, fontSize: 16, color: "#1F2937" },
  saveBtn: { margin: 30, backgroundColor: "#16A34A", padding: 18, borderRadius: 20, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});