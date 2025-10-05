import { View, Text, StyleSheet, Pressable } from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";
import { useNFCRead } from "@/hooks/useNFCRead";
import { useNFCEmulate } from "@/hooks/useNFCEmulate";

export default function TapFriendScreen() {
  // Initialize NFC reading hook
  const { isSupported, isEnabled, readHCEDevice } = useNFCRead({
    autoInit: true,
    showAlerts: true, // Show alerts for HCE reading
  });

  const handleRead = useCallback(() => {
    console.log("Someone tapped me!");
    // TODO: Handle incoming friend connection
  }, []);

  // Handle tapping a friend's phone (reading HCE device)
  const handleTapFriend = useCallback(async () => {
    try {
      const result = await readHCEDevice();

      if (result.success) {
        console.log("✅ Successfully read HCE device!");
        console.log("Content:", result.decodedText);
        console.log("Raw data:", result.rawData);
        // TODO: Handle friend connection with the read data
      } else {
        console.error("❌ Failed to read HCE device:", result.error);
      }
    } catch (error) {
      console.error("Error reading HCE device:", error);
    }
  }, [readHCEDevice]);

  // Initialize NFC emulation hook
  const {
    isEmulating,
    startEmulation,
    stopEmulation,
    loading: emulateLoading,
  } = useNFCEmulate({
    content: "TappClub Friend Connect - Test User 123",
    onRead: handleRead,
  });

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
              onPress={isEmulating ? stopEmulation : startEmulation}
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
                !isSupported || !isEnabled ? styles.actionButtonDisabled : null,
              ]}
              onPress={handleTapFriend}
              disabled={!isSupported || !isEnabled}
            >
              <MaterialCommunityIcons
                name="nfc-tap"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.actionButtonText}>Tap Friend</Text>
            </Pressable>
          </View>

          {/* Alternative Method */}
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
  actionButtonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 14,
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
