import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToR2 } from "../../utils/r2Upload";

export default function CreatePostScreen() {
  const router = useRouter();
  const { event_id, event_name } = useLocalSearchParams<{
    event_id: string;
    event_name: string;
  }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pictures, setPictures] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera roll permissions to add photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;

        // Upload to R2
        setIsUploadingImage(true);
        try {
          const publicUrl = await uploadImageToR2(localUri);
          setPictures((prev) => [...prev, publicUrl]);
          console.log("Image uploaded:", publicUrl);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          Alert.alert(
            "Upload Failed",
            "Failed to upload image. Please try again."
          );
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleRemovePicture = (index: number) => {
    setPictures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert("Required Field", "Please enter a post title.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Required Field", "Please enter a description.");
      return;
    }

    setIsCreating(true);

    try {
      // Mock API call - Create post
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const postData = {
        event_id: event_id,
        poster_id: "current-user", // Mock user ID
        title: title.trim(),
        description: description.trim(),
      };

      console.log("Creating post:", postData);

      // Mock response
      const mockPostResponse = {
        post_id: `post-${Date.now()}`,
        ...postData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Post created:", mockPostResponse);

      // If there are pictures, add them to the post
      if (pictures.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        for (const pictureUrl of pictures) {
          const pictureData = {
            uploader_id: "current-user",
            picture_url: pictureUrl,
          };

          console.log(
            `Adding picture to post ${mockPostResponse.post_id}:`,
            pictureData
          );

          // Mock picture response
          const mockPictureResponse = {
            picture_id: `pic-${Date.now()}-${Math.random()}`,
            post_id: mockPostResponse.post_id,
            picture_url: pictureUrl,
            uploaded_at: new Date().toISOString(),
          };

          console.log("Picture added:", mockPictureResponse);
        }
      }

      Alert.alert("Success", "Post created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Post",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#111827" />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          {/* Event Info */}
          <View style={styles.eventInfo}>
            <MaterialCommunityIcons
              name="calendar-star"
              size={20}
              color="#6366f1"
            />
            <Text style={styles.eventLabel}>Posting to:</Text>
            <Text style={styles.eventName}>{event_name}</Text>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Best trip ever!"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your experience..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
          </View>

          {/* Pictures */}
          <View style={styles.section}>
            <Text style={styles.label}>Pictures</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.picturesScroll}
            >
              {/* Add Picture Button */}
              <Pressable
                style={styles.addPictureButton}
                onPress={handlePickImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="camera-plus"
                      size={32}
                      color="#6366f1"
                    />
                    <Text style={styles.addPictureText}>Add Photo</Text>
                  </>
                )}
              </Pressable>

              {/* Picture Previews */}
              {pictures.map((uri, index) => (
                <View key={index} style={styles.pictureContainer}>
                  <Image source={{ uri }} style={styles.picturePreview} />
                  <Pressable
                    style={styles.removePictureButton}
                    onPress={() => handleRemovePicture(index)}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={24}
                      color="#ef4444"
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.hint}>
              Add photos to share your memories ({pictures.length} added)
            </Text>
          </View>

          {/* Create Button */}
          <Pressable
            style={[
              styles.createButton,
              (!title || !description || isCreating) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreatePost}
            disabled={!title || !description || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Post</Text>
            )}
          </Pressable>
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
  headerButton: {
    padding: 8,
  },
  form: {
    padding: 16,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  eventLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  eventName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
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
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  picturesScroll: {
    marginBottom: 8,
  },
  addPictureButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#6366f1",
    borderStyle: "dashed",
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addPictureText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
    marginTop: 4,
  },
  pictureContainer: {
    position: "relative",
    marginRight: 12,
  },
  picturePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  removePictureButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  createButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
