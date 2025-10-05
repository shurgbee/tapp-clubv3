import { Link, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useAuth } from "../../contexts/AuthContext";

type FeedApiItem = {
  post_id: string;
  title: string;
  description: string;
  created_at: string; // ISO
  user: {
    user_id: string;
    username: string;
    pfp: string;
  };
  event: {
    event_id: string;
    name: string;
  };
  pictures: Array<{ picture_url: string }>;
};

export default function HomeScreen() {
  const { user, uuid } = useAuth();
  const [feed, setFeed] = useState<FeedApiItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/feed`);
        if (!resp.ok) {
          throw new Error(`Failed to load feed (${resp.status})`);
        }
        const data = (await resp.json()) as FeedApiItem[];
        setFeed(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load feed");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
  }, []);
  return (
    <>
      <Stack.Screen
        options={{
          title: user?.name ? `Welcome, ${user.name}` : "TappClub",
          headerRight: () => (
            <Link href="/chat" asChild={true}>
              <Pressable style={styles.chatButton}>
                <MaterialCommunityIcons name="chat" size={24} color="#6366f1" />
              </Pressable>
            </Link>
          ),
        }}
      />
      <FlatList
        style={styles.container}
        data={feed ?? []}
        keyExtractor={(item) => String(item.post_id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Header with poster info */}
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: item.user.pfp ?? "" }}
                style={styles.avatar}
              />
              <Link href={`/profile/${item.user.user_id}` as any} asChild>
                <Pressable>
                  <Text style={styles.posterName}>{item.user.username}</Text>
                </Pressable>
              </Link>
            </View>

            {/* Event cover image */}
            {item.pictures && item.pictures[0]?.picture_url && (
              <Image
                source={{ uri: item.pictures[0].picture_url }}
                style={styles.coverImage}
              />
            )}

            {/* Event details */}
            <View style={styles.cardContent}>
              <Text style={styles.eventName}>
                {item.title || item.event.name}
              </Text>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.metaText}>
                  {dayjs(item.created_at).format("M/D/YYYY")}
                </Text>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.metaText}>
                  {dayjs(item.created_at).format("h:mm A")}
                </Text>
              </View>
              {item.description && (
                <Text style={styles.description} numberOfLines={3}>
                  {item.description}
                </Text>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable style={styles.actionButton}>
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={24}
                  color="#6b7280"
                />
              </Pressable>
              <Pressable style={styles.actionButton}>
                <MaterialCommunityIcons
                  name="comment-outline"
                  size={24}
                  color="#6b7280"
                />
              </Pressable>
              <Pressable style={styles.actionButton}>
                <MaterialCommunityIcons
                  name="share-variant-outline"
                  size={24}
                  color="#6b7280"
                />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#6366f1" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="calendar-blank"
                  size={64}
                  color="#d1d5db"
                />
                <Text style={styles.emptyText}>
                  {error ? error : "No recent posts yet."}
                </Text>
                {!error && (
                  <Text style={styles.emptySubtext}>
                    Tap + to post your first event!
                  </Text>
                )}
              </>
            )}
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  chatButton: {
    marginRight: 12,
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 8,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  posterName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  coverImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#e5e7eb",
  },
  cardContent: {
    padding: 12,
    gap: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#6b7280",
    marginRight: 12,
  },
  description: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
});
