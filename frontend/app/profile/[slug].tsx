import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useAuth0 } from "react-native-auth0";

// Mock user profiles data
const mockUserProfiles: { [key: string]: any } = {
  joshua_l: {
    user_id: "user1",
    name: "Joshua Lee",
    slug: "joshua_l",
    pfp: "https://i.pravatar.cc/150?img=12",
    location: "Los Angeles, CA",
    isFriend: true,
  },
  sarah_c: {
    user_id: "user2",
    name: "Sarah Chen",
    slug: "sarah_c",
    pfp: "https://i.pravatar.cc/150?img=5",
    location: "New York, NY",
    isFriend: true,
  },
  alex_m: {
    user_id: "user3",
    name: "Alex Martinez",
    slug: "alex_m",
    pfp: "https://i.pravatar.cc/150?img=8",
    location: "Austin, TX",
    isFriend: false,
  },
};

// Mock events for other users
const mockOtherUserEvents: { [key: string]: any[] } = {
  joshua_l: [
    {
      event_id: "e1",
      name: "Trip to Japan",
      description: "Amazing journey through Tokyo and Kyoto",
      dateTime: "2024-03-15T14:30:00Z",
      coverUrl:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    },
    {
      event_id: "e2",
      name: "Sushi Making Class",
      description: "Learned authentic sushi techniques",
      dateTime: "2024-03-01T18:00:00Z",
      coverUrl:
        "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800",
    },
  ],
  sarah_c: [
    {
      event_id: "e3",
      name: "Beach Party",
      description: "Summer vibes at Santa Monica",
      dateTime: "2024-03-10T18:00:00Z",
      coverUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    },
  ],
  alex_m: [
    {
      event_id: "e4",
      name: "Tech Conference 2024",
      description: "Amazing talks and networking",
      dateTime: "2024-03-08T09:00:00Z",
      coverUrl:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    },
  ],
};

export default function ProfileDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const userData = mockUserProfiles[slug] || mockUserProfiles.joshua_l;
  const userEvents = mockOtherUserEvents[slug] || [];
  const {user} = useAuth0();

  return (
    <>
      <Stack.Screen
        options={{
          title: userData.name,
        }}
      />
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image source={{ uri: userData.pfp }} style={styles.profileImage} />
          <Text style={styles.name}>{user?.name ?? userData.name}</Text>
          <Text style={styles.username}>@{userData.slug}</Text>
          {userData.location && (
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#6b7280"
              />
              <Text style={styles.location}>{userData.location}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{userEvents.length}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>32</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {userData.isFriend ? (
              <>
                <Pressable style={styles.messageButton}>
                  <MaterialCommunityIcons
                    name="message-text"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.messageButtonText}>Message</Text>
                </Pressable>
                <Pressable style={styles.unfriendButton}>
                  <MaterialCommunityIcons
                    name="account-check"
                    size={20}
                    color="#6366f1"
                  />
                  <Text style={styles.unfriendButtonText}>Friends</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.addFriendButton}>
                <MaterialCommunityIcons
                  name="account-plus"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.addFriendButtonText}>Add Friend</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>{userData.name}'s Events</Text>

          {userEvents.map((event) => (
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
          {userEvents.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="calendar-blank"
                size={48}
                color="#d1d5db"
              />
              <Text style={styles.emptyText}>No events yet</Text>
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
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  unfriendButton: {
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
  unfriendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
  },
  addFriendButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
  },
  addFriendButtonText: {
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
});
