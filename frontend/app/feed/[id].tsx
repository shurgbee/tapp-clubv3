import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import { useLocalSearchParams, Stack, Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";

// Mock event details
const mockEventDetails: { [key: string]: any } = {
  "1": {
    event: {
      event_id: "1",
      name: "Trip to Japan",
      description:
        "Amazing trip to Tokyo and Kyoto. Visited temples, tried authentic ramen, and experienced cherry blossoms! This was truly an unforgettable experience. We explored the historic districts, enjoyed traditional tea ceremonies, and made wonderful memories with friends.",
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
    attendees: [
      {
        user_id: "user1",
        name: "Joshua Lee",
        pfp: "https://i.pravatar.cc/150?img=12",
      },
      {
        user_id: "user2",
        name: "Sarah Chen",
        pfp: "https://i.pravatar.cc/150?img=5",
      },
      {
        user_id: "user3",
        name: "Alex Martinez",
        pfp: "https://i.pravatar.cc/150?img=8",
      },
    ],
    stats: {
      likes: 24,
      comments: 8,
    },
  },
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventData = mockEventDetails[id] || mockEventDetails["1"];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Event Details",
        }}
      />
      <ScrollView style={styles.container}>
        {/* Event Cover Image */}
        <Image
          source={{ uri: eventData.event.coverUrl }}
          style={styles.coverImage}
        />

        {/* Event Header */}
        <View style={styles.content}>
          <Text style={styles.eventName}>{eventData.event.name}</Text>

          {/* Date & Time */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color="#6366f1"
              />
              <Text style={styles.dateTimeText}>
                {dayjs(eventData.event.dateTime).format("MMMM D, YYYY")}
              </Text>
            </View>
            <View style={styles.dateTimeRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#6366f1"
              />
              <Text style={styles.dateTimeText}>
                {dayjs(eventData.event.dateTime).format("h:mm A")}
              </Text>
            </View>
          </View>

          {/* Poster Info */}
          <View style={styles.posterSection}>
            <Text style={styles.sectionTitle}>Posted by</Text>
            <Link
              href={`/profile/${eventData.poster.slug ?? "unknown"}` as any}
              asChild
            >
              <Pressable style={styles.posterCard}>
                <Image
                  source={{ uri: eventData.poster.pfp }}
                  style={styles.posterAvatar}
                />
                <Text style={styles.posterName}>{eventData.poster.name}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#9ca3af"
                />
              </Pressable>
            </Link>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              {eventData.event.description}
            </Text>
          </View>

          {/* Attendees */}
          <View style={styles.attendeesSection}>
            <Text style={styles.sectionTitle}>
              Attendees ({eventData.attendees.length})
            </Text>
            <View style={styles.attendeesGrid}>
              {eventData.attendees.map((attendee: any) => (
                <View key={attendee.user_id} style={styles.attendeeCard}>
                  <Image
                    source={{ uri: attendee.pfp }}
                    style={styles.attendeeAvatar}
                  />
                  <Text style={styles.attendeeName} numberOfLines={1}>
                    {attendee.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Engagement Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="heart" size={20} color="#ef4444" />
              <Text style={styles.statText}>{eventData.stats.likes} likes</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="comment"
                size={20}
                color="#6366f1"
              />
              <Text style={styles.statText}>
                {eventData.stats.comments} comments
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.likeButton}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={24}
                color="#fff"
              />
              <Text style={styles.likeButtonText}>Like</Text>
            </Pressable>
            <Pressable style={styles.commentButton}>
              <MaterialCommunityIcons
                name="comment-outline"
                size={24}
                color="#6366f1"
              />
              <Text style={styles.commentButtonText}>Comment</Text>
            </Pressable>
            <Pressable style={styles.shareButton}>
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={24}
                color="#6366f1"
              />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  coverImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#e5e7eb",
  },
  content: {
    padding: 16,
  },
  eventName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  dateTimeContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  posterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  posterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  posterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
  },
  posterName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  attendeesSection: {
    marginBottom: 24,
  },
  attendeesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  attendeeCard: {
    alignItems: "center",
    width: 80,
  },
  attendeeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e5e7eb",
    marginBottom: 8,
  },
  attendeeName: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  statsSection: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  likeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 12,
  },
  likeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  commentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
  },
  commentButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
  },
  shareButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#6366f1",
    borderRadius: 8,
    paddingHorizontal: 16,
  },
});
