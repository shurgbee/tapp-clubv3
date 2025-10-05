import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface NFCUserData {
  uuid: string;
  name: string;
  slug?: string;
}

interface FriendSuccessPopupProps {
  visible: boolean;
  onClose: () => void;
  friendData: NFCUserData | null;
  onSendMessage?: () => void;
  onViewProfile?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Marquee Row Component
const MarqueeRow: React.FC<{
  direction: "left" | "right";
  index: number;
  visible: boolean;
}> = ({ direction, index, visible }) => {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-200)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const marqueeText = "NEW FRIEND ";
  const repeatedText = marqueeText.repeat(30);

  React.useEffect(() => {
    if (visible) {
      // Staggered slide-in animation from top
      Animated.sequence([
        Animated.delay(index * 80), // Stagger each row by 80ms
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Start scrolling animation
      const startScrolling = () => {
        translateX.setValue(direction === "left" ? 0 : -SCREEN_WIDTH * 1.5);

        Animated.loop(
          Animated.timing(translateX, {
            toValue: direction === "left" ? -SCREEN_WIDTH * 1.5 : 0,
            duration: 8000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      };

      const scrollTimeout = setTimeout(startScrolling, index * 80);
      return () => clearTimeout(scrollTimeout);
    } else {
      // Reset animations
      translateY.setValue(-200);
      opacity.setValue(0);
    }
  }, [direction, translateX, translateY, opacity, index, visible]);

  return (
    <Animated.View
      style={[
        styles.marqueeContainer,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.marqueeContent,
          { transform: [{ translateX: translateX }] },
        ]}
      >
        <Text style={styles.marqueeText}>{repeatedText}</Text>
        <Text style={styles.marqueeText}>{repeatedText}</Text>
        <Text style={styles.marqueeText}>{repeatedText}</Text>
      </Animated.View>
    </Animated.View>
  );
};

export function FriendSuccessPopup({
  visible,
  onClose,
  friendData,
  onSendMessage,
  onViewProfile,
}: FriendSuccessPopupProps) {
  const [scaleAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  if (!friendData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.container}>
          {/* Marquee Rows */}
          <View style={styles.marqueeWrapper}>
            <MarqueeRow direction="left" index={0} visible={visible} />
            <MarqueeRow direction="right" index={1} visible={visible} />
            <MarqueeRow direction="left" index={2} visible={visible} />
            <MarqueeRow direction="right" index={3} visible={visible} />
            <MarqueeRow direction="left" index={4} visible={visible} />
            <MarqueeRow direction="right" index={5} visible={visible} />
            <MarqueeRow direction="left" index={6} visible={visible} />
            <MarqueeRow direction="right" index={7} visible={visible} />
            <MarqueeRow direction="left" index={8} visible={visible} />
            <MarqueeRow direction="right" index={9} visible={visible} />
          </View>

          {/* Centered Profile Picture */}
          <Animated.View
            style={[
              styles.profileContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.profileContent}>
              <View style={styles.profilePicture}>
                <View style={styles.profileCircle}>
                  <Text style={styles.profileInitial}>
                    {friendData.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.profileName}>{friendData.name}</Text>

              {/* Accept Button */}
              <Pressable style={styles.acceptButton} onPress={onClose}>
                <Text style={styles.acceptButtonText}>Accept</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Left Gradient Fade with Pastel Pink */}
          <LinearGradient
            colors={["rgba(248, 187, 208, 0.9)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientLeft}
            pointerEvents="none"
          />

          {/* Right Gradient Fade with Pastel Pink */}
          <LinearGradient
            colors={["transparent", "rgba(248, 187, 208, 0.9)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientRight}
            pointerEvents="none"
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(248, 187, 208, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  marqueeWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-evenly",
  },
  marqueeContainer: {
    height: 120,
    overflow: "hidden",
    flexDirection: "row",
  },
  marqueeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  marqueeText: {
    fontSize: 96,
    fontWeight: "900",
    color: "#C2185B",
    letterSpacing: 4,
    textTransform: "uppercase",
    opacity: 0.3,
  },
  profileContainer: {
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  profileContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  profilePicture: {
    shadowColor: "#F48FB1",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
  },
  profileCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#F8BBD0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  profileInitial: {
    fontSize: 80,
    fontWeight: "900",
    color: "#C2185B",
  },
  profileName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#DB2777",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 24,
  },
  gradientLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 120,
    zIndex: 5,
  },
  gradientRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    zIndex: 5,
  },
  acceptButton: {
    marginTop: 32,
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#F48FB1",
    shadowColor: "#C2185B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#C2185B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
