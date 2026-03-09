// app/(tabs)/explore.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
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
import { useMedications } from "../../context/DatabaseContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

const timeToDate = (timeStr?: string): Date => {
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
  const d = new Date();
  d.setMinutes(d.getMinutes() + 3);
  return d;
};

const dateToTimeStr = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
};

const formatTime = (date: Date): string =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

const FORM_OPTIONS = ["Tablet", "Capsule", "Injection", "Syrup", "Drops", "Other"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddMedicationScreen() {
  const { addMedication, editMedication, addReminder } = useMedications();
  const params = useLocalSearchParams();

  // Mode flags
  const isEditMode     = params.editMode     === "true";
  const isReminderOnly = params.reminderOnly === "true"; // default med: only set reminder
  const medicationId   = params.medicationId ? parseInt(params.medicationId as string) : null;

  // Form state
  const [brandName,    setBrandName]    = useState((params.brandName    as string) || "");
  const [genericName,  setGenericName]  = useState((params.genericName  as string) || "");
  const [note,         setNote]         = useState((params.note         as string) || "");
  const [drugClass,    setDrugClass]    = useState((params.drugClass    as string) || "");
  const [dose,         setDose]         = useState((params.dose         as string) || "");
  const [selectedForm, setSelectedForm] = useState((params.form         as string) || "");

  const initialImg = params.imageUri as string;
  const [imageUri, setImageUri] = useState<string | null>(
    initialImg && initialImg !== "null" && initialImg.trim() !== "" ? initialImg : null
  );

  const [notifyTime, setNotifyTime] = useState<Date>(
    timeToDate(params.reminderTime as string | undefined)
  );
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-sync when params change (navigation back to same screen with new params)
  useEffect(() => {
    setBrandName((params.brandName   as string) || "");
    setGenericName((params.genericName as string) || "");
    setNote((params.note              as string) || "");
    setDrugClass((params.drugClass    as string) || "");
    setDose((params.dose              as string) || "");
    setSelectedForm((params.form      as string) || "");
    const img = params.imageUri as string;
    setImageUri(img && img !== "null" && img.trim() !== "" ? img : null);
    setNotifyTime(timeToDate(params.reminderTime as string | undefined));
  }, [params.medicationId, params.editMode, params.reminderOnly]);

  // Request notification permission
  useEffect(() => {
    Notifications.requestPermissionsAsync().then(({ status }) => {
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Enable notifications in Settings to receive medication reminders."
        );
      }
    });
  }, []);

  // ── Image picker ─────────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]) setImageUri(result.assets[0].uri);
  };

  const handleImagePress = () =>
    Alert.alert("Add Image", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // ── Reminder-only mode (for default medications) ──
    if (isReminderOnly && medicationId) {
      setSaving(true);
      const tStr = dateToTimeStr(notifyTime);
      const ok = await (addReminder as any)(medicationId, (params.brandName as string) || "Medication", tStr);
      setSaving(false);
      if (ok) {
        Alert.alert("✅ Reminder Set", `Daily reminder set for ${formatTime(notifyTime)}.`);
        router.push("/(tabs)");
      } else {
        Alert.alert("Error", "Failed to set reminder. Please try again.");
      }
      return;
    }

    // ── Add / Edit mode ───────────────────────────────
    if (!brandName.trim()) {
      Alert.alert("Validation", "Please enter a Brand Name.");
      return;
    }

    setSaving(true);
    try {
      const tStr = dateToTimeStr(notifyTime);
      const fields = {
        brandName:   brandName.trim(),
        genericName: genericName.trim(),
        note:        note.trim(),
        drugClass:   drugClass.trim(),
        dose:        dose.trim(),
        form:        selectedForm,
        imageUri:    imageUri || "",
        reminderTime: tStr,
      };

      let ok: boolean;
      if (isEditMode && medicationId) {
        ok = await (editMedication as any)(medicationId, fields);
        if (ok) Alert.alert("✅ Updated!", `${brandName} updated successfully.`);
        else throw new Error("Update returned 0 changes");
      } else {
        ok = await (addMedication as any)(fields);
        if (ok) Alert.alert("✅ Saved!", `${brandName} added successfully.`);
        else throw new Error("Insert failed");
      }

      // Reset form
      setBrandName(""); setGenericName(""); setNote("");
      setDrugClass(""); setDose(""); setSelectedForm("");
      setImageUri(null);
      setNotifyTime(timeToDate());
      router.push("/(tabs)");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", `Failed to ${isEditMode ? "update" : "save"} medication. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────────
  const screenTitle = isReminderOnly
    ? `Set Reminder for ${params.brandName}`
    : isEditMode ? "Edit Medication" : "Add Medication";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>{screenTitle}</Text>

      {/* ── Reminder-only UI ── */}
      {isReminderOnly ? (
        <>
          <View style={styles.reminderOnlyBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#4F8EF7" />
            <Text style={styles.reminderOnlyText}>
              This is a Formulary Drug. You can only set a reminder time.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reminder Time</Text>
            <TouchableOpacity style={styles.timePicker} onPress={() => setShowPicker(true)}>
              <Ionicons name="time-outline" size={22} color="#4F8EF7" />
              <Text style={styles.timeText}>{formatTime(notifyTime)}</Text>
              <Ionicons name="chevron-forward" size={18} color="#8E9BAE" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* ── Image ── */}
          <TouchableOpacity style={styles.imagePicker} onPress={handleImagePress} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <Image
                source={require("../../assets/images/pill-placeholder.png")}
                style={styles.image}
              />
            )}
            <View style={styles.imageEditBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* ── Brand Name ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Brand Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Norvasc"
              placeholderTextColor="#4A5568"
              value={brandName}
              onChangeText={setBrandName}
            />
          </View>

          {/* ── Generic Name ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Generic Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Amlodipine"
              placeholderTextColor="#4A5568"
              value={genericName}
              onChangeText={setGenericName}
            />
          </View>

          {/* ── Note ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Note</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Usage instructions, dosage notes..."
              placeholderTextColor="#4A5568"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* ── Class ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Class</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Calcium channel blocker"
              placeholderTextColor="#4A5568"
              value={drugClass}
              onChangeText={setDrugClass}
            />
          </View>

          {/* ── Dose ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Dose</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10 mg daily"
              placeholderTextColor="#4A5568"
              value={dose}
              onChangeText={setDose}
            />
          </View>

          {/* ── Form ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Form</Text>
            <View style={styles.chipRow}>
              {FORM_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, selectedForm === opt && styles.chipActive]}
                  onPress={() => setSelectedForm(opt)}
                >
                  <Text style={[styles.chipText, selectedForm === opt && styles.chipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Reminder Time ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reminder Time</Text>
            <TouchableOpacity style={styles.timePicker} onPress={() => setShowPicker(true)}>
              <Ionicons name="time-outline" size={22} color="#4F8EF7" />
              <Text style={styles.timeText}>{formatTime(notifyTime)}</Text>
              <Ionicons name="chevron-forward" size={18} color="#8E9BAE" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Date/Time Picker ── */}
      {showPicker && (
        <DateTimePicker
          value={notifyTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant="dark"
          onChange={(_, selectedDate) => {
            setShowPicker(Platform.OS === "ios");
            if (selectedDate) setNotifyTime(selectedDate);
          }}
        />
      )}
      {showPicker && Platform.OS === "ios" && (
        <TouchableOpacity style={styles.doneBtn} onPress={() => setShowPicker(false)}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      )}

      {/* ── Save button ── */}
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
            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>
              {isReminderOnly ? "Set Reminder" : isEditMode ? "Update Medication" : "Save Medication"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  content:   { padding: 24, paddingBottom: 56 },

  screenTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },

  reminderOnlyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#162036",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2D3E55",
    gap: 10,
  },
  reminderOnlyText: { flex: 1, color: "#8E9BAE", fontSize: 14, lineHeight: 20 },

  imagePicker:  { alignSelf: "center", marginBottom: 28, position: "relative" },
  image:        { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#4F8EF7" },
  imageEditBadge: {
    position: "absolute", bottom: 4, right: 4,
    backgroundColor: "#4F8EF7", borderRadius: 12,
    width: 24, height: 24,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#0A1628",
  },

  fieldGroup: { marginBottom: 20 },
  label: {
    color: "#A0AEC0", fontSize: 12, fontWeight: "700",
    marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "#1A2740", borderRadius: 12,
    padding: 14, color: "#fff", fontSize: 15,
    borderWidth: 1, borderColor: "#2D3E55",
  },
  textArea: { height: 90, paddingTop: 12 },

  chipRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: "#2D3E55", backgroundColor: "#1A2740",
  },
  chipActive:     { backgroundColor: "#4F8EF7", borderColor: "#4F8EF7" },
  chipText:       { color: "#8E9BAE", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  timePicker: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1A2740", borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: "#2D3E55",
  },
  timeText: { flex: 1, color: "#fff", fontSize: 16, marginLeft: 10 },

  doneBtn:     { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 16, marginBottom: 8 },
  doneBtnText: { color: "#4F8EF7", fontWeight: "600", fontSize: 16 },

  saveBtn: {
    marginTop: 12, backgroundColor: "#4F8EF7",
    borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    elevation: 6,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
