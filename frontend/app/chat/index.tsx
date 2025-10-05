import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "../../contexts/AuthContext";
import { getUserConversations, GroupPreview } from "../../api";

dayjs.extend(relativeTime);

export default function ChatListScreen() {
  const { uuid } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<GroupPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!uuid) return;

    try {
      setError(null);
      const data = await getUserConversations(uuid);
      setConversations(data);
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const handleCreateGroup = () => {
    // TODO: Navigate to group creation screen
    console.log("Create new group");
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchConversations}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.group_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Link href={`/chat/${item.group_id}`} asChild>
            <Pressable style={styles.conversationCard}>
              {/* Avatar */}
              <Image
                source={{
                  uri:
                    item.pfp ||
                    `https://api.dicebear.com/7.x/shapes/png?seed=${item.group_id}`,
                }}
                style={styles.avatar}
              />

              {/* Conversation Info */}
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.groupName}>{item.group_name}</Text>
                  {item.last_message_timestamp && (
                    <Text style={styles.timestamp}>
                      {dayjs(item.last_message_timestamp).fromNow()}
                    </Text>
                  )}
                </View>
                <View style={styles.lastMessageRow}>
                  {item.last_message_content ? (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.last_message_poster_name}:{" "}
                      {item.last_message_content}
                    </Text>
                  ) : (
                    <Text style={[styles.lastMessage, styles.noMessages]}>
                      No messages yet
                    </Text>
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
      <Pressable style={styles.fab} onPress={handleCreateGroup}>
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
  noMessages: {
    fontStyle: "italic",
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
