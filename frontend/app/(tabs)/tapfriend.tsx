import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { useNFCRead } from "@/hooks/useNFCRead";
import { useNFCEmulate } from "@/hooks/useNFCEmulate";
import { FriendSuccessPopup, FriendSearchPopup } from "@/components";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.example.com";

export default function TapFriendScreen() {
  const { uuid } = useAuth();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [friendData, setFriendData] = useState<{
    uuid: string;
    name: string;
    slug?: string;
  } | null>(null);

  // Initialize NFC reading hook
  const { isSupported, isEnabled, isReading, readHCEDevice, cancelRead } =
    useNFCRead({
      autoInit: true,
      showAlerts: true, // Show alerts for HCE reading
    });

  const handleRead = useCallback(() => {
    console.log("Someone tapped me!");
    // The receiver doesn't need to do anything - they're just broadcasting their UUID
  }, []);

  // Send friend request to backend
  const sendFriendRequest = useCallback(
    async (addresseeId: string) => {
      if (!uuid) {
        console.error("No user UUID available");
        return false;
      }

      try {
        console.log("🔄 Sending friend request...");
        console.log("Requester (me):", uuid);
        console.log("Addressee (them):", addresseeId);

        const response = await fetch(`${API_BASE_URL}/friend-requests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requester_id: uuid,
            addressee_id: addresseeId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Friend request failed:", errorData);

          if (response.status === 409) {
            Alert.alert(
              "Already Friends",
              "You already have a friend request with this user."
            );
          } else {
            throw new Error(
              errorData.detail || "Failed to send friend request"
            );
          }
          return false;
        }

        const data = await response.json();
        console.log("✅ Friend request sent:", data);
        return true;
      } catch (error) {
        console.error("Error sending friend request:", error);
        Alert.alert(
          "Error",
          "Failed to send friend request. Please try again."
        );
        return false;
      }
    },
    [uuid]
  );

  // Handle tapping a friend's phone (reading HCE device)
  const handleTapFriend = useCallback(async () => {
    try {
      setShowSearchPopup(true);
      const result = await readHCEDevice();
      setShowSearchPopup(false);

      if (result.success) {
        console.log("✅ Successfully read HCE device!");
        console.log("Content:", result.decodedText);
        console.log("Raw data:", result.rawData);

        const friendUuid = result.decodedText;

        if (!friendUuid) {
          Alert.alert("Error", "Could not read friend's ID");
          return;
        }

        // Send friend request
        const success = await sendFriendRequest(friendUuid);

        if (success) {
          // Show success popup
          setFriendData({
            uuid: friendUuid,
            name: "New Friend",
            slug: undefined,
          });
          setShowSuccessPopup(true);
        }
      } else if (result.cancelled) {
        console.log("📱 NFC read cancelled by user");
      } else {
        console.error("❌ Failed to read HCE device:", result.error);
      }
    } catch (error) {
      console.error("Error reading HCE device:", error);
      setShowSearchPopup(false);
    }
  }, [readHCEDevice, sendFriendRequest]);

  // Initialize NFC emulation hook - broadcast current user's UUID
  const {
    isEmulating,
    startEmulation,
    stopEmulation,
    loading: emulateLoading,
  } = useNFCEmulate({
    content: uuid || "no-user-id",
    onRead: handleRead,
  });

  // Handle Get Tapped button press
  const handleGetTapped = useCallback(async () => {
    if (isEmulating) {
      await stopEmulation();
      setShowSearchPopup(false);
    } else {
      setShowSearchPopup(true);
      await startEmulation();
    }
  }, [isEmulating, startEmulation, stopEmulation]);

  // Handle cancel from search popup
  const handleCancelSearch = useCallback(() => {
    setShowSearchPopup(false);
    if (isReading) {
      cancelRead();
    }
    if (isEmulating) {
      stopEmulation();
    }
  }, [isReading, isEmulating, cancelRead, stopEmulation]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Friend",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setShowSearchPopup(true)}
                style={{ padding: 8 }}
              >
                <MaterialCommunityIcons
                  name="radar"
                  size={24}
                  color="#6366f1"
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  setFriendData({
                    uuid: "test-123",
                    name: "Test User",
                    slug: "testuser",
                  });
                  setShowSuccessPopup(true);
                }}
                style={{ padding: 8 }}
              >
                <MaterialCommunityIcons
                  name="account-check"
                  size={24}
                  color="#10b981"
                />
              </Pressable>
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="nfc-tap" size={80} color="#9ca3af" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Add Friend via NFC</Text>

          {/* Description */}
          <Text style={styles.description}>
            Choose how to connect: "Get Tapped" lets others read your phone, or
            "Tap Friend" to read their phone.
          </Text>

          {/* NFC Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Status:</Text>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={isSupported ? "check-circle" : "close-circle"}
                size={20}
                color={isSupported ? "#10b981" : "#ef4444"}
              />
              <Text style={styles.requirementText}>
                NFC is {isSupported ? "available" : "not supported"}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={isEnabled ? "check-circle" : "close-circle"}
                size={20}
                color={isEnabled ? "#10b981" : "#ef4444"}
              />
              <Text style={styles.requirementText}>
                NFC is {isEnabled ? "enabled" : "disabled"}
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

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Get Tapped Button (HCE Emulation) */}
            <Pressable
              style={[
                styles.actionButton,
                styles.primaryButton,
                isEmulating && styles.actionButtonActive,
                !isSupported || !isEnabled ? styles.actionButtonDisabled : null,
              ]}
              onPress={handleGetTapped}
              disabled={!isSupported || !isEnabled || emulateLoading}
            >
              <MaterialCommunityIcons
                name={isEmulating ? "nfc-variant" : "contactless-payment"}
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.actionButtonText}>
                {isEmulating ? "Stop Emulating..." : "Get Tapped"}
              </Text>
            </Pressable>

            {/* Tap Friend Button (NFC Read HCE) */}
            <Pressable
              style={[
                styles.actionButton,
                styles.secondaryButton,
                isReading && styles.actionButtonReading,
                !isSupported || !isEnabled ? styles.actionButtonDisabled : null,
              ]}
              onPress={
                isReading
                  ? () => {
                      cancelRead();
                      setShowSearchPopup(false);
                    }
                  : handleTapFriend
              }
              disabled={!isSupported || !isEnabled}
            >
              <MaterialCommunityIcons
                name={isReading ? "nfc-variant" : "nfc-tap"}
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.actionButtonText}>
                {isReading ? "Cancel Reading..." : "Tap Friend"}
              </Text>
            </Pressable>
          </View>

          {/* Reading Status Indicator */}
          {isReading && (
            <View style={styles.readingIndicator}>
              <MaterialCommunityIcons
                name="wifi"
                size={20}
                color="#f59e0b"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.readingText}>
                Hold your phone near the other device...
              </Text>
            </View>
          )}

          {/* Emulating Status Indicator */}
          {isEmulating && (
            <View style={styles.emulatingIndicator}>
              <MaterialCommunityIcons
                name="nfc-variant"
                size={20}
                color="#10b981"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.emulatingText}>
                Ready to be tapped! Keep app open.
              </Text>
            </View>
          )}
        </View>

        {/* Popups */}
        <FriendSuccessPopup
          visible={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
          friendData={friendData}
        />

        <FriendSearchPopup
          visible={showSearchPopup}
          onCancel={handleCancelSearch}
        />
      </View>
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
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#10b981",
  },
  secondaryButton: {
    backgroundColor: "#6366f1",
  },
  actionButtonActive: {
    backgroundColor: "#059669",
  },
  actionButtonScanning: {
    backgroundColor: "#ef4444",
  },
  actionButtonReading: {
    backgroundColor: "#f59e0b",
  },
  actionButtonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  readingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  readingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
  },
  emulatingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d1fae5",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#34d399",
  },
  emulatingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
  },
});
