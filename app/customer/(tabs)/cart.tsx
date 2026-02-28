import React from "react";
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image, 
  StatusBar, Dimensions, KeyboardAvoidingView, Platform 
} from "react-native";
import { useCart } from "../../../context/CartContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function CartScreen() {
  // ✨ FIX: setAllCart ko hata diya hai kyunki yeh context mein nahi hai
  const { cart, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();

  // Total Amount Calculation
  const subtotal = cart?.reduce((sum, item) => sum + (Number(item.finalPrice || 0) * item.quantity), 0) || 0;

  if (!cart || cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}><MaterialCommunityIcons name="cart-off" size={60} color="#10B981" /></View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push("/customer/(tabs)")}>
          <Text style={styles.exploreBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}><Text style={styles.headerTitle}>My Cart</Text></View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <FlatList
          data={cart}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cartCard}>
              <Image source={{ uri: item.image }} style={styles.productImg} />
              <View style={styles.productDetails}>
                <View style={styles.infoTop}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item._id)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                {/* selectedWeight dikhayega ki kitna vazan hai */}
                <Text style={styles.weightTag}>Weight: {item.quantity}{item.selectedWeight?.replace(/[0-9]/g, '') || 'kg'}</Text> 
                
                <View style={styles.infoBottom}>
                  <Text style={styles.productPrice}>
                    ₹{(Number(item.finalPrice || 0) * item.quantity).toFixed(0)}
                  </Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))} 
                      style={styles.stepBtn}
                    >
                      <Ionicons name="remove" size={16} color="#10B981" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item._id, item.quantity + 1)} 
                      style={styles.stepBtn}
                    >
                      <Ionicons name="add" size={16} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>

      <View style={styles.footerContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{subtotal.toFixed(0)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push("/customer/checkout")}>
          <Text style={styles.checkoutButtonText}>Checkout Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#F1F5F9" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#064E3B" },
  listContainer: { paddingBottom: 150, paddingHorizontal: 20, paddingTop: 10 },
  cartCard: { backgroundColor: "#fff", borderRadius: 20, marginVertical: 8, flexDirection: "row", padding: 12, elevation: 3 },
  productImg: { width: 85, height: 85, borderRadius: 15 },
  productDetails: { flex: 1, marginLeft: 15, justifyContent: "center" },
  infoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: "800", color: '#1E293B', flex: 1 },
  weightTag: { fontSize: 12, color: "#10B981", fontWeight: "700", marginTop: 2 },
  infoBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, alignItems: 'center' },
  productPrice: { fontSize: 18, fontWeight: "900", color: '#1E293B' },
  stepperContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 12, padding: 4 },
  stepBtn: { width: 30, height: 30, backgroundColor: "#fff", borderRadius: 8, justifyContent: "center", alignItems: "center", elevation: 1 },
  qtyText: { marginHorizontal: 12, fontWeight: "800", fontSize: 15, color: '#1E293B' },
  footerContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 25, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: "800", color: '#475569' },
  totalValue: { fontSize: 24, fontWeight: "900", color: "#10B981" },
  checkoutButton: { backgroundColor: "#10B981", height: 60, borderRadius: 18, justifyContent: "center", alignItems: "center", elevation: 4 },
  checkoutButtonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: "900", color: '#064E3B' },
  exploreBtn: { marginTop: 30, backgroundColor: "#10B981", paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20 },
  exploreBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});