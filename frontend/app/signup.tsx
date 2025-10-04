import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  const handleCheckUsername = () => {
    // Mock username availability check
    setTimeout(() => {
      setUsernameAvailable(username.length > 3);
    }, 500);
  };

  const handleRequestLocation = () => {
    // Mock location request
    Alert.alert("Location Permission", "Location access enabled (mock)", [
      {
        text: "OK",
        onPress: () => setLocation("San Francisco, CA"),
      },
    ]);
  };

  const handleSignup = () => {
    if (!name || !username) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Mock signup success
    Alert.alert("Success", "Account created! Welcome to TappClub 🎉", [
      {
        text: "Get Started",
        onPress: () => router.replace("/(tabs)/home"),
      },
    ]);
  };

  const canSubmit = name.trim() && username.trim() && usernameAvailable;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Account",
          headerBackVisible: false,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons
                name="account-group"
                size={64}
                color="#6366f1"
              />
            </View>
            <Text style={styles.title}>Welcome to TappClub</Text>
            <Text style={styles.subtitle}>
              Share events and discover what your friends are up to
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., John Doe"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>

            {/* Username */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Username *</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  placeholder="username"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                    setUsernameAvailable(null);
                  }}
                  onBlur={handleCheckUsername}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {usernameAvailable !== null && (
                  <MaterialCommunityIcons
                    name={usernameAvailable ? "check-circle" : "close-circle"}
                    size={20}
                    color={usernameAvailable ? "#10b981" : "#ef4444"}
                    style={styles.availabilityIcon}
                  />
                )}
              </View>
              {usernameAvailable === false && (
                <Text style={styles.errorText}>Username not available</Text>
              )}
              {usernameAvailable === true && (
                <Text style={styles.successText}>Username available!</Text>
              )}
            </View>

            {/* Location (Optional) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Location <Text style={styles.optional}>(optional)</Text>
              </Text>
              {location ? (
                <View style={styles.locationDisplay}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#6366f1"
                  />
                  <Text style={styles.locationText}>{location}</Text>
                  <Pressable onPress={() => setLocation("")}>
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color="#9ca3af"
                    />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.locationButton}
                  onPress={handleRequestLocation}
                >
                  <MaterialCommunityIcons
                    name="crosshairs-gps"
                    size={20}
                    color="#6366f1"
                  />
                  <Text style={styles.locationButtonText}>Enable Location</Text>
                </Pressable>
              )}
              <Text style={styles.helperText}>
                Help friends discover events near you
              </Text>
            </View>

            {/* Avatar Selection (Placeholder) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Profile Photo <Text style={styles.optional}>(optional)</Text>
              </Text>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons
                    name="account"
                    size={48}
                    color="#9ca3af"
                  />
                </View>
                <Pressable style={styles.selectPhotoButton}>
                  <Text style={styles.selectPhotoText}>Choose Photo</Text>
                </Pressable>
              </View>
            </View>

            {/* Sign Up Button */}
            <Pressable
              style={[
                styles.signupButton,
                !canSubmit && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={!canSubmit}
            >
              <Text style={styles.signupButtonText}>Create Account</Text>
            </Pressable>

            {/* Terms */}
            <Text style={styles.termsText}>
              By signing up, you agree to our{" "}
              <Text style={styles.link}>Terms of Service</Text> and{" "}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>
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
  content: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  optional: {
    fontWeight: "400",
    color: "#6b7280",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  atSymbol: {
    position: "absolute",
    left: 12,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    zIndex: 1,
  },
  usernameInput: {
    flex: 1,
    paddingLeft: 28,
    paddingRight: 40,
  },
  availabilityIcon: {
    position: "absolute",
    right: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
  },
  successText: {
    fontSize: 14,
    color: "#10b981",
  },
  helperText: {
    fontSize: 14,
    color: "#6b7280",
  },
  locationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#6366f1",
    borderRadius: 8,
    padding: 12,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6366f1",
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  selectPhotoButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectPhotoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
  },
  signupButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  signupButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  termsText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  link: {
    color: "#6366f1",
    fontWeight: "500",
  },
});
