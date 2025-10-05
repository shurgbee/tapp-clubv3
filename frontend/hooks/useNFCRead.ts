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
  readHCEDevice: (aid?: number[]) => Promise<any>;
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
export function useNFCRead(
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

  /**
   * Read from HCE (Host Card Emulation) device using IsoDep
   *
   * @param aid - Application ID as byte array (default: D2760000850101 for Type 4 NDEF)
   * @returns Object containing success status and NDEF data
   */
  const readHCEDevice = useCallback(
    async (
      aid: number[] = [0xd2, 0x76, 0x00, 0x00, 0x85, 0x01, 0x01]
    ): Promise<any> => {
      if (!isSupported) {
        if (showAlerts) {
          Alert.alert(
            "NFC Not Supported",
            "NFC is not supported on this device."
          );
        }
        return { success: false, error: "NFC not supported" };
      }

      try {
        console.log("=== Reading HCE Device ===");

        // Request IsoDep technology (required for HCE communication)
        await NfcManager.requestTechnology(NfcTech.IsoDep, {
          alertMessage:
            Platform.OS === "ios" ? "Ready to scan HCE device" : undefined,
        });

        console.log("IsoDep technology acquired");

        // Get basic tag info
        const tag = await NfcManager.getTag();
        if (!tag) {
          throw new Error("Failed to get tag information");
        }
        console.log("Tag detected:", {
          id: tag.id,
          techTypes: tag.techTypes,
        });

        // Step 1: SELECT AID (Application ID)
        const selectAidCommand = [
          0x00,
          0xa4,
          0x04,
          0x00, // CLA INS P1 P2 for SELECT command
          aid.length, // Lc: Length of AID
          ...aid, // AID bytes
        ];

        console.log(
          ">>> SELECT AID:",
          selectAidCommand
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        const selectResponse = await NfcManager.isoDepHandler.transceive(
          selectAidCommand
        );

        console.log(
          "<<< SELECT response:",
          selectResponse
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        // Check if SELECT was successful (Status Word: 90 00)
        const sw1 = selectResponse[selectResponse.length - 2];
        const sw2 = selectResponse[selectResponse.length - 1];

        if (sw1 !== 0x90 || sw2 !== 0x00) {
          throw new Error(
            `SELECT AID failed with status: ${("00" + sw1.toString(16)).slice(
              -2
            )} ${("00" + sw2.toString(16)).slice(-2)}`
          );
        }

        console.log("✅ AID selected successfully");

        // Step 2: SELECT NDEF Capability Container (CC) file
        const selectCCCommand = [0x00, 0xa4, 0x00, 0x0c, 0x02, 0xe1, 0x03];

        console.log(
          ">>> SELECT CC:",
          selectCCCommand
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        const ccResponse = await NfcManager.isoDepHandler.transceive(
          selectCCCommand
        );

        console.log(
          "<<< CC response:",
          ccResponse
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        // Step 3: READ CC file to get NDEF file information
        const readCCCommand = [0x00, 0xb0, 0x00, 0x00, 0x0f]; // Read 15 bytes

        console.log(
          ">>> READ CC:",
          readCCCommand
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        const ccData = await NfcManager.isoDepHandler.transceive(readCCCommand);

        console.log(
          "<<< CC data:",
          ccData
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        // Step 4: SELECT NDEF data file
        const selectNDEFCommand = [0x00, 0xa4, 0x00, 0x0c, 0x02, 0xe1, 0x04];

        console.log(
          ">>> SELECT NDEF:",
          selectNDEFCommand
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        const ndefSelectResponse = await NfcManager.isoDepHandler.transceive(
          selectNDEFCommand
        );

        console.log(
          "<<< NDEF select response:",
          ndefSelectResponse
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        // Step 5: READ NDEF data length (first 2 bytes contain length)
        const readLengthCommand = [0x00, 0xb0, 0x00, 0x00, 0x02];

        console.log(
          ">>> READ NDEF length:",
          readLengthCommand
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        const lengthData = await NfcManager.isoDepHandler.transceive(
          readLengthCommand
        );

        console.log(
          "<<< Length data:",
          lengthData
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        // Extract NDEF message length (remove status bytes)
        const ndefLength = (lengthData[0] << 8) | lengthData[1];
        console.log("NDEF message length:", ndefLength);

        // Step 6: READ actual NDEF data
        const readDataCommand = [
          0x00,
          0xb0,
          0x00,
          0x02,
          Math.min(ndefLength, 0xf0),
        ]; // Read from offset 2

        console.log(
          ">>> READ NDEF data:",
          readDataCommand
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        const ndefData = await NfcManager.isoDepHandler.transceive(
          readDataCommand
        );

        console.log(
          "<<< NDEF data:",
          ndefData
            .map((b) => ("00" + b.toString(16).toUpperCase()).slice(-2))
            .join(" ")
        );

        // Remove status bytes (last 2 bytes)
        const actualData = ndefData.slice(0, -2);

        // Try to parse NDEF message
        let parsedMessage = null;
        try {
          // Convert number array to Uint8Array for NDEF decoding
          const uint8Data = new Uint8Array(actualData);
          parsedMessage = Ndef.text.decodePayload(uint8Data);
          console.log("Decoded NDEF text:", parsedMessage);
        } catch (e) {
          console.warn("Could not decode as text NDEF, returning raw data");
        }

        // Show success message
        if (Platform.OS === "ios") {
          await NfcManager.setAlertMessageIOS(
            "HCE device read successfully! ✅"
          );
        }

        if (showAlerts) {
          Alert.alert(
            "HCE Device Read! 📱",
            parsedMessage
              ? `Content: ${parsedMessage}`
              : `Data: ${actualData
                  .map((b) => ("00" + b.toString(16)).slice(-2))
                  .join(" ")}`,
            [{ text: "OK" }]
          );
        }

        return {
          success: true,
          tag,
          ndefLength,
          rawData: actualData,
          decodedText: parsedMessage,
        };
      } catch (error: any) {
        console.error("Error reading HCE device:", error);
        handleNFCError(error);
        return { success: false, error: error.message || String(error) };
      } finally {
        try {
          await NfcManager.cancelTechnologyRequest();
        } catch (error: any) {
          console.warn("Error canceling technology request:", error);
        }
      }
    },
    [isSupported, showAlerts, handleNFCError]
  );

  return {
    isScanning,
    isSupported,
    isEnabled,
    startScanning,
    stopScanning,
    writeNFC,
    readTag,
    readHCEDevice,
  };
}
