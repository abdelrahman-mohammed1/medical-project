// src/screens/AddMedicationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { insertMedication } from "../../database/db";
import { scheduleMedicationReminder } from "../../services/notificationService";
import { useMedications } from "../../context/DatabaseContext";

export default function AddMedicationScreen() {
  const { loadMedications } = useMedications();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [notifyTime, setNotifyTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── طلب إذن الـ Notifications عند فتح الصفحة ─────────────────────────────
  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive medication reminders.",
        );
      }
    };
    requestPermission();
  }, []);

  // ── Image picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleImagePress = () => {
    Alert.alert("Add Image", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Time picker ───────────────────────────────────────────────────────────
  const onTimeChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) setNotifyTime(selectedDate);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const timeString = (date) => {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter a medication name.");
      return;
    }

    setSaving(true);
    try {
      const tStr = timeString(notifyTime);

      // ✅ الـ Daily reminder الحقيقي
      const notifId = await scheduleMedicationReminder(name.trim(), tStr);

      // 🧪 Test notification بعد 5 ثواني - احذفه بعد ما تتأكد إن كل حاجة شغالة
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Reminder Saved!",
          body: `Daily reminder set for "${name}" at ${formatTime(notifyTime)}`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          channelId: "medication",
        },
      });

      await insertMedication({
        name: name.trim(),
        description: description.trim(),
        imageUri: imageUri || "",
        notifyTime: tStr,
        notifId,
      });

      await loadMedications();

      Alert.alert(
        "✅ Saved!",
        `${name} added.\nReminder set for ${formatTime(notifyTime)}.\n\nYou'll get a test notification in 5 seconds!`,
      );

      // Reset form
      setName("");
      setDescription("");
      setImageUri(null);
      setNotifyTime(new Date());
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save medication. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Image selector */}
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={handleImagePress}
        activeOpacity={0.8}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={40} color="#4F8EF7" />
            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
          </View>
        )}
        <View style={styles.imageEditBadge}>
          <Ionicons name="pencil" size={14} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Medication Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Medication Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Aspirin 100mg"
          placeholderTextColor="#4A5568"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Usage instructions, dosage notes..."
          placeholderTextColor="#4A5568"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Time picker */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Reminder Time</Text>
        <TouchableOpacity
          style={styles.timePicker}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons name="time-outline" size={22} color="#4F8EF7" />
          <Text style={styles.timeText}>{formatTime(notifyTime)}</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E9BAE" />
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={notifyTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onTimeChange}
          themeVariant="dark"
        />
      )}

      {/* iOS confirm button */}
      {showPicker && Platform.OS === "ios" && (
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => setShowPicker(false)}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      )}

      {/* Save */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons
              name="save-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.saveBtnText}>Save Medication</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  content: { padding: 24, paddingBottom: 48 },

  imagePicker: {
    alignSelf: "center",
    marginBottom: 28,
    position: "relative",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#4F8EF7",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1A2740",
    borderWidth: 2,
    borderColor: "#4F8EF7",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { color: "#4F8EF7", fontSize: 12, marginTop: 4 },
  imageEditBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#4F8EF7",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0A1628",
  },

  fieldGroup: { marginBottom: 20 },
  label: {
    color: "#A0AEC0",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#1A2740",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#2D3E55",
  },
  textArea: { height: 100 },

  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2740",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2D3E55",
  },
  timeText: { flex: 1, color: "#fff", fontSize: 16, marginLeft: 10 },

  doneBtn: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  doneBtnText: { color: "#4F8EF7", fontWeight: "600", fontSize: 16 },

  saveBtn: {
    marginTop: 12,
    backgroundColor: "#4F8EF7",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F8EF7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
