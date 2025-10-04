import { useState, useCallback, useEffect, useRef } from "react";
import { Platform, Alert } from "react-native";
import NfcManager, {
  NfcTech,
  Ndef,
  NfcEvents,
  NfcError,
  TagEvent,
} from "react-native-nfc-manager";
import type { User } from "../types";

interface NFCUserData {
  uuid: string;
  name: string;
  slug?: string;
}

interface UseNFCFriendTapOptions {
  currentUser: User | null;
  onFriendDetected?: (friendData: NFCUserData) => void;
  onWriteComplete?: () => void;
  autoStartOnMount?: boolean;
}

interface UseNFCFriendTapReturn {
  isActive: boolean;
  isWriting: boolean;
  isReading: boolean;
  isSupported: boolean;
  lastDetectedFriend: NFCUserData | null;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  writeUserData: () => Promise<boolean>;
}

/**
 * Hook for NFC-based friend tapping functionality
 * Handles both writing current user data and reading friend data
 */
export function useNFCFriendTap(
  options: UseNFCFriendTapOptions
): UseNFCFriendTapReturn {
  const {
    currentUser,
    onFriendDetected,
    onWriteComplete,
    autoStartOnMount = false,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastDetectedFriend, setLastDetectedFriend] =
    useState<NFCUserData | null>(null);

  const sessionActiveRef = useRef(false);
  const hasWrittenRef = useRef(false);

  // Initialize NFC
  useEffect(() => {
    let mounted = true;

    const initNFC = async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (mounted) {
          setIsSupported(supported);
        }

        if (supported) {
          await NfcManager.start();
        }
      } catch (error) {
        console.error("NFC initialization error:", error);
        if (mounted) {
          setIsSupported(false);
        }
      }
    };

    initNFC();

    return () => {
      mounted = false;
      // Clean up on unmount
      if (sessionActiveRef.current) {
        NfcManager.unregisterTagEvent().catch(() => {});
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.SessionClosed, null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start session on mount if requested
  useEffect(() => {
    if (autoStartOnMount && isSupported && currentUser) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartOnMount, isSupported, currentUser]);

  // Handle NFC errors
  const handleNFCError = useCallback((error: any) => {
    if (error instanceof NfcError.UserCancel) {
      // User cancelled, no need to show error
      return;
    } else if (error instanceof NfcError.Timeout) {
      Alert.alert("NFC Timeout", "NFC session timed out. Please try again.");
    } else {
      console.warn("NFC Error:", error);
      if (Platform.OS === "ios") {
        NfcManager.invalidateSessionWithErrorIOS(`${error}`);
      } else {
        Alert.alert("NFC Error", `${error}`);
      }
    }
  }, []);

  // Encode user data to JSON string
  const encodeUserData = useCallback((user: User): string => {
    const data: NFCUserData = {
      uuid: String(user.user_id),
      name: user.name,
      slug: user.slug,
    };
    return JSON.stringify(data);
  }, []);

  // Decode user data from JSON string
  const decodeUserData = useCallback((text: string): NFCUserData | null => {
    try {
      const data = JSON.parse(text);
      if (data.uuid && data.name) {
        return data as NFCUserData;
      }
      return null;
    } catch (error) {
      console.error("Failed to decode NFC user data:", error);
      return null;
    }
  }, []);

  // Write current user data to NFC tag
  const writeUserData = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      Alert.alert("NFC Not Supported", "NFC is not available on this device.");
      return false;
    }

    if (!currentUser) {
      Alert.alert("Error", "User data not available.");
      return false;
    }

    setIsWriting(true);

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage:
          Platform.OS === "ios" ? "Ready to share your profile" : undefined,
      });

      const userData = encodeUserData(currentUser);
      const bytes = Ndef.encodeMessage([Ndef.textRecord(userData)]);

      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      if (Platform.OS === "ios") {
        await NfcManager.setAlertMessageIOS("Profile written! ✅");
      }

      console.log("Successfully wrote user data to NFC tag");
      hasWrittenRef.current = true;

      if (onWriteComplete) {
        onWriteComplete();
      }

      return true;
    } catch (error: any) {
      handleNFCError(error);
      return false;
    } finally {
      setIsWriting(false);
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (error) {
        console.warn("Error canceling technology request:", error);
      }
    }
  }, [
    isSupported,
    currentUser,
    encodeUserData,
    handleNFCError,
    onWriteComplete,
  ]);

  // Read friend data from NFC tag
  const readFriendData = useCallback(async (): Promise<NFCUserData | null> => {
    setIsReading(true);

    try {
      await NfcManager.requestTechnology([NfcTech.Ndef]);
      const tag = await NfcManager.getTag();

      // Extract NDEF message
      if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
        const ndefRecord = tag.ndefMessage[0];
        const text = Ndef.text.decodePayload(
          new Uint8Array(ndefRecord.payload)
        );

        const friendData = decodeUserData(text);

        if (friendData) {
          // Don't allow adding yourself
          if (currentUser && friendData.uuid === String(currentUser.user_id)) {
            Alert.alert(
              "Oops! 😅",
              "You can't add yourself as a friend. Find someone else to tap!"
            );
            return null;
          }

          console.log("Successfully read friend data:", friendData);
          setLastDetectedFriend(friendData);

          if (Platform.OS === "ios") {
            await NfcManager.setAlertMessageIOS(`Found ${friendData.name}! 🎉`);
          }

          if (onFriendDetected) {
            onFriendDetected(friendData);
          }

          return friendData;
        }
      }

      Alert.alert("Invalid Tag", "This NFC tag doesn't contain user data.");
      return null;
    } catch (error: any) {
      handleNFCError(error);
      return null;
    } finally {
      setIsReading(false);
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (error) {
        console.warn("Error canceling technology request:", error);
      }
    }
  }, [currentUser, decodeUserData, handleNFCError, onFriendDetected]);

  // Start NFC session (dual mode: write then read)
  const startSession = useCallback(async () => {
    if (!isSupported) {
      Alert.alert("NFC Not Supported", "NFC is not available on this device.");
      return;
    }

    if (!currentUser) {
      Alert.alert("Error", "Please log in to add friends.");
      return;
    }

    const enabled = await NfcManager.isEnabled();
    if (!enabled) {
      Alert.alert(
        "NFC Not Enabled",
        "Please enable NFC in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => NfcManager.goToNfcSetting(),
          },
        ]
      );
      return;
    }

    try {
      setIsActive(true);
      sessionActiveRef.current = true;
      hasWrittenRef.current = false;

      // Setup event listener for tag discovery
      const cleanup = () => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.SessionClosed, null);
      };

      NfcManager.setEventListener(
        NfcEvents.DiscoverTag,
        async (tag: TagEvent) => {
          if (!sessionActiveRef.current) return;

          console.log("NFC Tag discovered:", tag);

          // First, try to read friend data
          const friendData = await readFriendData();

          // If we successfully read friend data, we're done
          if (friendData) {
            cleanup();
            setIsActive(false);
            sessionActiveRef.current = false;
          }
        }
      );

      NfcManager.setEventListener(NfcEvents.SessionClosed, (error: any) => {
        if (error) {
          handleNFCError(error);
        }
        cleanup();
        setIsActive(false);
        sessionActiveRef.current = false;
      });

      // Start listening for tags
      await NfcManager.registerTagEvent();

      // Android-specific: Show prompt
      if (Platform.OS === "android") {
        Alert.alert(
          "Ready to Tap! 👋",
          "Hold your device back-to-back with your friend's device.\n\nYour profile will be shared automatically.",
          [
            {
              text: "Cancel",
              onPress: async () => {
                try {
                  await NfcManager.unregisterTagEvent();
                  cleanup();
                  setIsActive(false);
                  sessionActiveRef.current = false;
                } catch (error) {
                  console.warn("Error canceling:", error);
                }
              },
              style: "cancel",
            },
          ]
        );
      } else {
        // iOS: show instruction
        Alert.alert(
          "Ready to Tap! 👋",
          "Hold your device near your friend's device to connect.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      handleNFCError(error);
      setIsActive(false);
      sessionActiveRef.current = false;
    }
  }, [isSupported, currentUser, readFriendData, handleNFCError]);

  // Stop NFC session
  const stopSession = useCallback(async () => {
    try {
      sessionActiveRef.current = false;
      await NfcManager.unregisterTagEvent();
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    } catch (error) {
      console.warn("Error stopping NFC session:", error);
    } finally {
      setIsActive(false);
      setIsWriting(false);
      setIsReading(false);
    }
  }, []);

  return {
    isActive,
    isWriting,
    isReading,
    isSupported,
    lastDetectedFriend,
    startSession,
    stopSession,
    writeUserData,
  };
}
