import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, StatusBar, Dimensions } from "react-native";
import { useWishlist } from "../../../context/WishlistContext";
import { useCart } from "../../../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function WishlistScreen() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  if (!wishlist || wishlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}><Ionicons name="heart-outline" size={50} color="#10B981" /></View>
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
        data={wishlist} keyExtractor={(item) => item._id} contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${item._id}` as any)}>
              <Image source={{ uri: item.image }} style={styles.productImg} />
              <View style={styles.details}>
                <View style={styles.infoTop}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity onPress={() => toggleWishlist(item)}><Ionicons name="heart" size={22} color="#EF4444" /></TouchableOpacity>
                </View>
                <Text style={styles.price}>₹{item.price.toFixed(0)}/kg</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart({...item, finalPrice: item.price, selectedWeight: "1kg", quantity: 1})}><Text style={styles.addBtnText}>ADD TO CART</Text></TouchableOpacity>
              </View>
            </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#F1F5F9" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  card: { backgroundColor: "#fff", borderRadius: 15, marginHorizontal: 20, marginTop: 15, flexDirection: "row", padding: 12, elevation: 2 },
  productImg: { width: 80, height: 80, borderRadius: 12 },
  details: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  infoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  name: { fontSize: 16, fontWeight: "800", color: '#1E293B', flex: 1 },
  price: { fontSize: 17, fontWeight: "900", color: '#10B981' },
  addBtn: { backgroundColor: "#10B981", paddingVertical: 6, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center", marginBottom: 15 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#064E3B" },
  exploreBtn: { marginTop: 20, backgroundColor: "#10B981", paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: "#fff", fontWeight: "800" },
});