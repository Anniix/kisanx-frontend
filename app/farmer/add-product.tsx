import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { 
  ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, 
  TextInput, TouchableOpacity, View, SafeAreaView, StatusBar as RNStatusBar, Platform
} from "react-native";
import api from "../../utils/api";

const CATEGORIES = [
  { id: "vegetables", name: "Vegetables", icon: "carrot", unit: "kg" },
  { id: "fruits", name: "Fruits", icon: "food-apple", unit: "kg" },
  { id: "grains", name: "Grains", icon: "barley", unit: "Quintal" },
  { id: "spices", name: "Spices", icon: "leaf", unit: "kg" },
];

export default function AddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", quantity: "", category: "vegetables", unit: "kg" 
  });

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (form.name.length > 2) {
        try {
          const res = await api.get(`/market/rates?search=${form.name}`);
          if (res.data && res.data.length > 0) {
            const bestMatch = res.data[0];
            setComparisonData(bestMatch);
            setForm(prev => ({ ...prev, category: bestMatch.category, unit: bestMatch.unit })); 
          }
        } catch (e) { console.log("Market error"); }
      }
    }, 600); 
    return () => clearTimeout(delayDebounce);
  }, [form.name]);

  const handleCategorySelect = (id: string) => {
    const cat = CATEGORIES.find(c => c.id === id);
    setForm({ ...form, category: id, unit: cat?.unit || "kg" });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      // ✨ FIX: MediaTypeOptions.Images ka use karein
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [4, 3], 
      quality: 0.2, 
      base64: true
    });
    if (!result.canceled) setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
  };

  const submit = async () => {
    if (!form.name || !form.price || !image || !form.quantity) return Alert.alert("Required", "Fill all fields.");
    setLoading(true);
    try {
      await api.post("/products", { 
        ...form, 
        price: Number(form.price), 
        quantity: Number(form.quantity), 
        image 
      });
      Alert.alert("Success 🎉", "Product Published! Customers in your area will be notified. 🌿");
      router.back();
    } catch (err) { Alert.alert("Error", "Server Error"); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color="#064E3B" /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Listing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? <Image source={{ uri: image }} style={styles.preview} /> : (
            <View style={styles.placeholder}><Ionicons name="camera" size={30} color="#10B981" /><Text style={styles.uploadTxt}>Add Photo</Text></View>
          )}
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Crop Name</Text>
          <TextInput placeholder="Wheat, Tomato, etc."  placeholderTextColor="#64748B" style={styles.input} onChangeText={(t) => setForm({...form, name: t})} />

          {comparisonData && (
            <View style={styles.compareCard}>
              <View style={styles.compareHeader}><Text style={styles.compareTitle}>Live Market Analysis</Text><View style={styles.liveBadge}><View style={styles.dot} /><Text style={styles.liveText}>LIVE</Text></View></View>
              <View style={styles.compareGrid}>
                <CompareBox label="Mandi" price={comparisonData.mandi} color="#10B981" unit={comparisonData.unit} />
                <CompareBox label="Blinkit" price={comparisonData.blinkit} color="#F59E0B" unit={comparisonData.unit} />
                <CompareBox label="Zepto" price={comparisonData.zepto} color="#8B5CF6" unit={comparisonData.unit} />
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}><Text style={styles.inputLabel}>Price (₹/{form.unit})</Text><TextInput placeholder="0"  placeholderTextColor="#64748B" keyboardType="numeric" style={styles.input} onChangeText={(t) => setForm({...form, price: t})} /></View>
            <View style={{ width: 15 }} /><View style={{ flex: 1 }}><Text style={styles.inputLabel}>Stock ({form.unit})</Text><TextInput placeholder="0"  placeholderTextColor="#64748B" keyboardType="numeric" style={styles.input} onChangeText={(t) => setForm({...form, quantity: t})} /></View>
          </View>

          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c.id} onPress={() => handleCategorySelect(c.id)} style={[styles.catBtn, form.category === c.id && styles.activeCat]}>
                <MaterialCommunityIcons name={c.icon as any} size={18} color={form.category === c.id ? "#fff" : "#10B981"} /><Text style={[styles.catTxt, form.category === c.id && {color: '#fff'}]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput placeholder="Quality details..." placeholderTextColor="#64748B" multiline style={styles.textArea} onChangeText={(t) => setForm({...form, description: t})} />
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Publish Listing</Text>}</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CompareBox = ({ label, price, color, unit }: any) => (
  <View style={styles.compareItem}><Text style={styles.compareLabel}>{label}</Text><Text style={[styles.comparePrice, { color }]}>₹{price}</Text><Text style={styles.unitLabel}>/{unit}</Text></View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight + 10 : 20) : 10,
    paddingBottom: 20, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#064E3B' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },
  scroll: { padding: 20 },
  compareCard: { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 15, marginVertical: 10, borderWidth: 1, borderColor: '#DCFCE7' },
  compareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  compareTitle: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444', marginRight: 4 },
  liveText: { fontSize: 9, fontWeight: '900', color: '#EF4444' },
  compareGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  compareItem: { alignItems: 'center', flex: 1 },
  compareLabel: { fontSize: 9, color: '#64748B', fontWeight: '700' },
  comparePrice: { fontSize: 15, fontWeight: '900' },
  unitLabel: { fontSize: 8, color: '#94A3B8' },
  imagePicker: { height: 160, backgroundColor: '#fff', borderRadius: 25, borderStyle: 'dashed', borderWidth: 2, borderColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  preview: { width: '100%', height: '100%', borderRadius: 25 },
  placeholder: { alignItems: 'center' },
  uploadTxt: { color: '#10B981', fontWeight: '800', marginTop: 5 },
  formCard: { backgroundColor: '#fff', borderRadius: 25, padding: 20, gap: 10, elevation: 3 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#475569', marginTop: 8 },
  input: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  row: { flexDirection: 'row' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  activeCat: { backgroundColor: '#10B981', borderColor: '#10B981' },
  catTxt: { fontSize: 12, fontWeight: '800', color: '#10B981' },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: 15, padding: 15, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' },
  submitBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 30 },
  submitTxt: { color: '#fff', fontSize: 18, fontWeight: '900' }
});