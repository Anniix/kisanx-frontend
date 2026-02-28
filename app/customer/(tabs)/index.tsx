import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, 
  RefreshControl, TextInput, Dimensions, StatusBar, FlatList, Platform 
} from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "../../../utils/auth";
import { API_URL } from "../../../utils/api";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "vegetables", name: "Vegetables", icon: "carrot", color: "#E8F5E9" },
  { id: "fruits", name: "Fruits", icon: "food-apple", color: "#FFF3E0" },
  { id: "grains", name: "Grains", icon: "barley", color: "#EFEBE9" },
  { id: "spices", name: "Spices", icon: "leaf", color: "#FDF2F2" },
];

const BANNERS = [
  { id: '1', image: require("../../../assets/images/1.jpg") },
  { id: '2', image: require("../../../assets/images/2.jpg") },
  { id: '3', image: require("../../../assets/images/3.jpg") },
];

export default function CustomerHome() {
  const router = useRouter();
  const { addToCart, updateQuantity, cart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [address, setAddress] = useState("Fetching location...");
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchProducts();
    fetchUser();
    getLocation();
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev === BANNERS.length - 1 ? 0 : prev + 1;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setAddress("Mumbai, India"); return; }
    let location = await Location.getCurrentPositionAsync({});
    let reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
    if (reverseGeocode.length > 0) setAddress(`${reverseGeocode[0].district || reverseGeocode[0].city}`);
  };

  const fetchUser = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUserData(data);
    } catch (err) { console.log(err); }
  };

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data.filter((p: any) => p.farmerId));
    } catch (err) { console.log(err); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  }, []);

  // ✨ Logic to avoid duplication across sections
  const getCategorizedData = () => {
    let pool = [...products];

    // 1. Featured (Top Rated or Special Flag)
    const featured = pool.filter(p => p.rating >= 4.5).slice(0, 5);
    const featuredIds = featured.map(p => p._id);
    pool = pool.filter(p => !featuredIds.includes(p._id));

    // 2. Most Sold (Highest Sales)
    const mostSold = pool.filter(p => p.salesCount > 10).slice(0, 3);
    const mostSoldIds = mostSold.map(p => p._id);
    pool = pool.filter(p => !mostSoldIds.includes(p._id));

    // 3. Explore More (Remaining)
    const explore = pool.filter((p) => {
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return { featured, mostSold, explore };
  };

  const { featured, mostSold, explore } = getCategorizedData();

  const GridProductCard = ({ item }: { item: any }) => {
    const cartItem = cart?.find((c: any) => c._id === item._id);
    return (
      <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/product/${item._id}` as any)}>
        <View style={styles.cardImageWrapper}>
          <Image source={{ uri: item.image }} style={styles.prodImg} />
          <TouchableOpacity style={styles.wishlistIcon} onPress={() => toggleWishlist(item)}>
            <Ionicons name={isWishlisted(item._id) ? "heart" : "heart-outline"} size={18} color={isWishlisted(item._id) ? "#EF4444" : "#64748B"} />
          </TouchableOpacity>
        </View>
        <View style={styles.prodInfo}>
          <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceActionRow}>
            <Text style={styles.prodPrice}>₹{item.price.toFixed(0)}/kg</Text>
            {cartItem ? (
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => updateQuantity(item._id, cartItem.quantity - 1)}><Ionicons name="remove" size={12} color="#fff" /></TouchableOpacity>
                <Text style={styles.stepQty}>{cartItem.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item._id, cartItem.quantity + 1)}><Ionicons name="add" size={12} color="#fff" /></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart({...item, finalPrice: item.price, quantity: 1})}><Ionicons name="add" size={18} color="#fff" /></TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.headerSafe}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
             <View style={styles.logoCircleContainer}>
                <Image source={require("../../../assets/images/logo.png")} style={styles.logoImgHeader} resizeMode="cover" />
             </View>
             <View style={styles.brandTextContainer}>
                <Text style={styles.appName}>KisanX</Text>
                <TouchableOpacity style={styles.locationRow} onPress={getLocation}>
                    <Ionicons name="location" size={12} color="#10B981" />
                    <Text style={styles.locationLabel} numberOfLines={1}> {address}</Text>
                </TouchableOpacity>
             </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/customer/profile")} style={styles.profileBtn}>
            <Image source={{ uri: userData?.profilePic || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" />
              <TextInput 
                placeholder='Search fresh produce...' 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                style={styles.searchInput} 
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                onSubmitEditing={() => searchQuery.trim() && router.push(`/customer/search?q=${searchQuery}`)}
              />
            </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Banner Section */}
        <View style={styles.bannerWrapper}>
            <FlatList 
                ref={flatListRef} data={BANNERS} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.bannerContainer}><Image source={item.image} style={styles.bannerImg} /><LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.bannerOverlay}><View style={styles.premiumTag}><Text style={styles.bannerTagText}>Fresh Farm Pick</Text></View></LinearGradient></View>
                )}
            />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)} style={styles.catItem}>
                <View style={[styles.catIconCircle, {backgroundColor: cat.color}, selectedCategory === cat.id && styles.catActive]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={26} color={selectedCategory === cat.id ? "#fff" : "#10B981"} />
                </View>
                <Text style={[styles.catGridText, selectedCategory === cat.id && {color: '#10B981'}]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Section */}
        {!selectedCategory && featured.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Products ✨</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {featured.map(item => (
                <TouchableOpacity key={item._id} style={styles.featuredBox} onPress={() => router.push(`/product/${item._id}` as any)}>
                  <Image source={{ uri: item.image }} style={styles.featuredImg} />
                  <Text style={styles.featuredName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.featuredPrice}>₹{item.price}/kg</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Most Sold Section */}
        {!selectedCategory && mostSold.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Sold 📈</Text>
            {mostSold.map(item => (
              <TouchableOpacity key={item._id} style={styles.soldCard} onPress={() => router.push(`/product/${item._id}` as any)}>
                <Image source={{ uri: item.image }} style={styles.soldImg} />
                <View style={styles.soldInfo}>
                  <Text style={styles.soldName}>{item.name}</Text>
                  <Text style={styles.soldBadge}>Trending</Text>
                  <Text style={styles.prodPrice}>₹{item.price}/kg</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Explore More - Grid Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{selectedCategory ? selectedCategory.toUpperCase() : "Explore More"}</Text>
          <View style={styles.grid}>
            {explore.map((item) => <GridProductCard key={item._id} item={item} />)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerSafe: { backgroundColor: "#fff", paddingTop: Platform.OS === 'ios' ? 50 : 45, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 15 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoCircleContainer: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  logoImgHeader: { width: '100%', height: '100%' },
  brandTextContainer: { marginLeft: 12 },
  appName: { fontSize: 20, fontWeight: "900", color: "#10B981" },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationLabel: { fontSize: 10, color: "#64748B", maxWidth: 100 },
  avatar: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: "#10B981" },
  profileBtn: { padding: 2 },
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 20 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 15, paddingHorizontal: 15, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  bannerWrapper: { marginTop: 15, paddingHorizontal: 20 },
  bannerContainer: { width: width - 40, height: 160, borderRadius: 20, overflow: 'hidden', marginRight: 10 },
  bannerImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 15 },
  premiumTag: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", paddingHorizontal: 20, marginBottom: 12 },
  categoryScroll: { paddingLeft: 20, paddingRight: 20 },
  catItem: { alignItems: 'center', marginRight: 30 }, 
  catIconCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2, backgroundColor: '#fff' },
  catActive: { backgroundColor: '#10B981' },
  catGridText: { fontSize: 12, fontWeight: "700", marginTop: 8, color: '#64748B' },
  horizontalScroll: { paddingLeft: 20, paddingRight: 10 },
  featuredBox: { width: 140, marginRight: 15, backgroundColor: '#fff', borderRadius: 20, padding: 10, elevation: 2 },
  featuredImg: { width: '100%', height: 90, borderRadius: 12 },
  featuredName: { fontSize: 13, fontWeight: '800', marginTop: 8, color: '#1E293B' },
  featuredPrice: { fontSize: 14, color: '#10B981', fontWeight: '900' },
  soldCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, padding: 12, borderRadius: 20, marginBottom: 10, elevation: 2 },
  soldImg: { width: 60, height: 60, borderRadius: 12 },
  soldInfo: { flex: 1, marginLeft: 15 },
  soldName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  soldBadge: { fontSize: 9, color: '#10B981', fontWeight: '800', backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start', marginVertical: 3 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20 },
  productCard: { width: (width / 2) - 28, backgroundColor: "#fff", borderRadius: 20, marginBottom: 15, elevation: 3, overflow: 'hidden' },
  cardImageWrapper: { position: 'relative' },
  prodImg: { width: "100%", height: 110 },
  wishlistIcon: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.85)', padding: 5, borderRadius: 10 },
  prodInfo: { padding: 10 },
  prodName: { fontSize: 14, fontWeight: "800", color: '#1E293B', marginBottom: 6 }, 
  priceActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prodPrice: { fontSize: 14, fontWeight: "900", color: '#10B981' },
  addBtn: { backgroundColor: "#10B981", width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', borderRadius: 8, padding: 3 },
  stepQty: { color: '#fff', fontWeight: '900', marginHorizontal: 5, fontSize: 12 },
});