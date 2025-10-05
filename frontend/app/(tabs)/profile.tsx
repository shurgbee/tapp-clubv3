import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, Link, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useAuth } from "../../contexts/AuthContext";
import { getUserProfile } from "../../api/users";

export default function ProfileScreen() {
  const router = useRouter();
  const { uuid, user } = useAuth();

  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userProfile", uuid],
    queryFn: () => getUserProfile(uuid),
    enabled: !!uuid,
  });

  const handleEventPress = (event: any) => {
    router.push({
      pathname: "/post/create",
      params: {
        event_id: event.event_id,
        event_name: event.name,
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Profile",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Profile",
          }}
        />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color="#ef4444"
          />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <Text style={styles.errorSubtext}>
            {error instanceof Error ? error.message : "Please try again"}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </>
    );
  }

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
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: profileData?.pfp }}
            style={styles.profileImage}
          />
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <Text style={styles.username}>@{profileData?.username}</Text>
          {profileData?.description && (
            <Text style={styles.description}>{profileData.description}</Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {profileData?.event_count || 0}
              </Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {profileData?.friend_count || 0}
              </Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <Link href="/profile/edit" asChild>
            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
          </Link>
        </View>

        {/* Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>My Events</Text>

          {profileData?.latest_events?.map((event) => (
            <Pressable
              key={event.event_id}
              style={styles.eventCard}
              onPress={() => handleEventPress(event)}
            >
              <Image
                source={{
                  uri:
                    event.first_picture_url || "https://via.placeholder.com/80",
                }}
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
              <View style={styles.createPostButton}>
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={28}
                  color="#6366f1"
                />
              </View>
            </Pressable>
          ))}

          {/* Empty State */}
          {(!profileData?.latest_events ||
            profileData.latest_events.length === 0) && (
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
  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 32,
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
  createPostButton: {
    padding: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
