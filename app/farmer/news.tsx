import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking, // Used to open external URLs
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../utils/api";

const { width } = Dimensions.get("window");

export default function FarmerNews() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const router = useRouter();

  const fetchData = async () => {
    try {
      const res = await api.get("/news");
      setData(res.data);
    } catch (e) {
      console.log("Error fetching data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredMandi = data?.mandi?.filter((item: any) => {
    const matchesSearch = item.crop.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const onShare = async (title: string, url: string) => {
    await Share.share({ message: `${title}\n\nKisanX: ${url}` });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#064E3B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kisan Samachar</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} />}
      >
        
        {/* 🔍 SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={{ marginLeft: 15 }} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search crop (e.g. Tomato, Wheat)..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" style={{ marginRight: 15 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* 🏷️ CATEGORY FILTERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {["All", "Vegetables", "Fruits", "Grains", "Spices"].map((cat) => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveCategory(cat)}
              style={[styles.categoryBtn, activeCategory === cat && styles.activeCategoryBtn]}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 📉 MANDI SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mandi Bhav 💹</Text>
          <Text style={styles.itemCount}>{filteredMandi?.length || 0} Results</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
          {filteredMandi?.length > 0 ? (
            filteredMandi.map((m: any) => (
              <View key={m.id} style={styles.mandiCard}>
                <Text style={styles.cropText}>{m.crop}</Text>
                <Text style={styles.priceText}>{m.price}</Text>
                <Text style={styles.marketText}>{m.market}</Text>
                <Text style={styles.unitText}>Per {m.unit} • {m.date}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No crops found matching your search.</Text>
          )}
        </ScrollView>

        {/* 🏛️ SCHEMES SECTION */}
        <Text style={styles.sectionTitle}>Sarkari Schemes 🏛️</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
          {data?.schemes?.map((s: any) => (
            <TouchableOpacity key={s.id} style={styles.schemeCard} onPress={() => Linking.openURL(s.link)}>
              <View style={styles.badge}><Text style={styles.badgeText}>{s.badge}</Text></View>
              <Text style={styles.schemeName} numberOfLines={2}>{s.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 📰 NEWS SECTION (Clickable Cards) */}
        <Text style={styles.sectionTitle}>Aaj ki Badi Khabar 📰</Text>
        {data?.news?.map((item: any) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.newsCard} 
            onPress={() => item.url && Linking.openURL(item.url)} // Opens the news link
          >
            <Image source={{ uri: item.image }} style={styles.newsImg} />
            <View style={styles.newsInfo}>
              <View style={styles.newsRow}>
                <Text style={styles.sourceText}>{item.source}</Text>
                <Ionicons 
                  name="share-social-outline" 
                  size={18} 
                  color="#10B981" 
                  onPress={() => onShare(item.title, item.url)} 
                />
              </View>
              <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
              {/* Tap hint for farmers */}
              <Text style={styles.readMoreText}>Puri khabar padhne ke liye tap karein...</Text>
            </View>
          </TouchableOpacity>
        ))}
        {/* Extra padding for bottom scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#064E3B', marginLeft: 15 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 20, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: '#1E293B' },
  
  categoryScroll: { paddingLeft: 20, marginBottom: 10 },
  categoryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  activeCategoryBtn: { backgroundColor: '#10B981', borderColor: '#10B981' },
  categoryText: { color: '#64748B', fontWeight: 'bold' },
  activeCategoryText: { color: '#fff' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginLeft: 20, marginTop: 10, marginBottom: 15, color: '#1E293B' },
  itemCount: { color: '#10B981', fontWeight: 'bold' },
  scrollArea: { paddingLeft: 20, marginBottom: 10 },
  emptyText: { marginLeft: 20, color: '#94A3B8', fontStyle: 'italic' },

  mandiCard: { width: width * 0.45, backgroundColor: '#fff', padding: 15, borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  cropText: { fontSize: 14, fontWeight: 'bold', color: '#10B981' },
  priceText: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  marketText: { fontSize: 12, color: '#475569', fontWeight: '600', marginTop: 4 },
  unitText: { fontSize: 10, color: '#94A3B8', marginTop: 5 },

  schemeCard: { width: width * 0.7, backgroundColor: '#10B981', padding: 20, borderRadius: 25, marginRight: 15 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  schemeName: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 10 },

  newsCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 20, borderRadius: 25, overflow: 'hidden', elevation: 3 },
  newsImg: { width: '100%', height: 180 },
  newsInfo: { padding: 15 },
  newsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  sourceText: { color: '#10B981', fontWeight: 'bold', fontSize: 12 },
  newsTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  readMoreText: { fontSize: 11, color: '#94A3B8', marginTop: 8, fontStyle: 'italic' }
});