import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Mock conversation data
const mockConversations = [
  {
    group_id: "g1",
    name: "Tokyo Trip Squad",
    pfp: "https://i.pravatar.cc/150?img=1",
    lastMessage: {
      text: "Can't wait for next trip!",
      createdAt: "2024-03-18T15:30:00Z",
      sender: "Joshua",
    },
    unreadCount: 2,
  },
  {
    group_id: "g2",
    name: "Beach Party Crew",
    pfp: "https://i.pravatar.cc/150?img=2",
    lastMessage: {
      text: "That was so fun! 🏖️",
      createdAt: "2024-03-17T20:15:00Z",
      sender: "Sarah",
    },
    unreadCount: 0,
  },
  {
    group_id: "g3",
    name: "Tech Conference Friends",
    pfp: "https://i.pravatar.cc/150?img=3",
    lastMessage: {
      text: "Did you get the slides?",
      createdAt: "2024-03-16T10:45:00Z",
      sender: "Alex",
    },
    unreadCount: 5,
  },
  {
    group_id: "larry",
    name: "Larry (AI Assistant)",
    pfp: "https://api.dicebear.com/7.x/bottts/png?seed=larry",
    lastMessage: {
      text: "How can I help you today?",
      createdAt: "2024-03-15T09:00:00Z",
      sender: "Larry",
    },
    unreadCount: 0,
  },
];

export default function ChatListScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockConversations}
        keyExtractor={(item) => item.group_id}
        renderItem={({ item }) => (
          <Link href={`/chat/${item.group_id}`} asChild>
            <Pressable style={styles.conversationCard}>
              {/* Avatar */}
              <Image source={{ uri: item.pfp }} style={styles.avatar} />

              {/* Conversation Info */}
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.timestamp}>
                    {dayjs(item.lastMessage.createdAt).fromNow()}
                  </Text>
                </View>
                <View style={styles.lastMessageRow}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage.sender}: {item.lastMessage.text}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Chevron */}
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#9ca3af"
              />
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="message-outline"
              size={64}
              color="#d1d5db"
            />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with friends about events!
            </Text>
          </View>
        }
      />

      {/* New Group Button */}
      <Pressable style={styles.fab}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e5e7eb",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  timestamp: {
    fontSize: 12,
    color: "#6b7280",
  },
  lastMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
  },
  unreadBadge: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    marginTop: 100,
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
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
