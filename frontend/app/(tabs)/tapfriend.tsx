import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  Modal,
} from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNFCFriendTap } from "../../hooks/useNFCFriendTap";
import { NFCScanPopup } from "../../components/NFCScanPopup";
import type { User } from "../../types";

// Mock current user - replace with actual auth context in production
const MOCK_CURRENT_USER: User = {
  user_id: "user-123",
  name: "Demo User",
  slug: "demo_user",
  pfp: undefined,
};

// Mock friend data for testing - these would come from other users' NFC tags
// You can write these to NFC tags for testing different scenarios
const MOCK_FRIENDS = [
  { uuid: "user-456", name: "Alice Johnson", slug: "alice_j" },
  { uuid: "user-789", name: "Bob Smith", slug: "bobsmith" },
  { uuid: "user-321", name: "Carol Davis", slug: "carol_d" },
];

export default function TapFriendScreen() {
  const [lastAddedFriend, setLastAddedFriend] = useState<{
    name: string;
    uuid: string;
    slug?: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showNewPopup, setShowNewPopup] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Handle friend detection
  const handleFriendDetected = useCallback(
    async (friendData: { uuid: string; name: string; slug?: string }) => {
      console.log("Friend detected:", friendData);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock successful friend addition
      const mockFriendshipData = {
        friendship_id: `friendship-${Date.now()}`,
        created_at: new Date().toISOString(),
        friend: {
          user_id: friendData.uuid,
          name: friendData.name,
          slug: friendData.slug,
          pfp: undefined, // Could add mock avatar URL here
        },
      };

      console.log("Mock friendship created:", mockFriendshipData);

      // Update UI with friend data
      setLastAddedFriend(friendData);
      setShowSuccessModal(true);

      // TODO: In production, replace with actual API call:
      // const response = await fetch(`${API_BASE_URL}/friends/tap`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     me_user_id: MOCK_CURRENT_USER.user_id,
      //     other_user_uuid: friendData.uuid,
      //   }),
      // });
    },
    []
  );

  const {
    isActive,
    isWriting,
    isReading,
    isSupported,
    lastDetectedFriend,
    startSession,
    stopSession,
  } = useNFCFriendTap({
    currentUser: MOCK_CURRENT_USER,
    onFriendDetected: handleFriendDetected,
    autoStartOnMount: false,
  });

  // Pulse animation for scanning state
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  const handleStartTap = async () => {
    if (!isSupported) {
      Alert.alert(
        "NFC Not Available",
        "NFC is not supported on this device or in the simulator. Please test on a physical device with NFC enabled.",
        [{ text: "OK" }]
      );
      return;
    }

    await startSession();
  };

  const handleCancelScan = async () => {
    await stopSession();
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Friend",
          headerRight: () => (
            <Pressable
              onPress={() => setShowNewPopup(true)}
              style={{ marginRight: 16 }}
            >
              <MaterialCommunityIcons
                name="test-tube"
                size={24}
                color="#6366f1"
              />
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              isActive && styles.iconScanning,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <MaterialCommunityIcons
              name={
                isActive
                  ? isReading
                    ? "nfc-search-variant"
                    : "nfc-variant"
                  : "nfc-tap"
              }
              size={80}
              color={isActive ? "#6366f1" : "#9ca3af"}
            />
          </Animated.View>

          {/* Status */}
          {isActive && (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isWriting
                  ? "Writing your profile..."
                  : isReading
                  ? "Reading friend's profile..."
                  : "Ready to tap"}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>
            {isActive ? "Hold devices together" : "Tap to Add Friend"}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {isActive
              ? "Keep your devices back-to-back until the connection is established..."
              : "Tap your phone with a friend's phone to instantly connect and share events together."}
          </Text>

          {/* NFC Requirements */}
          {!isActive && (
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>Requirements:</Text>
              <View style={styles.requirementItem}>
                <MaterialCommunityIcons
                  name={isSupported ? "check-circle" : "close-circle"}
                  size={20}
                  color={isSupported ? "#10b981" : "#ef4444"}
                />
                <Text style={styles.requirementText}>
                  NFC {isSupported ? "is available" : "not supported"}
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#10b981"
                />
                <Text style={styles.requirementText}>
                  Hold phones back-to-back
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#10b981"
                />
                <Text style={styles.requirementText}>
                  Keep them together for 2-3 seconds
                </Text>
              </View>
            </View>
          )}

          {/* Last Added Friend */}
          {lastAddedFriend && !isActive && (
            <View style={styles.successCard}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#10b981"
              />
              <View style={styles.successCardContent}>
                <Text style={styles.successLabel}>Recently added:</Text>
                <Text style={styles.successText}>{lastAddedFriend.name}</Text>
              </View>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            style={[styles.actionButton, isActive && styles.cancelButton]}
            onPress={isActive ? handleCancelScan : handleStartTap}
          >
            <Text style={styles.actionButtonText}>
              {isActive ? "Cancel" : "Start Tap"}
            </Text>
          </Pressable>

          {/* Alternative Method */}
          {!isActive && (
            <Pressable style={styles.alternativeButton}>
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={20}
                color="#6366f1"
              />
              <Text style={styles.alternativeButtonText}>
                Use QR Code Instead
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeSuccessModal}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons
                name="check-circle"
                size={64}
                color="#10b981"
              />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Friend Added! 🎉</Text>

            {/* Friend Info */}
            {lastAddedFriend && (
              <View style={styles.friendInfoCard}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {lastAddedFriend.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.friendDetails}>
                  <Text style={styles.friendName}>{lastAddedFriend.name}</Text>
                  {lastAddedFriend.slug && (
                    <Text style={styles.friendSlug}>
                      @{lastAddedFriend.slug}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Description */}
            <Text style={styles.modalDescription}>
              You and {lastAddedFriend?.name || "your friend"} are now
              connected! You can now see each other's events and chat together.
            </Text>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={closeSuccessModal}
              >
                <Text style={styles.modalButtonTextPrimary}>Awesome!</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  closeSuccessModal();
                  // Navigate to profile or chat
                }}
              >
                <MaterialCommunityIcons
                  name="message"
                  size={18}
                  color="#6366f1"
                />
                <Text style={styles.modalButtonTextSecondary}>
                  Send Message
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* New Popup Component */}
      <NFCScanPopup
        visible={showNewPopup}
        onClose={() => setShowNewPopup(false)}
        friendData={{
          uuid: "mock-456",
          name: "Jane Smith",
          slug: "janesmith",
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconScanning: {
    backgroundColor: "#eef2ff",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  requirementsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: "#6b7280",
  },
  successCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 24,
  },
  successCardContent: {
    flex: 1,
  },
  successLabel: {
    fontSize: 12,
    color: "#166534",
    marginBottom: 2,
  },
  successText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
  },
  actionButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  alternativeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    marginTop: 12,
  },
  alternativeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6366f1",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },
  friendInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  friendAvatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  friendSlug: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalDescription: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    padding: 14,
  },
  modalButtonPrimary: {
    backgroundColor: "#6366f1",
  },
  modalButtonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
  },
});
