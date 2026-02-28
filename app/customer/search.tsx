import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  Dimensions, ActivityIndicator, StatusBar, ScrollView 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../utils/api";
import { getToken } from "../../utils/auth";
import { useCart } from "../../context/CartContext";

const { width } = Dimensions.get("window");

export default function SearchResultsScreen() {
  const { q } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, cart, updateQuantity } = useCart();
  
  const [results, setResults] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSearchData();
  }, [q]);

  const fetchSearchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Filter search results
        const filtered = data.filter((p: any) => 
          p.name.toLowerCase().includes(q.toString().toLowerCase())
        );
        setResults(filtered);

        // Filter suggestions (products not in search results)
        const suggestions = data.filter((p: any) => 
          !p.name.toLowerCase().includes(q.toString().toLowerCase())
        ).slice(0, 6);
        setSuggested(suggestions);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = (item: any) => {
    const cartItem = cart?.find((c: any) => c._id === item._id);
    return (
      <TouchableOpacity key={item._id} style={styles.productCard} onPress={() => router.push(`/product/${item._id}`)}>
        <Image source={{ uri: item.image }} style={styles.prodImg} />
        <View style={styles.prodInfo}>
          <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.prodPrice}>₹{item.price}/kg</Text>
            {cartItem ? (
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => updateQuantity(item._id, cartItem.quantity + 1)}>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart({...item, finalPrice: item.price, quantity: 1})}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results for "{q}"</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {results.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.grid}>
              {results.map((item) => renderProduct(item))}
            </View>
          </View>
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No products found.</Text>
          </View>
        )}

        {suggested.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>You might also like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedScroll}>
              {suggested.map((item) => (
                <TouchableOpacity key={item._id} style={styles.suggestedCard} onPress={() => router.push(`/product/${item._id}`)}>
                  <Image source={{ uri: item.image }} style={styles.suggestedImg} />
                  <Text style={styles.suggestedName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.suggestedPrice}>₹{item.price}/kg</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginLeft: 15 },
  section: { marginTop: 10, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 15, marginTop: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  productCard: { width: (width / 2) - 30, backgroundColor: "#fff", borderRadius: 20, marginBottom: 15, elevation: 3, overflow: 'hidden' },
  prodImg: { width: "100%", height: 110 },
  prodInfo: { padding: 10 },
  prodName: { fontSize: 14, fontWeight: "800", color: '#1E293B' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  prodPrice: { fontSize: 14, fontWeight: "900", color: '#10B981' },
  addBtn: { backgroundColor: "#10B981", width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepper: { backgroundColor: "#10B981", borderRadius: 8, padding: 4 },
  noResults: { padding: 40, alignItems: 'center' },
  noResultsText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  suggestedScroll: { gap: 15, paddingVertical: 10 },
  suggestedCard: { width: 130, backgroundColor: '#fff', borderRadius: 15, padding: 10, elevation: 2 },
  suggestedImg: { width: '100%', height: 80, borderRadius: 10, marginBottom: 5 },
  suggestedName: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  suggestedPrice: { fontSize: 12, color: '#10B981', fontWeight: '800' },
});