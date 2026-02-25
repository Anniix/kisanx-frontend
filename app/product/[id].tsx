import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../utils/api";
import { getToken } from "../../utils/auth";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<any>("kg");
  const [weight, setWeight] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProduct(data);
    } catch (err) { console.log(err); } finally { setLoading(false); }
  };

  const calculateFinalPrice = () => {
    const basePriceKg = Number(product?.price || 0);
    return selectedUnit === "kg" ? basePriceKg * weight : (basePriceKg / 1000) * weight;
  };

  const handleAddToCart = () => {
    const finalPrice = calculateFinalPrice();
    addToCart({
      ...product,
      finalPrice: finalPrice / weight, 
      selectedWeight: `${weight}${selectedUnit}`,
      quantity: 1
    });
    router.push("/customer/cart" as any);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product?.image }} style={styles.image} />
          <SafeAreaView style={styles.headerButtons}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn} onPress={() => toggleWishlist(product)}><Ionicons name={isWishlisted(product?._id) ? "heart" : "heart-outline"} size={24} color={isWishlisted(product?._id) ? "#EF4444" : "#1E293B"} /></TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.title}>{product?.name}</Text>
          <Text style={styles.quintalPrice}>₹{Number(product?.price).toFixed(0)}<Text style={{fontSize:14}}> / kg</Text></Text>
          <View style={styles.divider} />
          <Text style={styles.description}>{product?.description}</Text>

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Select Quantity:</Text>
          <View style={styles.unitTabs}>
            <TouchableOpacity style={[styles.tab, selectedUnit === "g" && styles.activeTab]} onPress={() => {setSelectedUnit("g"); setWeight(500);}}><Text style={selectedUnit === "g" && styles.activeTabText}>Gram (g)</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.tab, selectedUnit === "kg" && styles.activeTab]} onPress={() => {setSelectedUnit("kg"); setWeight(1);}}><Text style={selectedUnit === "kg" && styles.activeTabText}>Kilo (kg)</Text></TouchableOpacity>
          </View>

          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => setWeight(Math.max(1, weight - 1))}><Ionicons name="remove" size={24} /></TouchableOpacity>
            <Text style={styles.quantityNum}>{weight}{selectedUnit}</Text>
            <TouchableOpacity onPress={() => setWeight(weight + 1)}><Ionicons name="add" size={24} color="#10B981" /></TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalPrice}>₹{calculateFinalPrice().toFixed(2)}</Text></View>
        <TouchableOpacity style={styles.buyBtn} onPress={handleAddToCart}><Text style={styles.buyBtnText}>Add to Cart</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: 'center' },
  imageContainer: { width: width, height: 350 },
  image: { width: "100%", height: "100%" },
  headerButtons: { position: 'absolute', width: '100%', flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  roundBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  contentCard: { padding: 25, marginTop: -30, backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35 },
  title: { fontSize: 26, fontWeight: "900" },
  quintalPrice: { fontSize: 18, color: "#64748B", marginTop: 10 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 20 },
  description: { color: "#64748B", lineHeight: 22 },
  sectionLabel: { fontSize: 16, fontWeight: "800" },
  unitTabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 15, padding: 5, marginTop: 10 },
  tab: { flex: 1, padding: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#fff', borderRadius: 12 },
  activeTabText: { color: '#10B981', fontWeight: 'bold' },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 15, marginTop: 20 },
  quantityNum: { fontSize: 18, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderTopWidth: 1, borderColor: '#F1F5F9' },
  totalLabel: { fontSize: 12, color: '#94A3B8' },
  totalPrice: { fontSize: 24, fontWeight: '900', color: '#10B981' },
  buyBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 20, paddingHorizontal: 30 },
  buyBtnText: { color: '#fff', fontWeight: '800' }
});