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
import { uploadImageToR2 } from "../../utils/r2Upload";
import { getUserProfile, updateUserProfile } from "../../api/users";
import { useAuth } from "../../contexts/AuthContext";

export default function EditProfileScreen() {
  const router = useRouter();
  const { uuid, user } = useAuth();

  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load current user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!uuid) return;

      setIsLoadingProfile(true);
      try {
        const profile = await getUserProfile(uuid);
        setUsername(profile.username);
        setDescription(profile.description || "");
        setProfileImage(profile.pfp || null);
        // Note: location is not in the profile response, we'll need to add it if needed
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert("Error", "Failed to load profile data");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [uuid]);

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
        // Show local preview immediately
        const localUri = result.assets[0].uri;
        setProfileImage(localUri);

        // Upload to R2 in background
        setIsUploadingImage(true);
        try {
          const publicUrl = await uploadImageToR2(localUri);
          setProfileImage(publicUrl);
          console.log("Image uploaded to R2:", publicUrl);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          Alert.alert(
            "Upload Failed",
            "Failed to upload image. Please try again."
          );
          // Keep the local URI as fallback
        } finally {
          setIsUploadingImage(false);
        }
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
    if (!username.trim()) {
      Alert.alert("Required Field", "Please enter a username.");
      return;
    }

    if (!uuid) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }

    setIsSaving(true);

    try {
      // Build update payload (only send fields that were changed)
      const updateData: any = {};

      if (username.trim()) updateData.username = username.trim();
      if (description.trim()) updateData.description = description.trim();
      if (location) updateData.location = location;
      if (profileImage) updateData.pfp = profileImage;

      console.log("Updating profile with data:", updateData);

      const result = await updateUserProfile(uuid, updateData);
      console.log("Profile updated successfully:", result);

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Profile" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </>
    );
  }

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
            <Pressable
              onPress={pickImage}
              style={styles.imagePicker}
              disabled={isUploadingImage}
            >
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
              {isUploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#6366f1" />
                </View>
              )}
              <View style={styles.imageOverlay}>
                <MaterialCommunityIcons name="camera" size={24} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.imageHint}>
              {isUploadingImage ? "Uploading..." : "Tap to change photo"}
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
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
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 60,
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
