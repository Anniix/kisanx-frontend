import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_URL } from "../../utils/api";
import { getToken } from "../../utils/auth";

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.address) {
        // Filhaal hum User model ka main address dikha rahe hain
        setAddresses([data.address]);
      }
    } catch (err) {
      console.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    if (!newAddress.trim()) return;
    setAddresses([...addresses, newAddress]);
    setNewAddress("");
    setModalVisible(false);
    Alert.alert("Success", "New address added to your list");
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /></View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.addressCard}>
            <View style={styles.iconBox}>
              <Ionicons name="location" size={22} color="#16A34A" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>{index === 0 ? "Home / Default" : `Address ${index + 1}`}</Text>
              <Text style={styles.addressText}>{item}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No addresses saved yet 📍</Text>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add Address Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full address..."
              multiline
              numberOfLines={3}
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                <Text style={styles.saveText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  list: { padding: 20 },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconBox: {
    width: 45,
    height: 45,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: "800", color: "#16A34A", marginBottom: 4 },
  addressText: { fontSize: 15, color: "#4B5563", lineHeight: 20 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#9CA3AF", fontSize: 16 },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#16A34A",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: {
    backgroundColor: "#fff",
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20, color: "#1F2937" },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    padding: 15,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 15 },
  cancelBtn: { flex: 1, padding: 16, alignItems: "center" },
  cancelText: { color: "#9CA3AF", fontWeight: "700" },
  saveBtn: { flex: 2, backgroundColor: "#16A34A", padding: 16, borderRadius: 15, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "800" },
});