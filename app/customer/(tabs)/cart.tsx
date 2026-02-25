import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, StatusBar } from "react-native";
import { useCart } from "../../../context/CartContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();

  const subtotal = cart?.reduce((sum, item) => sum + (Number(item.finalPrice || 0) * item.quantity), 0) || 0;

  if (!cart || cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}><MaterialCommunityIcons name="cart-off" size={60} color="#10B981" /></View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push("/customer/(tabs)")}><Text style={styles.exploreBtnText}>Start Shopping</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}><Text style={styles.headerTitle}>My Cart</Text></View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.cartCard}>
            <Image source={{ uri: item.image }} style={styles.productImg} />
            <View style={styles.productDetails}>
              <View style={styles.infoTop}>
                <Text style={styles.productName}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item._id)}><Ionicons name="trash-outline" size={20} color="#EF4444" /></TouchableOpacity>
              </View>
              <Text style={styles.categoryTag}>Weight: {item.selectedWeight || "1kg"}</Text> 
              <View style={styles.infoBottom}>
                <Text style={styles.productPrice}>₹{(Number(item.finalPrice || 0) * item.quantity).toFixed(0)}</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)} style={styles.stepBtn}><Ionicons name="remove" size={16} color="#10B981" /></TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)} style={styles.stepBtn}><Ionicons name="add" size={16} color="#10B981" /></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footerContainer}>
        <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total Amount</Text><Text style={styles.totalValue}>₹{subtotal.toFixed(0)}</Text></View>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push("/customer/checkout")}><Text style={styles.checkoutButtonText}>Checkout</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  header: { padding: 25, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#F1F5F9" },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#064E3B" },
  cartCard: { backgroundColor: "#fff", borderRadius: 20, margin: 15, flexDirection: "row", padding: 12, elevation: 2 },
  productImg: { width: 90, height: 90, borderRadius: 15 },
  productDetails: { flex: 1, marginLeft: 15, justifyContent: "center" },
  infoTop: { flexDirection: "row", justifyContent: "space-between" },
  productName: { fontSize: 17, fontWeight: "800" },
  categoryTag: { fontSize: 11, color: "#10B981", fontWeight: "700" },
  infoBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  productPrice: { fontSize: 18, fontWeight: "900" },
  stepperContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 12, padding: 4 },
  stepBtn: { width: 28, height: 28, backgroundColor: "#fff", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  qtyText: { marginHorizontal: 12, fontWeight: "800" },
  footerContainer: { padding: 25, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: "800" },
  totalValue: { fontSize: 22, fontWeight: "900", color: "#10B981" },
  checkoutButton: { backgroundColor: "#10B981", height: 60, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  checkoutButtonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: "900" },
  exploreBtn: { marginTop: 30, backgroundColor: "#10B981", paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  exploreBtnText: { color: "#fff", fontWeight: "800" },
});