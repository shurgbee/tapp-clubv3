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
} from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";

export default function PostEventScreen() {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const handlePickImage = () => {
    // Mock image picker - in real app would use expo-image-picker
    Alert.alert("Image Picker", "Would open image picker here");
    setCoverImage(
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800"
    );
  };

  const handleCreateEvent = () => {
    Alert.alert("Success", "Event created! (mock)", [
      { text: "OK", onPress: () => console.log("Event created") },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Event",
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          {/* Cover Photo Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Cover Photo</Text>
            <Pressable
              style={styles.imagePickerButton}
              onPress={handlePickImage}
            >
              {coverImage ? (
                <Image
                  source={{ uri: coverImage }}
                  style={styles.coverPreview}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={48}
                    color="#9ca3af"
                  />
                  <Text style={styles.imagePlaceholderText}>
                    Add Cover Photo
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Event Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Event Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Trip to Japan"
              value={eventName}
              onChangeText={setEventName}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell your friends about this event..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Date & Time *</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() =>
                Alert.alert("Date Picker", "Would open date picker here")
              }
            >
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color="#6366f1"
              />
              <Text style={styles.dateText}>
                {dayjs(selectedDate).format("MMMM D, YYYY h:mm A")}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#9ca3af"
              />
            </Pressable>
          </View>

          {/* Create Button */}
          <Pressable
            style={[
              styles.createButton,
              !eventName && styles.createButtonDisabled,
            ]}
            onPress={handleCreateEvent}
            disabled={!eventName}
          >
            <Text style={styles.createButtonText}>Create Event</Text>
          </Pressable>

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
  form: {
    padding: 16,
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
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagePickerButton: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
  },
  coverPreview: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
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
  cancelButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
});
