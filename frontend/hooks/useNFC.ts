import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, Alert } from "react-native";
import NfcManager, {
  NfcTech,
  Ndef,
  NfcEvents,
  NfcError,
  TagEvent,
} from "react-native-nfc-manager";

interface UseNFCOptions {
  onTagDetected?: (tag: TagEvent) => void;
  autoInit?: boolean;
  showAlerts?: boolean;
}

interface UseNFCReturn {
  isScanning: boolean;
  isSupported: boolean;
  isEnabled: boolean;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  writeNFC: (message: string) => Promise<boolean>;
  readTag: () => Promise<TagEvent | null>;
}

/**
 * Custom hook for managing NFC functionality
 *
 * @param options - Configuration options
 * @param options.onTagDetected - Callback when NFC tag is detected
 * @param options.autoInit - Auto initialize on mount (default: true)
 * @param options.showAlerts - Show alert popups on detection (default: true)
 * @returns NFC control methods and state
 */
export function useNFC(
  options: UseNFCOptions | ((tag: TagEvent) => void) = {}
): UseNFCReturn {
  // Support both object options and direct callback for backwards compatibility
  const normalizedOptions: UseNFCOptions =
    typeof options === "function"
      ? { onTagDetected: options, autoInit: true, showAlerts: true }
      : { autoInit: true, showAlerts: true, ...options };

  const { onTagDetected, autoInit, showAlerts } = normalizedOptions;

  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize NFC Manager
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
          const enabled = await NfcManager.isEnabled();
          if (mounted) {
            setIsEnabled(enabled);
          }
        }
      } catch (error: any) {
        console.error("NFC initialization error:", error);
        if (mounted) {
          setIsSupported(false);
          setIsEnabled(false);
        }
      }
    };

    if (autoInit) {
      initNFC();
    }

    return () => {
      mounted = false;
      // Clean up any active scanning sessions
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [autoInit]);

  // Handle NFC errors
  const handleNFCError = useCallback(
    (error: any) => {
      if (error instanceof NfcError.UserCancel) {
        // User cancelled, no need to show error
        return;
      } else if (error instanceof NfcError.Timeout) {
        if (showAlerts) {
          Alert.alert(
            "NFC Timeout",
            "NFC session timed out. Please try again."
          );
        }
      } else {
        console.warn("NFC Error:", error);
        if (Platform.OS === "ios") {
          NfcManager.invalidateSessionWithErrorIOS(`${error}`);
        } else if (showAlerts) {
          Alert.alert("NFC Error", `${error}`);
        }
      }
    },
    [showAlerts]
  );

  // Start scanning for NFC tags
  const startScanning = useCallback(async () => {
    if (!isSupported) {
      if (showAlerts) {
        Alert.alert(
          "NFC Not Supported",
          "NFC is not supported on this device."
        );
      }
      return;
    }

    if (!isEnabled) {
      if (showAlerts) {
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
      }
      return;
    }

    try {
      setIsScanning(true);

      // Setup cleanup function
      const cleanup = () => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.SessionClosed, null);
        setIsScanning(false);
      };
      cleanupRef.current = cleanup;

      let tagFound = false;

      // Listen for tag discovery
      NfcManager.setEventListener(
        NfcEvents.DiscoverTag,
        async (tag: TagEvent) => {
          tagFound = true;

          console.log("NFC Tag discovered:", tag);

          // Show success message on iOS
          if (Platform.OS === "ios") {
            await NfcManager.setAlertMessageIOS("NFC Tag Detected! 📱");
          }

          // Show popup alert
          if (showAlerts) {
            Alert.alert(
              "NFC Detected! 📱",
              `Tag ID: ${tag.id || "Unknown"}\nTech: ${
                tag.techTypes?.join(", ") || "Unknown"
              }`,
              [{ text: "OK" }]
            );
          }

          // Call the callback if provided
          if (onTagDetected) {
            onTagDetected(tag);
          }

          // Unregister to stop scanning
          try {
            await NfcManager.unregisterTagEvent();
          } catch (error: any) {
            console.warn("Error unregistering tag event:", error);
          }
        }
      );

      // Listen for session closed
      NfcManager.setEventListener(NfcEvents.SessionClosed, (error: any) => {
        if (error) {
          handleNFCError(error);
        }
        cleanup();
        if (cleanupRef.current === cleanup) {
          cleanupRef.current = null;
        }
      });

      // Start listening for tags
      await NfcManager.registerTagEvent();

      // Android-specific: Show a prompt message
      if (Platform.OS === "android" && showAlerts) {
        Alert.alert("Ready to Scan", "Hold your device near an NFC tag...", [
          {
            text: "Cancel",
            onPress: () => stopScanning(),
            style: "cancel",
          },
        ]);
      }
    } catch (error: any) {
      handleNFCError(error);
      setIsScanning(false);
      if (cleanupRef.current) {
        cleanupRef.current = null;
      }
    }
  }, [isSupported, isEnabled, showAlerts, onTagDetected, handleNFCError]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    try {
      await NfcManager.unregisterTagEvent();
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    } catch (error: any) {
      console.warn("Error stopping NFC scan:", error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Write to NFC tag
  const writeNFC = useCallback(
    async (message: string): Promise<boolean> => {
      if (!isSupported) {
        if (showAlerts) {
          Alert.alert(
            "NFC Not Supported",
            "NFC is not supported on this device."
          );
        }
        return false;
      }

      try {
        // Request NDEF technology
        await NfcManager.requestTechnology(NfcTech.Ndef, {
          alertMessage:
            Platform.OS === "ios" ? "Ready to write NFC tag" : undefined,
        });

        // Encode the message
        const bytes = Ndef.encodeMessage([Ndef.textRecord(message)]);

        // Write to tag
        await NfcManager.ndefHandler.writeNdefMessage(bytes);

        // Show success message
        if (Platform.OS === "ios") {
          await NfcManager.setAlertMessageIOS("Successfully written! ✅");
        } else if (showAlerts) {
          Alert.alert("Success", "NFC tag written successfully!");
        }

        return true;
      } catch (error: any) {
        handleNFCError(error);
        return false;
      } finally {
        // Clean up
        try {
          await NfcManager.cancelTechnologyRequest();
        } catch (error: any) {
          console.warn("Error canceling technology request:", error);
        }
      }
    },
    [isSupported, showAlerts, handleNFCError]
  );

  // Read NFC tag details
  const readTag = useCallback(async (): Promise<TagEvent | null> => {
    if (!isSupported) {
      if (showAlerts) {
        Alert.alert(
          "NFC Not Supported",
          "NFC is not supported on this device."
        );
      }
      return null;
    }

    try {
      await NfcManager.requestTechnology([NfcTech.Ndef]);
      const tag = await NfcManager.getTag();

      if (Platform.OS === "ios") {
        await NfcManager.setAlertMessageIOS("Tag read successfully! ✅");
      }

      return tag;
    } catch (error: any) {
      handleNFCError(error);
      return null;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (error: any) {
        console.warn("Error canceling technology request:", error);
      }
    }
  }, [isSupported, showAlerts, handleNFCError]);

  return {
    isScanning,
    isSupported,
    isEnabled,
    startScanning,
    stopScanning,
    writeNFC,
    readTag,
  };
}
