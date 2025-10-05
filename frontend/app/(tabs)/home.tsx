import { Link, Stack } from "expo-router";
import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import type { FeedItem } from "../../types";
import { useAuth0 } from "react-native-auth0";

// Mock data for demonstration
const mockFeedData: FeedItem[] = [
  {
    event: {
      event_id: "1",
      name: "Trip to Japan",
      description:
        "Amazing trip to Tokyo and Kyoto. Visited temples, tried authentic ramen, and experienced cherry blossoms!",
      dateTime: "2024-03-15T14:30:00Z",
      coverUrl:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    },
    poster: {
      user_id: "user1",
      name: "Joshua Lee",
      pfp: "https://i.pravatar.cc/150?img=12",
      slug: "joshua_l",
    },
    post: {
      user_id: "user1",
      event_id: "1",
      messages: "Best trip ever! Can't wait to go back 🇯🇵",
      imageUrl:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    },
  },
  {
    event: {
      event_id: "2",
      name: "Beach Party",
      description: "Summer vibes with friends at Santa Monica Beach",
      dateTime: "2024-03-10T18:00:00Z",
      coverUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    },
    poster: {
      user_id: "user2",
      name: "Sarah Chen",
      pfp: "https://i.pravatar.cc/150?img=5",
      slug: "sarah_c",
    },
  },
  {
    event: {
      event_id: "3",
      name: "Tech Conference 2024",
      description:
        "Amazing talks on AI and web development. Met so many cool people!",
      dateTime: "2024-03-08T09:00:00Z",
      coverUrl:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    },
    poster: {
      user_id: "user3",
      name: "Alex Martinez",
      pfp: "https://i.pravatar.cc/150?img=8",
      slug: "alex_m",
    },
  },
];


export default function HomeScreen() {
  const {user} = useAuth0()
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
        data={mockFeedData}
        keyExtractor={(item) => String(item.event.event_id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Header with poster info */}
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: item.poster.pfp ?? "" }}
                style={styles.avatar}
              />
              <Link
                href={`/profile/${item.poster.slug ?? "unknown"}` as any}
                asChild
              >
                <Pressable>
                  <Text style={styles.posterName}>{item.poster.name}</Text>
                </Pressable>
              </Link>
            </View>

            {/* Event cover image */}
            {item.event.coverUrl && (
              <Image
                source={{ uri: item.event.coverUrl }}
                style={styles.coverImage}
              />
            )}

            {/* Event details */}
            <View style={styles.cardContent}>
              <Text style={styles.eventName}>{item.event.name}</Text>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.metaText}>
                  {dayjs(item.event.dateTime).format("M/D/YYYY")}
                </Text>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.metaText}>
                  {dayjs(item.event.dateTime).format("h:mm A")}
                </Text>
              </View>
              {item.event.description && (
                <Text style={styles.description} numberOfLines={3}>
                  About: {item.event.description}
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
            <MaterialCommunityIcons
              name="calendar-blank"
              size={64}
              color="#d1d5db"
            />
            <Text style={styles.emptyText}>
              No recent events from friends yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Tap + to post your first event!
            </Text>
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
