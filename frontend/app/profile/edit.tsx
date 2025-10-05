import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Mock current user data
const mockCurrentUser = {
  user_id: "current-user",
  name: "Davis Johnson",
  username: "davis_j",
  pfp: "https://i.pravatar.cc/150?img=33",
  description: "Love hiking, coffee, and live music 🎵",
  location: "San Francisco, CA",
};

export default function EditProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState(mockCurrentUser.name);
  const [username, setUsername] = useState(mockCurrentUser.username);
  const [description, setDescription] = useState(
    mockCurrentUser.description || ""
  );
  const [profileImage, setProfileImage] = useState<string | null>(
    mockCurrentUser.pfp
  );
  const [location, setLocation] = useState<string | null>(
    mockCurrentUser.location
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera roll permissions to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const fetchLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use this feature."
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      // Reverse geocode to get city
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (geocode) {
        const cityLocation = `${
          geocode.city || geocode.subregion || "Unknown"
        }, ${geocode.region || geocode.country || ""}`;
        setLocation(cityLocation);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Failed to get your location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter your name.");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Required Field", "Please enter a username.");
      return;
    }

    setIsSaving(true);

    // Mock API call
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Saving profile:", {
        name: name.trim(),
        username: username.trim(),
        description: description.trim(),
        profileImage,
        location,
      });

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Profile",
          headerLeft: () => (
            <Pressable onPress={handleCancel} style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={styles.headerButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Profile Photo</Text>
          <View style={styles.imageContainer}>
            <Pressable onPress={pickImage} style={styles.imagePicker}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons
                    name="camera"
                    size={40}
                    color="#9ca3af"
                  />
                </View>
              )}
              <View style={styles.imageOverlay}>
                <MaterialCommunityIcons name="camera" size={24} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.imageHint}>Tap to change photo</Text>
          </View>
        </View>

        {/* Name Field */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Username Field */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Username <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>@</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefix]}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Bio/Description Field */}
        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us about yourself"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={150}
          />
          <Text style={styles.characterCount}>
            {description.length}/150 characters
          </Text>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Location</Text>
            <Pressable
              onPress={fetchLocation}
              disabled={isLoadingLocation}
              style={styles.locationButton}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="crosshairs-gps"
                    size={16}
                    color="#6366f1"
                  />
                  <Text style={styles.locationButtonText}>Use Current</Text>
                </>
              )}
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={location || ""}
            onChangeText={setLocation}
            placeholder="Enter your location"
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.hint}>
            Your city or region (e.g., San Francisco, CA)
          </Text>
        </View>

        {/* Save Button (Mobile) */}
        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your profile information is visible to your friends
          </Text>
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
    padding: 20,
  },
  headerButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: "#6b7280",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
  },
  imagePicker: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e5e7eb",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6366f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  imageHint: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
  },
  prefix: {
    paddingLeft: 12,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  inputWithPrefix: {
    flex: 1,
    borderWidth: 0,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "right",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});
