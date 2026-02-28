import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Platform, StatusBar, KeyboardAvoidingView 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<"g" | "kg">("kg");
  const [weight, setWeight] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => { 
    fetchProductDetails(); 
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/products/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      setProduct(data);
      
      // Jab product data mil jaye, tabhi uski category ke products fetch karein
      if (data?.category) {
        fetchSuggestedProducts(data.category, token);
      }
    } catch (err) { 
      console.log(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchSuggestedProducts = async (category: string, token: string | null) => {
    try {
      const res = await fetch(`${API_URL}/products`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // ✨ LOGIC: Sirf SAME CATEGORY wale products filter honge aur current product hat jayega
        const filtered = data.filter((p: any) => 
          p.category === category && p._id !== id
        ).slice(0, 6);
        setSuggestedProducts(filtered);
      }
    } catch (err) { 
      console.log(err); 
    }
  };

  const calculateFinalPrice = () => {
    const basePriceKg = Number(product?.price || 0);
    return selectedUnit === "kg" ? basePriceKg * weight : (basePriceKg / 1000) * weight;
  };

  const handleAddToCart = () => {
    const totalPriceForSelection = calculateFinalPrice();
    addToCart({
      ...product,
      finalPrice: totalPriceForSelection, 
      selectedWeight: `${weight}${selectedUnit}`,
      quantity: 1 
    });
    router.push("/customer/cart");
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Main Product Image Section */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: product?.image }} style={styles.image} resizeMode="cover" />
            <SafeAreaView style={styles.headerButtons}>
              <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundBtn} onPress={() => toggleWishlist(product)}>
                <Ionicons name={isWishlisted(product?._id) ? "heart" : "heart-outline"} size={24} color={isWishlisted(product?._id) ? "#EF4444" : "#1E293B"} />
              </TouchableOpacity>
            </SafeAreaView>
          </View>

          {/* Product Details Section */}
          <View style={styles.contentCard}>
            <Text style={styles.title}>{product?.name}</Text>
            <Text style={styles.basePrice}>₹{Number(product?.price).toFixed(0)} / kg</Text>
            <View style={styles.divider} />
            <Text style={styles.description}>{product?.description}</Text>

            <Text style={styles.sectionLabel}>Select Quantity:</Text>
            <View style={styles.unitTabs}>
              <TouchableOpacity style={[styles.tab, selectedUnit === "g" && styles.activeTab]} onPress={() => {setSelectedUnit("g"); setWeight(500);}}>
                <Text style={[styles.tabText, selectedUnit === "g" && styles.activeTabText]}>Gram (g)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, selectedUnit === "kg" && styles.activeTab]} onPress={() => {setSelectedUnit("kg"); setWeight(1);}}>
                <Text style={[styles.tabText, selectedUnit === "kg" && styles.activeTabText]}>Kilo (kg)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => setWeight(Math.max(1, weight - 1))} style={styles.stepBtn}>
                <Ionicons name="remove" size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.quantityNum}>{weight}{selectedUnit}</Text>
              <TouchableOpacity onPress={() => setWeight(weight + 1)} style={styles.stepBtn}>
                <Ionicons name="add" size={24} color="#10B981" />
              </TouchableOpacity>
            </View>

            {/* ✨ SMART SUGGESTIONS: Same category products only */}
            {suggestedProducts.length > 0 && (
              <View style={styles.suggestedSection}>
                <Text style={styles.sectionLabel}>More {product?.category} Items</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedScroll}>
                  {suggestedProducts.map((item) => (
                    <TouchableOpacity 
                      key={item._id} 
                      style={styles.suggestedCard} 
                      onPress={() => router.push(`/product/${item._id}`)}
                    >
                      <Image source={{ uri: item.image }} style={styles.suggestedImg} />
                      <Text style={styles.suggestedName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.suggestedPrice}>₹{item.price}/kg</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>₹{calculateFinalPrice().toFixed(0)}</Text>
        </View>
        <TouchableOpacity style={styles.buyBtn} onPress={handleAddToCart}>
          <Text style={styles.buyBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: width, height: width * 0.9 },
  image: { width: "100%", height: "100%" },
  headerButtons: { position: 'absolute', width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 10 : 0 },
  roundBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  contentCard: { padding: 25, marginTop: -35, backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, flex: 1 },
  title: { fontSize: 28, fontWeight: "900", color: "#1E293B" },
  basePrice: { fontSize: 18, color: "#10B981", marginTop: 8, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 20 },
  description: { color: "#64748B", lineHeight: 22, fontSize: 15 },
  sectionLabel: { fontSize: 16, fontWeight: "800", marginTop: 20, color: "#1E293B" },
  unitTabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 15, padding: 5, marginTop: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  tabText: { color: '#64748B', fontWeight: '600' },
  activeTabText: { color: '#10B981', fontWeight: '800' },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20, padding: 15, marginTop: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  stepBtn: { padding: 5 },
  quantityNum: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  
  suggestedSection: { marginTop: 30, marginBottom: 20 },
  suggestedScroll: { paddingVertical: 10, gap: 15 },
  suggestedCard: { width: 140, backgroundColor: '#fff', borderRadius: 15, padding: 10, elevation: 3 },
  suggestedImg: { width: '100%', height: 95, borderRadius: 12, marginBottom: 8 },
  suggestedName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  suggestedPrice: { fontSize: 13, color: '#10B981', fontWeight: '800' },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderTopWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff' },
  totalLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  totalPrice: { fontSize: 26, fontWeight: "900", color: "#10B981" },
  buyBtn: { backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 20, paddingHorizontal: 35, elevation: 4 },
  buyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});