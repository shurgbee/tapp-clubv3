import { useState, useEffect, useCallback, useRef } from "react";
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import {
  getGroupMessages,
  sendMessage,
  ChatMessage,
  callLarryAgent,
} from "../../api";

interface MessageWithUI extends ChatMessage {
  id: string;
  isMe: boolean;
  posterPfp?: string;
}

// Larry's user ID - this should match the backend's Larry user
const LARRY_USER_ID = "00000000-0000-0000-0000-000000000001";
const LARRY_AVATAR_URL =
  "https://cdn.discordapp.com/attachments/1418061830181359707/1424427716182282320/image.png?ex=68e3e930&is=68e297b0&hm=dcc3f1c6deef96ef7df8744797a57454cae09cfb2e0e626aca8cba4e6039d5d4&";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { uuid } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<MessageWithUI[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [groupName, setGroupName] = useState("Chat");
  const [larryTyping, setLarryTyping] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!id || !uuid) return;

    try {
      const data = await getGroupMessages(id);

      // Transform messages to include UI properties
      const messagesWithUI: MessageWithUI[] = data.map((msg, index) => ({
        ...msg,
        id: `${msg.poster_id}-${msg.dateTime}-${index}`,
        isMe: msg.poster_id === uuid,
        posterPfp:
          msg.poster_id === LARRY_USER_ID ||
          (typeof msg.poster_name === "string" &&
            msg.poster_name.toLowerCase().includes("larry"))
            ? LARRY_AVATAR_URL
            : `https://api.dicebear.com/7.x/avataaars/png?seed=${msg.poster_id}`,
      }));

      setMessages(messagesWithUI);

      // Extract group name from first message or use default
      if (messagesWithUI.length > 0) {
        // Group name should come from a separate API call, but for now use a placeholder
        setGroupName("Group Chat");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [id, uuid]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !uuid || !id || sending) return;

    const messageText = inputText.trim();
    const containsLarryMention = messageText.toLowerCase().includes("@larry");
    setSending(true);
    setInputText("");

    try {
      // Send the user's message
      const sentMessage = await sendMessage(id, {
        user_id: uuid,
        messageType: "text",
        messageContent: messageText,
      });

      const newMessage: MessageWithUI = {
        ...sentMessage,
        id: `${sentMessage.poster_id}-${sentMessage.dateTime}-${Date.now()}`,
        isMe: true,
        posterPfp: `https://api.dicebear.com/7.x/avataaars/png?seed=${uuid}`,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // If message contains @Larry, call the AI agent
      if (containsLarryMention) {
        await handleLarryResponse(messageText);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
      setInputText(messageText); // Restore the message
    } finally {
      setSending(false);
    }
  };

  const handleLarryResponse = async (userMessage: string) => {
    setLarryTyping(true);

    try {
      console.log("🤖 Larry is thinking...");

      // Call the AI agent
      const aiResponse = await callLarryAgent(userMessage);

      // Create Larry's message (display only, not saved to backend)
      // We don't post to backend because Larry user may not exist in DB
      const larryMessageWithUI: MessageWithUI = {
        poster_id: LARRY_USER_ID,
        poster_name: "Larry (AI)",
        messageType: "text",
        messageContent: aiResponse,
        dateTime: new Date().toISOString(),
        id: `larry-${Date.now()}`,
        isMe: false,
        posterPfp: LARRY_AVATAR_URL,
      };

      setMessages((prev) => [...prev, larryMessageWithUI]);

      // Scroll to bottom to show Larry's response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      console.log("🤖 Larry responded!");
    } catch (error) {
      console.error("Error getting Larry response:", error);

      // Post an error message from Larry
      const errorMessage: MessageWithUI = {
        poster_id: LARRY_USER_ID,
        poster_name: "Larry (AI)",
        messageType: "text",
        messageContent:
          "Sorry, I'm having trouble processing your request right now. Please try again later! 🤖",
        dateTime: new Date().toISOString(),
        id: `larry-error-${Date.now()}`,
        isMe: false,
        posterPfp: LARRY_AVATAR_URL,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLarryTyping(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: groupName }} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} mode="padding">
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
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={64}
                color="#d1d5db"
              />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
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
                  <Text style={styles.messageSender}>{item.poster_name}</Text>
                )}
                <Text
                  style={[
                    styles.messageText,
                    item.isMe && styles.myMessageText,
                  ]}
                >
                  {item.messageContent}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    item.isMe && styles.myMessageTime,
                  ]}
                >
                  {dayjs(item.dateTime).format("h:mm A")}
                </Text>
              </View>

              {item.isMe && <View style={styles.avatarPlaceholder} />}
            </View>
          )}
        />

        {/* Larry Typing Indicator */}
        {larryTyping && (
          <View style={styles.typingIndicator}>
            <Image
              source={{ uri: LARRY_AVATAR_URL }}
              style={styles.typingAvatar}
            />
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Larry is typing</Text>
              <View style={styles.typingDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>
        )}

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
            editable={!sending}
          />

          <Pressable
            style={styles.sendButton}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={24}
                color={inputText.trim() ? "#6366f1" : "#d1d5db"}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  messagesList: {
    // flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
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
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
  },
  typingBubble: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9ca3af",
  },
});
