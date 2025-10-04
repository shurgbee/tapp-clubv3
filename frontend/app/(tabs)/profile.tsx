import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";

// Mock user data
const mockUserData = {
  user_id: "current-user",
  name: "Davis Johnson",
  slug: "davis_j",
  pfp: "https://i.pravatar.cc/150?img=33",
  location: "San Francisco, CA",
};

// Mock user events
const mockUserEvents = [
  {
    event_id: "e1",
    name: "Coffee with team",
    description: "Weekly team sync at Blue Bottle",
    dateTime: "2024-03-18T10:00:00Z",
    coverUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
  },
  {
    event_id: "e2",
    name: "Weekend Hiking",
    description: "Beautiful trails in Marin Headlands",
    dateTime: "2024-03-16T08:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
  },
  {
    event_id: "e3",
    name: "Music Festival",
    description: "Amazing performances by local artists",
    dateTime: "2024-03-12T19:00:00Z",
    coverUrl:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
  },
];

export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Profile",
          headerRight: () => (
            <Pressable style={styles.settingsButton}>
              <MaterialCommunityIcons name="cog" size={24} color="#6366f1" />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: mockUserData.pfp }}
            style={styles.profileImage}
          />
          <Text style={styles.name}>{mockUserData.name}</Text>
          <Text style={styles.username}>@{mockUserData.slug}</Text>
          {mockUserData.location && (
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#6b7280"
              />
              <Text style={styles.location}>{mockUserData.location}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>47</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>My Events</Text>

          {mockUserEvents.map((event) => (
            <View key={event.event_id} style={styles.eventCard}>
              <Image
                source={{ uri: event.coverUrl }}
                style={styles.eventImage}
              />
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
                <View style={styles.eventMeta}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={14}
                    color="#6b7280"
                  />
                  <Text style={styles.eventDate}>
                    {dayjs(event.dateTime).format("MMM D, YYYY")}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#9ca3af"
              />
            </View>
          ))}

          {/* Empty State */}
          {mockUserEvents.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="calendar-blank"
                size={48}
                color="#d1d5db"
              />
              <Text style={styles.emptyText}>No events yet</Text>
              <Text style={styles.emptySubtext}>
                Start sharing your experiences!
              </Text>
            </View>
          )}
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
  settingsButton: {
    marginRight: 12,
  },
  header: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 24,
  },
  location: {
    fontSize: 14,
    color: "#6b7280",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
    marginBottom: 24,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },
  editButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  eventsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    gap: 12,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
});
