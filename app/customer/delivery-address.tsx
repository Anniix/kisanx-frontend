import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { 
  ActivityIndicator, Dimensions, StyleSheet, Text, 
  TouchableOpacity, View, TextInput, ScrollView, 
  KeyboardAvoidingView, Platform, Alert 
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function DeliveryAddress() {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState("Fetching your location...");
  const [loading, setLoading] = useState(true);
  
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressLabel, setAddressLabel] = useState("Home");

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress("Permission denied. Please select manually.");
        setLoading(false);
        return;
      }
      let currentLoc = await Location.getCurrentPositionAsync({});
      updateLocationData(currentLoc.coords.latitude, currentLoc.coords.longitude);
    })();
  }, []);

  const updateLocationData = async (lat: number, lng: number) => {
    setLocation({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.002, 
      longitudeDelta: 0.002,
    });
    try {
      let response = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (response.length > 0) {
        const item = response[0];
        setAddress(`${item.name || ''}, ${item.street || ''}, ${item.district || ''}`);
      }
    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const handleSaveAddress = () => {
    // Building/House no strict validation
    if (!houseNo.trim()) {
      return Alert.alert("Required", "Please enter Building/House/Flat No to proceed.");
    }
    const fullDeliveryAddress = `${houseNo}, ${address}${landmark ? ' (Landmark: ' + landmark + ')' : ''}`;
    
    // router.replace use kiya taaki history clear ho jaye
    router.replace({ 
      pathname: "/customer/checkout", 
      params: { selectedAddress: fullDeliveryAddress } 
    });
  };

  if (loading && !location) return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={location}
            showsUserLocation={true}
            showsTraffic={true}
            showsBuildings={true}
            mapType="standard"
            onRegionChangeComplete={(region) => updateLocationData(region.latitude, region.longitude)}
          >
            <Marker coordinate={location} title="Deliver Here" />
          </MapView>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.bottomCard}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.handle} />
              <Text style={styles.cardTitle}>Confirm Delivery Location</Text>
              
              <View style={styles.inputGroup}>
                  <Text style={styles.locLabel}>Your Location</Text>
                  <Text style={styles.currentAddr}>{address}</Text>
                  
                  <TextInput 
                      style={[styles.textInput, !houseNo && styles.requiredInput]} 
                      placeholder="Building / House / Flat / Floor No*" 
                      placeholderTextColor="#94A3B8"
                      value={houseNo}
                      onChangeText={setHouseNo}
                  />
                  
                  <TextInput 
                      style={styles.textInput} 
                      placeholder="Nearby Landmark (Optional)" 
                      placeholderTextColor="#94A3B8"
                      value={landmark}
                      onChangeText={setLandmark}
                  />

                  <Text style={styles.saveAsLabel}>Save this address as</Text>
                  <View style={styles.labelContainer}>
                      {["Home", "Office", "Other"].map((l) => (
                          <TouchableOpacity 
                              key={l} 
                              style={[styles.labelBtn, addressLabel === l && styles.activeLabelBtn]} 
                              onPress={() => setAddressLabel(l)}
                          >
                              <Text style={[styles.labelText, addressLabel === l && styles.activeLabelText]}>{l}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveAddress}>
                <Text style={styles.confirmBtnText}>Confirm and Save Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: width, height: height * 0.4 },
  backBtn: { position: 'absolute', top: 20, left: 20, backgroundColor: '#fff', padding: 10, borderRadius: 12, elevation: 5 },
  bottomCard: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, marginTop: -20, elevation: 10 },
  handle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, alignSelf: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  inputGroup: { gap: 15 },
  locLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  currentAddr: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 5 },
  textInput: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12, fontSize: 15, color: '#1E293B' },
  requiredInput: { borderBottomColor: '#FCA5A5' },
  saveAsLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', marginTop: 10 },
  labelContainer: { flexDirection: 'row', gap: 10 },
  labelBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  activeLabelBtn: { backgroundColor: '#10B981', borderColor: '#10B981' },
  labelText: { color: '#64748B', fontWeight: '600' },
  activeLabelText: { color: '#fff' },
  confirmBtn: { backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginTop: 25, marginBottom: 20 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});