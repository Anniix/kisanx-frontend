import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  RefreshControl, 
  TextInput, 
  Dimensions, 
  StatusBar, 
  FlatList
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

// Aapke uploaded images yahan add kiye hain
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
      setActiveIndex((prevIndex) => {
        const nextIndex = prevIndex === BANNERS.length - 1 ? 0 : prevIndex + 1;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setAddress("Mumbai, India");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    let reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
    if (reverseGeocode.length > 0) {
      setAddress(`${reverseGeocode[0].name || reverseGeocode[0].district}, ${reverseGeocode[0].city}`);
    }
  };

  const fetchUser = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/auth/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      setUserData(data);
    } catch (err) { console.log(err); }
  };

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/products`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (data && Array.isArray(data)) {
        setProducts(data.filter((p: any) => p.farmerId));
      }
    } catch (err) { console.log(err); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderBanner = ({ item }: any) => (
    <View style={styles.bannerContainer}>
        <Image source={item.image} style={styles.bannerImg} />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.4)']} 
          style={styles.bannerOverlay}
        >
            <View style={styles.premiumTag}>
                <Text style={styles.bannerTagText}>Our Motive</Text>
            </View>
        </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={styles.headerSafe}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
             <Image source={require("../../../assets/images/logo.png")} style={styles.logoImg} />
             <View style={styles.brandTextContainer}>
                <Text style={styles.appName}>KisanX</Text>
                <TouchableOpacity style={styles.locationRow} onPress={getLocation}>
                    <Ionicons name="location" size={12} color="#10B981" />
                    <Text style={styles.locationLabel} numberOfLines={1}> {address}</Text>
                    <Ionicons name="chevron-down" size={10} color="#10B981" />
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
              />
            </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />} 
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        
        <View style={styles.bannerWrapper}>
            <FlatList 
                ref={flatListRef}
                data={BANNERS}
                renderItem={renderBanner}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
                  setActiveIndex(index);
                }}
            />
            <View style={styles.dotRow}>
                {BANNERS.map((_, i) => (
                    <View key={i} style={[styles.dot, activeIndex === i && styles.activeDot]} />
                ))}
            </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)} 
                style={styles.catItem}
              >
                <View style={[styles.catIconCircle, {backgroundColor: cat.color}, selectedCategory === cat.id && styles.catActive]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={28} color={selectedCategory === cat.id ? "#fff" : "#10B981"} />
                </View>
                <Text style={[styles.catGridText, selectedCategory === cat.id && {color: '#10B981', fontWeight: '800'}]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
                {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}` : "Popular Nearby"}
            </Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          
          <View style={styles.grid}>
            {filteredProducts.map((item) => {
              const cartItem = cart?.find((c: any) => c._id === item._id);
              return (
                <TouchableOpacity key={item._id} style={styles.productCard} onPress={() => router.push(`/product/${item._id}` as any)}>
                  <View style={styles.cardHeader}>
                      {/* Fixed Organic Tag: Compact padding */}
                      <View style={styles.tag}><Text style={styles.tagText}>ORGANIC</Text></View>
                      <TouchableOpacity style={styles.wishlist} onPress={() => toggleWishlist(item)}>
                        <Ionicons name={isWishlisted(item._id) ? "heart" : "heart-outline"} size={18} color={isWishlisted(item._id) ? "#EF4444" : "#64748B"} />
                      </TouchableOpacity>
                  </View>
                  
                  <Image source={{ uri: item.image }} style={styles.prodImg} />
                  
                  <View style={styles.prodInfo}>
                      <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.prodWeight}>₹{item.price.toFixed(0)} / kg</Text>
                      
                      <View style={styles.priceRow}>
                          <Text style={styles.prodPrice}>₹{item.price.toFixed(0)}</Text>
                          {cartItem ? (
                            <View style={styles.stepper}>
                                <TouchableOpacity onPress={() => updateQuantity(item._id, cartItem.quantity - 1)}>
                                    <Ionicons name="remove" size={14} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.stepQty}>{cartItem.quantity}</Text>
                                <TouchableOpacity onPress={() => updateQuantity(item._id, cartItem.quantity + 1)}>
                                    <Ionicons name="add" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart({...item, finalPrice: item.price, quantity: 1})}>
                                <Ionicons name="add" size={20} color="#fff" />
                            </TouchableOpacity>
                          )}
                      </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerSafe: { backgroundColor: "#fff", paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 15 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoImg: { width: 40, height: 40, borderRadius: 12 },
  brandTextContainer: { marginLeft: 10 },
  appName: { fontSize: 22, fontWeight: "900", color: "#10B981" },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", maxWidth: 120 },
  avatar: { width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: "#10B981" },
  profileBtn: { padding: 2 },
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 20 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 15, paddingHorizontal: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  
  bannerWrapper: { marginTop: 15, paddingHorizontal: 20, alignItems: 'center' },
  bannerContainer: { width: width - 40, height: 180, borderRadius: 25, overflow: 'hidden' },
  bannerImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 15 },
  premiumTag: { alignSelf: 'flex-start', backgroundColor: '#4f3d3d', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  dotRow: { flexDirection: 'row', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1', marginHorizontal: 3 },
  activeDot: { width: 15, backgroundColor: '#10B981' },

  section: { marginTop: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", paddingHorizontal: 20, marginBottom: 10 },
  seeAll: { color: '#10B981', fontWeight: '700', fontSize: 13 },
  
  // Category spacing enhanced
  categoryScroll: { paddingLeft: 20, paddingRight: 5 },
  catItem: { alignItems: 'center', marginRight: 25 }, 
  catIconCircle: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  catActive: { backgroundColor: '#10B981' },
  catGridText: { fontSize: 12, fontWeight: "700", marginTop: 8, color: '#64748B' },
  
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20 },
  productCard: { width: (width / 2) - 28, backgroundColor: "#fff", borderRadius: 24, marginBottom: 20, elevation: 5, overflow: 'hidden' },
  cardHeader: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  
  // Organic tag fix: Removed bottom space
  tag: { backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  tagText: { fontSize: 8, fontWeight: '900', color: '#059669' },
  
  wishlist: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 5, borderRadius: 8 },
  prodImg: { width: "100%", height: 120, backgroundColor: '#F8FAFC' },
  prodInfo: { padding: 12 },
  prodName: { fontSize: 14, fontWeight: "800", color: '#1E293B' },
  prodWeight: { fontSize: 11, color: "#10B981", fontWeight: '600', marginTop: 2 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  prodPrice: { fontSize: 17, fontWeight: "900", color: '#1E293B' },
  addBtn: { backgroundColor: "#10B981", width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', borderRadius: 10, padding: 4 },
  stepQty: { color: '#fff', fontWeight: '900', marginHorizontal: 8, fontSize: 13 },
});