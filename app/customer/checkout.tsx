import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { 
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, 
  TouchableOpacity, View, StatusBar, Modal, FlatList, 
  KeyboardAvoidingView, Platform, BackHandler 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart, CartItem } from "../../context/CartContext";
import { API_URL } from "../../utils/api";
import { getToken } from "../../utils/auth";

export default function CheckoutScreen() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [address, setAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"Online" | "COD">("Online");
  const [loading, setLoading] = useState(false);

  // Navigation Fix: Go straight to cart on back
  const handleBackNavigation = () => {
    router.replace("/customer/(tabs)/cart" as any);
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackNavigation);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (params.selectedAddress) {
      setAddress(params.selectedAddress.toString());
    }
    fetchSavedAddresses();
  }, [params.selectedAddress]);

  const fetchSavedAddresses = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.address) {
        setSavedAddresses([data.address]);
        if (!params.selectedAddress) {
          setAddress(data.address);
        }
      }
    } catch (err) { console.log("Failed to load saved addresses"); }
  };

  const total = cart.reduce((sum, item: CartItem) => sum + (Number(item.finalPrice || 0) * (item.quantity || 0)), 0);

  const handlePlaceOrder = async () => {
    if (!address.trim()) return Alert.alert("Required", "Please select a delivery address.");
    
    setLoading(true);
    try {
      const token = await getToken();

      // Step 1: Naya address permanent save karna database mein
      await fetch(`${API_URL}/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ address: address }),
      });

      // Step 2: Order Place karna
      const sanitizedItems = cart.map(item => ({
        _id: item._id, 
        name: item.name,
        quantity: item.quantity,
        price: Number(item.finalPrice || item.price || 0),
        selectedWeight: item.selectedWeight || "1kg"
      }));

      const res = await fetch(`${API_URL}/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ amount: total, address, items: sanitizedItems, paymentMethod: paymentMode }),
      });

      if (res.ok) {
        clearCart();
        Alert.alert("Success", "Order placed and address saved!");
        router.replace("/customer/orders" as any);
      }
    } catch (err) { Alert.alert("Error", "Process failed"); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackNavigation} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Review</Text>
          <View style={{ width: 45 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.glassCard}>
              {cart.map((item) => (
                <View key={item._id} style={styles.itemRow}>
                  <View style={{flex: 1}}><Text style={styles.itemName}>{item.name}</Text><Text style={{fontSize: 12, color: '#64748B'}}>{item.selectedWeight} x {item.quantity}</Text></View>
                  <Text style={styles.itemPrice}>₹{(Number(item.finalPrice || 0) * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.feeRow}><Text style={styles.feeLabel}>Total Amount</Text><Text style={styles.feeValue}>₹{total.toFixed(2)}</Text></View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity style={styles.addressPickerCard} onPress={() => setShowAddressModal(true)}>
              <View style={styles.addressIconCircle}><Ionicons name="location" size={20} color="#10B981" /></View>
              <View style={{ flex: 1, marginLeft: 12 }}><Text style={styles.addressHeader}>Deliver to</Text><Text style={styles.addressMain} numberOfLines={2}>{address || "Select Saved Address"}</Text></View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity style={[styles.payOption, paymentMode === "Online" && styles.activePay]} onPress={() => setPaymentMode("Online")}>
              <MaterialCommunityIcons name="credit-card" size={24} color="#0284C7" /><Text style={styles.payTitle}>Online Payment</Text><Ionicons name={paymentMode === "Online" ? "checkmark-circle" : "ellipse-outline"} size={22} color="#16A34A" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.payOption, paymentMode === "COD" && styles.activePay]} onPress={() => setPaymentMode("COD")}>
              <MaterialCommunityIcons name="truck-delivery" size={24} color="#16A34A" /><Text style={styles.payTitle}>Cash on Delivery</Text><Ionicons name={paymentMode === "COD" ? "checkmark-circle" : "ellipse-outline"} size={22} color="#16A34A" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View><Text style={styles.footerLabel}>Total Amount</Text><Text style={styles.footerPrice}>₹{total.toFixed(2)}</Text></View>
          <TouchableOpacity style={styles.payBtn} onPress={handlePlaceOrder} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Place Order</Text>}</TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showAddressModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}><Ionicons name="close" size={24} color="#1E293B" /></TouchableOpacity>
            </View>
            <FlatList 
              data={savedAddresses}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => (
                <View style={styles.savedAddrCard}>
                  <View style={styles.savedAddrHeader}><Ionicons name="home" size={20} color="#10B981" /><Text style={styles.savedAddrLabel}>Home</Text>{address === item && (<View style={styles.selectedBadge}><Text style={styles.selectedText}>SELECTED</Text></View>)}</View>
                  <Text style={styles.savedAddrText}>{item}</Text>
                  <TouchableOpacity style={styles.deliverHereBtn} onPress={() => {setAddress(item); setShowAddressModal(false);}}><Text style={styles.deliverHereText}>Deliver Here</Text></TouchableOpacity>
                </View>
              )}
              ListFooterComponent={
                <TouchableOpacity style={styles.addNewAddr} onPress={() => {setShowAddressModal(false); router.push("/customer/delivery-address" as any);}}>
                  <Ionicons name="add-circle" size={24} color="#10B981" /><Text style={styles.addNewText}>Add New Address (Select on Map)</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#064E3B' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  glassCard: { backgroundColor: '#fff', borderRadius: 25, padding: 20, elevation: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemPrice: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  feeLabel: { color: '#64748B' },
  feeValue: { fontWeight: '700' },
  addressPickerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  addressIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  addressHeader: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  addressMain: { fontSize: 14, color: '#1E293B', fontWeight: '800', marginTop: 2 },
  payOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 22, marginBottom: 12, borderWidth: 1.5, borderColor: '#F1F5F9' },
  activePay: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  payTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginLeft: 15 },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 35, borderTopRightRadius: 35, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 20 },
  footerLabel: { fontSize: 12, color: '#64748B' },
  footerPrice: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  payBtn: { backgroundColor: '#16A34A', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 20 },
  payBtnText: { color: '#fff', fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  savedAddrCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, padding: 18, marginBottom: 15, backgroundColor: '#fff' },
  savedAddrHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  savedAddrLabel: { marginLeft: 10, fontWeight: '800', fontSize: 15, color: '#1E293B', flex: 1 },
  selectedBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  selectedText: { fontSize: 10, color: '#10B981', fontWeight: '900' },
  savedAddrText: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 18 },
  deliverHereBtn: { backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 12, alignItems: 'center', elevation: 2 },
  deliverHereText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  addNewAddr: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 },
  addNewText: { color: '#10B981', fontWeight: '800', fontSize: 15 }
});