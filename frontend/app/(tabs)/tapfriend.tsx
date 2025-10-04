import { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNFC } from "../../hooks/useNFC";

export default function TapFriendScreen() {
  const [lastAddedFriend, setLastAddedFriend] = useState<string | null>(null);

  // Handle NFC tag detection
  const handleTagDetected = useCallback((tag: any) => {
    console.log("NFC Tag detected:", tag);

    // In a real app, you would:
    // 1. Extract user UUID from tag
    // 2. Call API: POST /friends/tap with { me_user_id, other_user_uuid }
    // 3. Update UI with friend's info

    // For now, mock the friend addition
    const friendName = tag.decodedText || "New Friend";
    setLastAddedFriend(friendName);

    // In production, you'd get the friend's name from the API response
    Alert.alert("Success", `You and ${friendName} are now friends! 🎉`);
  }, []);

  const { isScanning, isSupported, startScanning, stopScanning } =
    useNFC(handleTagDetected);

  const handleStartTap = async () => {
    if (!isSupported) {
      Alert.alert(
        "NFC Not Available",
        "NFC is not supported on this device or in the simulator. Please test on a physical device with NFC enabled.",
        [{ text: "OK" }]
      );
      return;
    }

    await startScanning();
  };

  const handleCancelScan = async () => {
    await stopScanning();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Friend",
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Icon */}
          <View
            style={[styles.iconContainer, isScanning && styles.iconScanning]}
          >
            <MaterialCommunityIcons
              name={isScanning ? "nfc-search-variant" : "nfc-tap"}
              size={80}
              color={isScanning ? "#6366f1" : "#9ca3af"}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isScanning ? "Hold devices together" : "Tap to Add Friend"}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {isScanning
              ? "Keep your devices close together until the connection is established..."
              : "Tap your phone with a friend's phone to instantly connect and share events together."}
          </Text>

          {/* NFC Requirements */}
          {!isScanning && (
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
          {lastAddedFriend && !isScanning && (
            <View style={styles.successCard}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#10b981"
              />
              <Text style={styles.successText}>
                Recently added: {lastAddedFriend}
              </Text>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            style={[styles.actionButton, isScanning && styles.cancelButton]}
            onPress={isScanning ? handleCancelScan : handleStartTap}
          >
            <Text style={styles.actionButtonText}>
              {isScanning ? "Cancel" : "Start Tap"}
            </Text>
          </Pressable>

          {/* Alternative Method */}
          {!isScanning && (
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
    marginBottom: 24,
  },
  iconScanning: {
    backgroundColor: "#eef2ff",
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
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 24,
  },
  successText: {
    fontSize: 14,
    fontWeight: "500",
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
});
