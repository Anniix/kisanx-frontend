import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart, CartItem } from "../../context/CartContext";
import { API_URL } from "../../utils/api";
import { getToken } from "../../utils/auth";

export default function CheckoutScreen() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Online" | "COD">("Online");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((sum, item: CartItem) => sum + (Number(item.finalPrice || 0) * (item.quantity || 0)), 0);

  const finalizeOrder = () => {
    clearCart();
    router.replace("/customer/orders" as any);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) return Alert.alert("Required", "Please enter delivery address.");
    if (cart.length === 0) return Alert.alert("Empty", "Cart is empty.");

    setLoading(true);
    try {
      const token = await getToken();

      const sanitizedItems = cart.map(item => ({
        _id: item._id, // Matching backend expectation
        name: item.name,
        category: item.category || "General",
        quantity: item.quantity,
        price: Number(item.finalPrice || item.price || 0),
        selectedWeight: item.selectedWeight || "1kg"
      }));

      const response = await fetch(`${API_URL}/orders/checkout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          amount: total, 
          address, 
          items: sanitizedItems, 
          paymentMethod: paymentMode 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Checkout failed");
      }

      if (paymentMode === "Online") {
        // ✨ Enhanced Simulation: Success, Failure, and Cancel options
        Alert.alert(
          "Online Payment Simulation",
          `Amount to Pay: ₹${total.toFixed(2)}`,
          [
            { 
                text: "Simulate Success ✅", 
                onPress: () => verifyPayment(data.orderId, "success", token) 
            },
            { 
                text: "Simulate Failure ❌", 
                style: "destructive",
                onPress: () => verifyPayment(data.orderId, "failed", token) 
            },
            { 
                text: "Cancel 🚫", 
                style: "cancel", 
                onPress: () => setLoading(false) 
            }
          ]
        );
      } else {
        Alert.alert("Success", "Order placed with COD!", [{ text: "OK", onPress: finalizeOrder }]);
      }
    } catch (err: any) {
      Alert.alert("Checkout Error", err.message);
      setLoading(false);
    }
  };

  const verifyPayment = async (orderId: string, status: string, token: string | null) => {
    try {
      const res = await fetch(`${API_URL}/orders/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status }),
      });
      
      const result = await res.json();

      if (res.ok && status === "success") {
        Alert.alert("Success", "Payment Successful! Order Placed.");
        finalizeOrder();
      } else {
        setLoading(false);
        Alert.alert("Payment Failed", "Your payment could not be processed.");
      }
    } catch (e) { 
      setLoading(false); 
      Alert.alert("Error", "Server verification failed.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Review</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.glassCard}>
            {cart.map((item: any) => (
              <View key={`${item._id}-${item.selectedWeight}`} style={styles.itemRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={{fontSize: 12, color: '#64748B'}}>
                    {item.selectedWeight || '1kg'} x {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  ₹{(Number(item.finalPrice || 0) * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Total Amount</Text>
              <Text style={styles.feeValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle }>Delivery Address</Text>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="House No, Street..." 
              placeholderTextColor="#64748B"
              multiline 
              value={address} 
              onChangeText={setAddress} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity 
            style={[styles.payOption, paymentMode === "Online" && styles.activePay]} 
            onPress={() => setPaymentMode("Online")}
          >
            <MaterialCommunityIcons name="credit-card" size={24} color="#0284C7" />
            <Text style={styles.payTitle}>Online Payment</Text>
            <Ionicons name={paymentMode === "Online" ? "checkmark-circle" : "ellipse-outline"} size={22} color="#16A34A" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.payOption, paymentMode === "COD" && styles.activePay]} 
            onPress={() => setPaymentMode("COD")}
          >
            <MaterialCommunityIcons name="truck-delivery" size={24} color="#16A34A" />
            <Text style={styles.payTitle}>Cash on Delivery</Text>
            <Ionicons name={paymentMode === "COD" ? "checkmark-circle" : "ellipse-outline"} size={22} color="#16A34A" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerPrice}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Place Order</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#064E3B' },
  scrollContent: { padding: 20, paddingBottom: 150 },
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
  inputContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { fontSize: 15, height: 80, textAlignVertical: 'top' },
  payOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 22, marginBottom: 12, borderWidth: 1.5, borderColor: '#F1F5F9' },
  activePay: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  payTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginLeft: 15 },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 35, borderTopRightRadius: 35, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 20 },
  footerLabel: { fontSize: 12, color: '#64748B' },
  footerPrice: { fontSize: 24, fontWeight: '900' },
  payBtn: { backgroundColor: '#16A34A', paddingHorizontal: 25, paddingVertical: 18, borderRadius: 20 },
  payBtnText: { color: '#fff', fontWeight: '800' }
});