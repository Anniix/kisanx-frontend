import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, StatusBar } from "react-native";
import { useWishlist } from "../../../context/WishlistContext";
import { useCart } from "../../../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WishlistScreen() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  if (!wishlist || wishlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}><Ionicons name="heart-outline" size={60} color="#10B981" /></View>
        <Text style={styles.emptyTitle}>Wishlist is Empty</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push("/customer/(tabs)")}><Text style={styles.exploreBtnText}>Browse Products</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}><Text style={styles.headerTitle}>My Wishlist</Text></View>

      <FlatList
        data={wishlist}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          // DB always stores per-kg price (backend converts quintal→kg on product add)
          const pricePerKg = item.price;

          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${item._id}` as any)}>
              <Image source={{ uri: item.image }} style={styles.productImg} />
              <View style={styles.details}>
                <View style={styles.infoTop}>
                  <Text style={styles.name}>{item.name}</Text>
                  <TouchableOpacity onPress={() => toggleWishlist(item)}><Ionicons name="heart" size={24} color="#EF4444" /></TouchableOpacity>
                </View>
                <Text style={styles.unitText}>Price per kg</Text>
                <View style={styles.infoBottom}>
                  <Text style={styles.price}>₹{pricePerKg.toFixed(0)}</Text>
                  <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => addToCart({
                      ...item,
                      finalPrice: pricePerKg,  // Always per-kg
                      selectedWeight: "1kg",
                      quantity: 1
                    })}
                  >
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#F1F5F9" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  card: { backgroundColor: "#fff", borderRadius: 20, margin: 15, flexDirection: "row", padding: 12, elevation: 2 },
  productImg: { width: 85, height: 85, borderRadius: 15 },
  details: { flex: 1, marginLeft: 15, justifyContent: "center" },
  infoTop: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "800" },
  unitText: { fontSize: 12, color: "#64748B" },
  infoBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  price: { fontSize: 18, fontWeight: "900" },
  addBtn: { borderWidth: 1, borderColor: "#10B981", paddingHorizontal: 20, borderRadius: 10, paddingVertical: 5 },
  addBtnText: { color: "#10B981", fontWeight: "900" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: "900", color: "#064E3B" },
  exploreBtn: { marginTop: 30, backgroundColor: "#10B981", paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  exploreBtnText: { color: "#fff", fontWeight: "800" },
});
