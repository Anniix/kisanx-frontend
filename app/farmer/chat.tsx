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
  ActivityIndicator,
  Alert,
} from "react-native";
import { getToken } from "../../utils/auth";
import { API_URL } from "../../utils/api";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

const INITIAL_MESSAGE: Message = {
  id: 1,
  text: "Namaste! 🌱 Main KisanX AI hun. Aapki fasal, mitti, khad, keede ya bazar — kisi bhi cheez ke baare mein poochh sakte hain!",
  sender: "bot",
};

const QUICK_QUESTIONS = [
  "Meri fasal ke liye khad batao",
  "Kaunsi fasal lagaun is season?",
  "Keede maar dawa kaunsi use karein?",
  "Mitti ki janch kaise karein?",
];

export default function Chat() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, typing]);

  const sendMessage = async (text?: string) => {
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

    try {
      const token = await getToken();

      // Build conversation history (exclude initial bot greeting for API)
      const allMessages = [...messages, userMessage];
      const apiMessages = allMessages.filter(
        (m) => !(m.id === 1 && m.sender === "bot")
      );

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed");

      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.reply,
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Maafi chahta hun, abhi AI se connect nahi ho pa raha. Thodi der baad dobara try karein. 🙏",
          sender: "bot",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const clearChat = () => {
    Alert.alert("Chat Clear Karein?", "Saari baatein hat jaayengi.", [
      { text: "Raho", style: "cancel" },
      {
        text: "Haan, Clear Karo",
        style: "destructive",
        onPress: () => setMessages([INITIAL_MESSAGE]),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#064E3B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiDot} />
          <View>
            <Text style={styles.title}>KisanX AI</Text>
            <Text style={styles.subtitle}>Farming Assistant</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubbleWrapper,
              msg.sender === "user" ? styles.userWrapper : styles.botWrapper,
            ]}
          >
            {msg.sender === "bot" && (
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>🌿</Text>
              </View>
            )}
            <View
              style={[
                styles.bubble,
                msg.sender === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={
                  msg.sender === "user" ? styles.userText : styles.botText
                }
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {/* Typing indicator */}
        {typing && (
          <View style={[styles.bubbleWrapper, styles.botWrapper]}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>🌿</Text>
            </View>
            <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.typingText}>AI soch raha hai...</Text>
            </View>
          </View>
        )}

        {/* Quick questions — show only at start */}
        {messages.length === 1 && !typing && (
          <View style={styles.quickSection}>
            <Text style={styles.quickTitle}>Jaldi poochhen 👇</Text>
            {QUICK_QUESTIONS.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickChip}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.quickChipText}>{q}</Text>
                <Ionicons name="arrow-forward" size={14} color="#10B981" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Fasal ke baare mein poochhen..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
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
  container: { flex: 1, backgroundColor: "#F0FDF4" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#D1FAE5",
    elevation: 3,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  title: { fontSize: 16, fontWeight: "800", color: "#064E3B" },
  subtitle: { fontSize: 11, color: "#6B7280" },
  clearBtn: { padding: 4 },

  // Messages
  messagesContainer: { padding: 16, paddingBottom: 8 },
  bubbleWrapper: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  botWrapper: { justifyContent: "flex-start" },
  userWrapper: { justifyContent: "flex-end" },

  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  botAvatarText: { fontSize: 16 },

  bubble: {
    padding: 14,
    borderRadius: 20,
    maxWidth: "78%",
  },
  botBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#10B981",
    borderBottomRightRadius: 4,
    elevation: 2,
  },
  botText: { color: "#1F2937", fontSize: 14, lineHeight: 21 },
  userText: { color: "#fff", fontSize: 14, lineHeight: 21 },

  // Typing
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { color: "#6B7280", fontSize: 13 },

  // Quick questions
  quickSection: { marginTop: 8 },
  quickTitle: { fontSize: 13, color: "#6B7280", marginBottom: 8, marginLeft: 40 },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginLeft: 40,
    elevation: 1,
  },
  quickChipText: { fontSize: 13, color: "#065F46", fontWeight: "600" },

  // Input
  inputBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    alignItems: "flex-end",
    gap: 10,
    borderTopWidth: 1,
    borderColor: "#D1FAE5",
    elevation: 5,
  },
  input: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    fontSize: 14,
    color: "#1F2937",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#10B981",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  sendBtnDisabled: { backgroundColor: "#A7F3D0" },
});
