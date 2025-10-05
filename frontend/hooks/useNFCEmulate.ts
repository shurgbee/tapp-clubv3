import { useState, useEffect, useCallback, useContext } from "react";
import {
  HCESessionContext,
  HCESession,
  NFCTagType4NDEFContentType,
  NFCTagType4,
} from "react-native-hce";

interface UseNFCEmulateOptions {
  content?: string;
  onRead?: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface UseNFCEmulateReturn {
  isEmulating: boolean;
  content: string;
  setContent: (content: string) => void;
  startEmulation: () => Promise<void>;
  stopEmulation: () => Promise<void>;
  loading: boolean;
}

/**
 * Custom hook for NFC HCE (Host Card Emulation)
 * Emulates an NFC tag with text content that other devices can read
 *
 * @param options - Configuration options
 * @param options.content - Initial text content to emulate
 * @param options.onRead - Callback when tag is read
 * @param options.onConnected - Callback when reader connects
 * @param options.onDisconnected - Callback when reader disconnects
 * @returns NFC emulation control methods and state
 */
export function useNFCEmulate(
  options: UseNFCEmulateOptions = {}
): UseNFCEmulateReturn {
  const { session } = useContext(HCESessionContext);
  const [isEmulating, setIsEmulating] = useState(false);
  const [content, setContentState] = useState(options.content || "");
  const [loading, setLoading] = useState(false);

  // Initialize application on mount
  useEffect(() => {
    const initializeApplication = async () => {
      if (content && session) {
        console.log("Initializing HCE application with content:", content);
        try {
          const tag = new NFCTagType4({
            type: NFCTagType4NDEFContentType.Text,
            content: content,
            writable: false,
          });
          await session.setApplication(tag);
          console.log("HCE application initialized successfully");
        } catch (error) {
          console.error("Error initializing HCE application:", error);
        }
      }
    };

    initializeApplication();
  }, [content, session]);

  // Update content and sync with native
  const setContent = useCallback(
    async (newContent: string) => {
      setContentState(newContent);
      setLoading(true);

      try {
        const tag = new NFCTagType4({
          type: NFCTagType4NDEFContentType.Text,
          content: newContent,
          writable: false,
        });
        console.log("Setting NFC content:", newContent);
        await session.setApplication(tag);
      } catch (error) {
        console.error("Error setting NFC content:", error);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Start emulating NFC tag
  const startEmulation = useCallback(async () => {
    if (!content) {
      console.warn("Cannot start emulation: no content set");
      return;
    }

    console.log("=== Starting HCE Emulation ===");
    console.log("Session exists:", !!session);
    console.log("Content to emulate:", content);
    console.log("Current session.enabled:", session?.enabled);
    console.log("Current session.application:", session?.application);

    setLoading(true);
    try {
      // Set up the tag first
      const tag = new NFCTagType4({
        type: NFCTagType4NDEFContentType.Text,
        content: content,
        writable: false,
      });
      console.log("Created NFCTagType4 instance:", {
        type: tag.type,
        content: tag.content,
      });

      console.log("Setting application with content:", content);
      await session.setApplication(tag);
      console.log("Application set successfully");
      console.log("Session application after set:", session?.application);

      // Enable emulation
      console.log("Enabling HCE session...");
      await session.setEnabled(true);
      setIsEmulating(true);
      console.log("✅ NFC emulation started with content:", content);
      console.log("Session.enabled after start:", session?.enabled);
    } catch (error) {
      console.error("Error starting NFC emulation:", error);
    } finally {
      setLoading(false);
    }
  }, [session, content]);

  // Stop emulating NFC tag
  const stopEmulation = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Disabling HCE session...");
      await session.setEnabled(false);
      setIsEmulating(false);
      console.log("NFC emulation stopped");
    } catch (error) {
      console.error("Error stopping NFC emulation:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Set up event listeners
  useEffect(() => {
    const listeners: Array<() => void> = [];

    // Listen to ALL HCE events for debugging
    const allEventsCancel = session.on(null, (eventData?: string) => {
      console.log("🔔 HCE Event received:", eventData);
    });
    listeners.push(allEventsCancel);

    // Listen for READ event
    const readCancel = session.on(
      HCESession.Events.HCE_STATE_READ,
      (eventData?: string) => {
        console.log("✅ NFC tag was READ!", eventData);
        options.onRead?.();
      }
    );
    listeners.push(readCancel);

    // Listen for CONNECTED event
    const connectedCancel = session.on(
      HCESession.Events.HCE_STATE_CONNECTED,
      (eventData?: string) => {
        console.log("🔗 NFC reader CONNECTED!", eventData);
        options.onConnected?.();
      }
    );
    listeners.push(connectedCancel);

    // Listen for DISCONNECTED event
    const disconnectedCancel = session.on(
      HCESession.Events.HCE_STATE_DISCONNECTED,
      (eventData?: string) => {
        console.log("❌ NFC reader DISCONNECTED!", eventData);
        options.onDisconnected?.();
      }
    );
    listeners.push(disconnectedCancel);

    console.log("✅ Event listeners registered for:", [
      HCESession.Events.HCE_STATE_READ,
      HCESession.Events.HCE_STATE_CONNECTED,
      HCESession.Events.HCE_STATE_DISCONNECTED,
    ]);

    // Cleanup listeners on unmount
    return () => {
      console.log("🧹 Cleaning up HCE event listeners");
      listeners.forEach((cancel) => cancel());
    };
  }, [session, options.onRead, options.onConnected, options.onDisconnected]);

  // Sync state with session on mount
  useEffect(() => {
    setIsEmulating(session.enabled);
  }, [session.enabled]);

  return {
    isEmulating,
    content,
    setContent,
    startEmulation,
    stopEmulation,
    loading,
  };
}
