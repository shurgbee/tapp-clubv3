import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock messages data
const mockMessages: { [key: string]: any[] } = {
  g1: [
    {
      id: "m1",
      poster_id: "user1",
      posterName: "Joshua Lee",
      posterPfp: "https://i.pravatar.cc/150?img=12",
      messageType: "text",
      messageContent: "Hey everyone! Should we plan another trip soon?",
      createdAt: "2024-03-18T14:00:00Z",
      isMe: false,
    },
    {
      id: "m2",
      poster_id: "current-user",
      posterName: "You",
      posterPfp: "https://i.pravatar.cc/150?img=33",
      messageType: "text",
      messageContent: "Yes! I'm thinking about visiting Korea next",
      createdAt: "2024-03-18T14:15:00Z",
      isMe: true,
    },
    {
      id: "m3",
      poster_id: "user2",
      posterName: "Sarah Chen",
      posterPfp: "https://i.pravatar.cc/150?img=5",
      messageType: "text",
      messageContent: "Count me in! 🇰🇷",
      createdAt: "2024-03-18T14:20:00Z",
      isMe: false,
    },
    {
      id: "m4",
      poster_id: "current-user",
      posterName: "You",
      posterPfp: "https://i.pravatar.cc/150?img=33",
      messageType: "text",
      messageContent: "@Larry can you suggest good places to visit in Seoul?",
      createdAt: "2024-03-18T15:00:00Z",
      isMe: true,
    },
    {
      id: "m5",
      poster_id: "larry",
      posterName: "Larry (AI)",
      posterPfp: "https://api.dicebear.com/7.x/bottts/png?seed=larry",
      messageType: "text",
      messageContent:
        "Great choice! Here are some must-visit places in Seoul:\n\n1. Gyeongbokgung Palace - Historic royal palace\n2. Bukchon Hanok Village - Traditional Korean houses\n3. Myeongdong - Shopping and street food\n4. N Seoul Tower - Panoramic city views\n5. Hongdae - Art and nightlife district\n\nWould you like more specific recommendations?",
      createdAt: "2024-03-18T15:00:30Z",
      isMe: false,
    },
    {
      id: "m6",
      poster_id: "user1",
      posterName: "Joshua Lee",
      posterPfp: "https://i.pravatar.cc/150?img=12",
      messageType: "text",
      messageContent: "Can't wait for next trip!",
      createdAt: "2024-03-18T15:30:00Z",
      isMe: false,
    },
  ],
  larry: [
    {
      id: "lm1",
      poster_id: "larry",
      posterName: "Larry (AI)",
      posterPfp: "https://api.dicebear.com/7.x/bottts/png?seed=larry",
      messageType: "text",
      messageContent:
        "Hi! I'm Larry, your AI assistant. I can help you with event planning, suggestions, and more. Just mention me with @Larry in any group chat!",
      createdAt: "2024-03-15T09:00:00Z",
      isMe: false,
    },
  ],
};

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState(mockMessages[id] || []);
  const [inputText, setInputText] = useState("");

  const groupName =
    id === "larry" ? "Larry (AI Assistant)" : "Tokyo Trip Squad";

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: `temp-${Date.now()}`,
      poster_id: "current-user",
      posterName: "You",
      posterPfp: "https://i.pravatar.cc/150?img=33",
      messageType: "text",
      messageContent: inputText,
      createdAt: new Date().toISOString(),
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setInputText("");

    // Mock Larry response if @Larry is mentioned
    if (inputText.toLowerCase().includes("@larry") || id === "larry") {
      setTimeout(() => {
        const larryResponse = {
          id: `larry-${Date.now()}`,
          poster_id: "larry",
          posterName: "Larry (AI)",
          posterPfp: "https://api.dicebear.com/7.x/bottts/png?seed=larry",
          messageType: "text",
          messageContent:
            "I received your message! In a real app, I would process your request and provide helpful suggestions. This is a mock response for demonstration.",
          createdAt: new Date().toISOString(),
          isMe: false,
        };
        setMessages((prev) => [...prev, larryResponse]);
      }, 1000);
    }
  };

  return (
    <>
    <SafeAreaView
      style={styles.container}
      mode="padding"
      >
      <Stack.Screen
        options={{
          title: groupName,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.isMe
                ? styles.myMessageContainer
                : styles.otherMessageContainer,
            ]}
          >
            {!item.isMe && (
              <Image
                source={{ uri: item.posterPfp }}
                style={styles.messageAvatar}
              />
            )}

            <View
              style={[
                styles.messageBubble,
                item.isMe ? styles.myMessage : styles.otherMessage,
              ]}
            >
              {!item.isMe && (
                <Text style={styles.messageSender}>{item.posterName}</Text>
              )}
              <Text
                style={[styles.messageText, item.isMe && styles.myMessageText]}
              >
                {item.messageContent}
              </Text>
              <Text
                style={[styles.messageTime, item.isMe && styles.myMessageTime]}
              >
                {dayjs(item.createdAt).format("h:mm A")}
              </Text>
            </View>

            {item.isMe && <View style={styles.avatarPlaceholder} />}
          </View>
        )}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <Pressable style={styles.attachButton}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={24}
            color="#6366f1"
          />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />

        <Pressable
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={24}
            color={inputText.trim() ? "#6366f1" : "#d1d5db"}
          />
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  messagesList: {
    // flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
  },
  avatarPlaceholder: {
    width: 32,
  },
  messageBubble: {
    maxWidth: "70%",
    borderRadius: 16,
    padding: 12,
  },
  myMessage: {
    backgroundColor: "#6366f1",
  },
  otherMessage: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
  },
  myMessageTime: {
    color: "#e0e7ff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: "#111827",
  },
  sendButton: {
    padding: 8,
  },
});
