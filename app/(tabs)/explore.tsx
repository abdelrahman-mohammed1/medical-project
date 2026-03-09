// src/screens/AddMedicationScreen.js
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { useMedications } from "../../context/DatabaseContext";
import { insertMedication, updateMedication } from "../../database/db";
import { scheduleMedicationReminder, cancelMedicationReminder } from "../../services/notificationService";

export default function AddMedicationScreen() {
  const { loadMedications } = useMedications();
  const params = useLocalSearchParams();
  
  // Check if we're in edit mode
  const isEditMode = params.editMode === "true";
  const medicationId = params.medicationId ? parseInt(params.medicationId as string) : null;

  const [name, setName] = useState((params.name as string) || "");
  const [description, setDescription] = useState((params.description as string) || "");
  
  // Fix image URI - handle empty string vs null properly
  const initialImageUri = params.imageUri as string;
  const [imageUri, setImageUri] = useState<string | null>(
    initialImageUri && initialImageUri.trim() !== "" && initialImageUri !== "null" && initialImageUri !== "undefined" ? initialImageUri : null
  );
  
  // Set default time to current time + 3 minutes or use existing time
  const getDefaultTime = () => {
    if (isEditMode && params.notifyTime) {
      const [h, m] = (params.notifyTime as string).split(":").map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      return date;
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() + 3);
    return now;
  };
  
  const [notifyTime, setNotifyTime] = useState(getDefaultTime());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state when params change (e.g. editing a different medication)
  useEffect(() => {
    setName((params.name as string) || "");
    setDescription((params.description as string) || "");
    
    const initialImg = params.imageUri as string;
    setImageUri(
      initialImg && initialImg.trim() !== "" && initialImg !== "null" && initialImg !== "undefined" ? initialImg : null
    );
    
    setNotifyTime(getDefaultTime());
  }, [
    params.medicationId, 
    params.editMode, 
    params.name, 
    params.description, 
    params.imageUri, 
    params.notifyTime
  ]);

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
    try {
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
        base64: false,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow camera access.");
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disabling this prevents Android from aggressively killing the app for memory (OOM)
        aspect: [1, 1],
        quality: 0.5, // Lower quality to save memory
        base64: false,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
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
  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) setNotifyTime(selectedDate);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const timeString = (date: Date) => {
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
    
    if (!description.trim()) {
      Alert.alert("Validation", "Please enter a description.");
      return;
    }

    setSaving(true);
    try {
      const tStr = timeString(notifyTime);

      // ✅ الـ Daily reminder الحقيقي
      const notifId = await scheduleMedicationReminder(name.trim(), tStr);

      if (isEditMode && medicationId) {
        // Cancel old notification first if it exists
        if (params.notifId && (params.notifId as string).trim() !== "") {
          try {
            await cancelMedicationReminder(params.notifId as string);
          } catch (error) {
            console.log("Could not cancel old notification:", error);
          }
        }
        
        // Update existing medication
        const updateResult = await updateMedication(medicationId, {
          name: name.trim(),
          description: description.trim(),
          imageUri: imageUri || "",
          notifyTime: tStr,
          notifId,
        });
        
        if (updateResult > 0) {
          Alert.alert(
            "✅ Updated!",
            `${name} updated successfully!\nReminder set for ${formatTime(notifyTime)}.`,
          );
        } else {
          throw new Error("No rows were updated");
        }
      } else {
        // Create new medication
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
        
        Alert.alert(
          "✅ Saved!",
          `${name} added successfully!\nReminder set for ${formatTime(notifyTime)}.`,
        );
      }

      await loadMedications();

      // Reset form
      setName("");
      setDescription("");
      setImageUri(null);
      setNotifyTime(getDefaultTime());

      // Navigate to medications list
      router.push("/(tabs)");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", `Failed to ${isEditMode ? 'update' : 'save'} medication. Please try again.`);
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
        <Text style={styles.label}>Description *</Text>
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
            <Text style={styles.saveBtnText}>
              {isEditMode ? "Update Medication" : "Save Medication"}
            </Text>
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
