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
  Modal,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import type { Group } from "../../types";

// Mock user groups
const mockGroups: Group[] = [
  {
    group_id: "g1",
    name: "Tokyo Trip Squad",
    pfp: "https://i.pravatar.cc/150?img=1",
  },
  {
    group_id: "g2",
    name: "Beach Party Crew",
    pfp: "https://i.pravatar.cc/150?img=2",
  },
  {
    group_id: "g3",
    name: "Tech Conference Friends",
    pfp: "https://i.pravatar.cc/150?img=3",
  },
  {
    group_id: "g4",
    name: "Coffee Lovers ☕",
    pfp: "https://i.pravatar.cc/150?img=4",
  },
  {
    group_id: "g5",
    name: "Weekend Hikers",
    pfp: "https://i.pravatar.cc/150?img=5",
  },
];

export default function PostEventScreen() {
  const router = useRouter();

  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera roll permissions to select a cover photo."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (time) {
      setSelectedTime(time);
    }
  };

  const handleCreateEvent = async () => {
    // Validation
    if (!eventName.trim()) {
      Alert.alert("Required Field", "Please enter an event name.");
      return;
    }

    if (!selectedGroup) {
      Alert.alert("Required Field", "Please select a group for this event.");
      return;
    }

    // Combine date and time
    const eventDateTime = new Date(selectedDate);
    eventDateTime.setHours(selectedTime.getHours());
    eventDateTime.setMinutes(selectedTime.getMinutes());

    setIsCreating(true);

    // Mock API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Creating event:", {
        name: eventName.trim(),
        description: description.trim(),
        dateTime: eventDateTime.toISOString(),
        coverImage,
        group_id: selectedGroup?.group_id,
        group_name: selectedGroup?.name,
      });

      Alert.alert("Success", "Event created successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setEventName("");
            setDescription("");
            setSelectedDate(new Date());
            setSelectedTime(new Date());
            setCoverImage(null);
            // Navigate to home
            router.push("/(tabs)/home");
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create event. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.back();
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

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Date *</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color="#6366f1"
              />
              <Text style={styles.dateText}>
                {dayjs(selectedDate).format("MMMM D, YYYY")}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#9ca3af"
              />
            </Pressable>
          </View>

          {/* Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Time *</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#6366f1"
              />
              <Text style={styles.dateText}>
                {dayjs(selectedTime).format("h:mm A")}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#9ca3af"
              />
            </Pressable>
          </View>

          {/* Group Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Group <Text style={styles.required}>*</Text>
            </Text>
            <Pressable
              style={styles.groupSelector}
              onPress={() => setShowGroupPicker(true)}
            >
              {selectedGroup ? (
                <>
                  <Image
                    source={{ uri: selectedGroup.pfp }}
                    style={styles.groupAvatar}
                  />
                  <Text style={styles.groupText}>{selectedGroup.name}</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={20}
                    color="#9ca3af"
                  />
                  <Text style={styles.groupPlaceholder}>Select a group</Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#9ca3af"
                  />
                </>
              )}
            </Pressable>
          </View>

          {/* Create Button */}
          <Pressable
            style={[
              styles.createButton,
              (!eventName || !selectedGroup || isCreating) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreateEvent}
            disabled={!eventName || !selectedGroup || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Event</Text>
            )}
          </Pressable>

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>

        {/* Date Picker Modal (iOS) or Native (Android) */}
        {Platform.OS === "ios" ? (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.modalDone}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              </View>
            </View>
          </Modal>
        ) : (
          showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )
        )}

        {/* Time Picker Modal (iOS) or Native (Android) */}
        {Platform.OS === "ios" ? (
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Time</Text>
                  <Pressable onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.modalDone}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              </View>
            </View>
          </Modal>
        ) : (
          showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )
        )}

        {/* Group Picker Modal */}
        <Modal
          visible={showGroupPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.groupPickerModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Group</Text>
                <Pressable onPress={() => setShowGroupPicker(false)}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <FlatList
                data={mockGroups}
                keyExtractor={(item) => String(item.group_id)}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.groupItem,
                      selectedGroup?.group_id === item.group_id &&
                        styles.groupItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedGroup(item);
                      setShowGroupPicker(false);
                    }}
                  >
                    <Image
                      source={{ uri: item.pfp }}
                      style={styles.groupItemAvatar}
                    />
                    <Text style={styles.groupItemName}>{item.name}</Text>
                    {selectedGroup?.group_id === item.group_id && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color="#6366f1"
                      />
                    )}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalDone: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
  },
  groupSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  groupAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
  },
  groupText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  groupPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#9ca3af",
  },
  required: {
    color: "#ef4444",
  },
  groupPickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    paddingBottom: 32,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  groupItemSelected: {
    backgroundColor: "#f0f9ff",
  },
  groupItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
  },
  groupItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  noGroupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
});
