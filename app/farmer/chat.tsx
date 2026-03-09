import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

const INITIAL_MESSAGE: Message = {
  id: 1,
  text: "Namaste! 🌱 KisanX Sahayak mein aapka swagat hai. Main aapki fasal bechne aur order track karne mein madad kar sakta hun.",
  sender: "bot",
};

// 📚 Static Knowledge Base (No API Needed)
const STATIC_RESPONSES: Record<string, string> = {
  // --- Product Adding Questions ---
  "Product kaise list karein?": "Apna product list karne ke liye 'Add Product' button par jayein, photo kheinchein aur sahi daam bharein.",
  "Photo kaisi honi chahiye?": "Photo saaf honi chahiye aur khet ki taazi fasal dikhni chahiye. Dhundhli photo se customer nahi kharidte.",
  "Price kya rakhun?": "Market rate se 10-15% kam rakhenge toh aapka maal jaldi bikega. Aap 'Mandi Rates' section mein aaj ka bhav dekh sakte hain.",
  "Maal kharab ho gaya toh?": "Agar delivery se pehle maal kharab hota hai, toh turant order cancel karein taaki customer ko refund mil sake.",
  "Minimum kitna bech sakte hain?": "KisanX par aap kam se kam 1kg se lekar jitna chahein utna bech sakte hain.",
  "Packing ka kharcha kaun dega?": "Packing ka kharcha kisan ko dena hota hai, isliye apna price set karte waqt packing ka kharcha jod lein.",
  "Chemicals ki jaankari dena zaroori hai?": "Haan, agar aapne organic kheti ki hai toh zaroor batayein, isse aapko behtar daam milenge.",
  
  // --- Payment & Commission ---
  "Mera paisa kab milega?": "Customer ko order milne ke 24-48 ghanton ke andar paisa aapke bank account mein bhej diya jata hai.",
  "KisanX charges kitna hai?": "Hum sirf 5% commission lete hain taaki kisan ko zyada se zyada munafe mile.",
  
  // --- Logistics ---
  "Delivery kaun karega?": "KisanX ke partner delivery boy aapke khet ya ghar se mal uthayenge. Aapko kahin jane ki zaroorat nahi.",
  "Order track karein": "📦 Order Status: Aapka aakhri order abhi 'In-Transit' hai. \n\n🚚 Delivery Partner: Rahul Kumar\n⏳ Remaining Time: Lagbhag 45 minutes mein customer tak pahunch jayega.",
};

const QUICK_QUESTIONS = Object.keys(STATIC_RESPONSES);

export default function Chat() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, typing]);

  const sendMessage = (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    // Simulated Bot Thinking
    setTimeout(() => {
      let reply = "Maafi chahta hun, mujhe is baare mein jaankari nahi hai. Kripya diye gaye sawalon mein se chunein.";
      
      // Keyword matching logic
      const lowerText = messageText.toLowerCase();
      if (STATIC_RESPONSES[messageText]) {
        reply = STATIC_RESPONSES[messageText];
      } else if (lowerText.includes("order") || lowerText.includes("kahan hai") || lowerText.includes("track")) {
        reply = STATIC_RESPONSES["Order track karein"];
      } else if (lowerText.includes("paisa") || lowerText.includes("payment")) {
        reply = STATIC_RESPONSES["Mera paisa kab milega?"];
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: reply,
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
      setTyping(false);
    }, 800); 
  };

  const clearChat = () => {
    Alert.alert("Chat Clear Karein?", "Saari purani baatein hat jayengi.", [
      { text: "Nahi", style: "cancel" },
      { text: "Haan", style: "destructive", onPress: () => setMessages([INITIAL_MESSAGE]) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#064E3B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.statusDot} />
          <View>
            <Text style={styles.title}>KisanX Sahayak</Text>
            <Text style={styles.subtitle}>24/7 Support</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesContainer}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.bubbleWrapper, msg.sender === "user" ? styles.userWrapper : styles.botWrapper]}>
            <View style={[styles.bubble, msg.sender === "user" ? styles.userBubble : styles.botBubble]}>
              <Text style={msg.sender === "user" ? styles.userText : styles.botText}>{msg.text}</Text>
            </View>
          </View>
        ))}

        {typing && (
          <View style={styles.botWrapper}>
            <View style={[styles.bubble, styles.botBubble]}>
              <Text style={styles.botText}>Sochein rahe hain... 🌱</Text>
            </View>
          </View>
        )}

        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>Sawaal chunein:</Text>
          <View style={styles.chipsContainer}>
            {QUICK_QUESTIONS.map((q, i) => (
              <TouchableOpacity key={i} style={styles.quickChip} onPress={() => sendMessage(q)}>
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Sawaal likhein..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
            onPress={() => sendMessage()}
            disabled={!input.trim() || typing}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FEE7" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#BEF264" },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4 },
  clearBtn: { padding: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E" },
  title: { fontSize: 17, fontWeight: "bold", color: "#064E3B" },
  subtitle: { fontSize: 11, color: "#6B7280" },
  messagesContainer: { padding: 16 },
  bubbleWrapper: { marginBottom: 12, flexDirection: "row" },
  userWrapper: { justifyContent: "flex-end" },
  botWrapper: { justifyContent: "flex-start" },
  bubble: { padding: 12, borderRadius: 18, maxWidth: "80%" },
  userBubble: { backgroundColor: "#10B981", borderBottomRightRadius: 2 },
  botBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 2, elevation: 1 },
  userText: { color: "#fff", fontSize: 14 },
  botText: { color: "#1F2937", fontSize: 14, lineHeight: 20 },
  quickSection: { marginTop: 20, marginBottom: 40 },
  quickTitle: { fontWeight: "bold", color: "#374151", marginBottom: 12, fontSize: 14 },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickChip: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: "#10B981" },
  quickChipText: { color: "#065F46", fontSize: 12, fontWeight: "500" },
  inputBar: { flexDirection: "row", padding: 12, backgroundColor: "#fff", gap: 10, borderTopWidth: 1, borderColor: "#E5E7EB" },
  input: { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 25, paddingHorizontal: 18, height: 45, borderWidth: 1, borderColor: "#D1D5DB" },
  sendBtn: { width: 45, height: 45, backgroundColor: "#10B981", borderRadius: 22.5, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: "#9CA3AF" },
});