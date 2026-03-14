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
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useMedications } from "../../context/DatabaseContext";
import { useLanguage } from "../../context/LanguageContext";
import { useThemeMode } from "../../context/ThemeContext";

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
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const STRINGS = {
  en: {
    permissionRequiredTitle: "Permission Required",
    permissionRequiredBody:
      "Enable notifications in Settings to receive medication reminders.",
    permissionNeededTitle: "Permission needed",
    permissionPhotos: "Please allow access to your photo library.",
    permissionCamera: "Please allow camera access.",
    addImageTitle: "Add Image",
    addImageBody: "Choose an option",
    takePhoto: "Take Photo",
    chooseFromLibrary: "Choose from Library",
    cancel: "Cancel",
    noChangeTitle: "No Change",
    noChangeBody: "Please pick a new image first.",
    imageUpdatedTitle: "✅ Image Updated",
    imageUpdatedBody: "The medication image has been saved.",
    imageErrorTitle: "Error",
    imageErrorBody: "Failed to update image. Please try again.",
    reminderSetTitle: "✅ Reminder Set",
    reminderSetBodyPrefix: "Daily reminder set for ",
    reminderErrorTitle: "Error",
    reminderErrorBody: "Failed to set reminder. Please try again.",
    validationTitle: "Validation",
    validationBrand: "Please enter a Brand Name.",
    updatedTitle: "✅ Updated!",
    updatedBodySuffix: " updated successfully.",
    savedTitle: "✅ Saved!",
    savedBodySuffix: " added successfully.",
    saveErrorTitle: "Error",
    saveErrorBodyUpdate:
      "Failed to update medication. Please try again.",
    saveErrorBodySave: "Failed to save medication. Please try again.",
    formularyBanner:
      "Formulary Drug — you can update the image and/or set a daily reminder independently.",
    medicationImage: "Medication Image",
    saveImage: "Save Image",
    dailyReminder: "Daily Reminder",
    setReminder: "Set Reminder",
    screenTitleReminder: "Formulary Drug",
    screenTitleEdit: "Edit Medication",
    screenTitleAdd: "Add Medication",
    brandLabel: "Brand Name *",
    brandPlaceholder: "e.g. Norvasc",
    genericLabel: "Generic Name",
    genericPlaceholder: "e.g. Amlodipine",
    noteLabel: "Note",
    notePlaceholder: "Usage instructions, dosage notes...",
    classLabel: "Class",
    classPlaceholder: "e.g. Calcium channel blocker",
    doseLabel: "Dose",
    dosePlaceholder: "e.g. 10 mg daily",
    formLabel: "Form",
    reminderTimeLabel: "Reminder Time",
    updateMedication: "Update Medication",
    saveMedication: "Save Medication",
    done: "Done",
    formOptions: ["Tablet", "Capsule", "Injection", "Syrup", "Drops", "Other"],
  },
  ar: {
    permissionRequiredTitle: "مطلوب صلاحية",
    permissionRequiredBody:
      "فعّل الإشعارات من الإعدادات علشان تستقبل تذكير بالأدوية.",
    permissionNeededTitle: "بحاجة لصلاحية",
    permissionPhotos: "من فضلك اسمح للتطبيق بالوصول للصور.",
    permissionCamera: "من فضلك اسمح للتطبيق باستخدام الكاميرا.",
    addImageTitle: "إضافة صورة",
    addImageBody: "اختر خيارًا",
    takePhoto: "التقاط صورة",
    chooseFromLibrary: "اختيار من المعرض",
    cancel: "إلغاء",
    noChangeTitle: "لا يوجد تغيير",
    noChangeBody: "من فضلك اختر صورة جديدة أولًا.",
    imageUpdatedTitle: "✅ تم تحديث الصورة",
    imageUpdatedBody: "تم حفظ صورة الدواء بنجاح.",
    imageErrorTitle: "خطأ",
    imageErrorBody: "فشل في تحديث الصورة، حاول مرة أخرى.",
    reminderSetTitle: "✅ تم ضبط التذكير",
    reminderSetBodyPrefix: "تم تعيين تذكير يومي في ",
    reminderErrorTitle: "خطأ",
    reminderErrorBody: "فشل في ضبط التذكير، حاول مرة أخرى.",
    validationTitle: "تحقق من البيانات",
    validationBrand: "من فضلك أدخل اسم الدواء (البراند).",
    updatedTitle: "✅ تم التحديث!",
    updatedBodySuffix: " تم تحديثه بنجاح.",
    savedTitle: "✅ تم الحفظ!",
    savedBodySuffix: " تم إضافته بنجاح.",
    saveErrorTitle: "خطأ",
    saveErrorBodyUpdate:
      "فشل في تحديث بيانات الدواء، حاول مرة أخرى.",
    saveErrorBodySave: "فشل في حفظ بيانات الدواء، حاول مرة أخرى.",
    formularyBanner:
      "دواء من القائمة الأساسية — يمكنك تعديل الصورة أو تعيين تذكير يومي بشكل مستقل.",
    medicationImage: "صورة الدواء",
    saveImage: "حفظ الصورة",
    dailyReminder: "تذكير يومي",
    setReminder: "تعيين تذكير",
    screenTitleReminder: "دواء من القائمة الأساسية",
    screenTitleEdit: "تعديل دواء",
    screenTitleAdd: "إضافة دواء",
    brandLabel: "اسم الدواء *",
    brandPlaceholder: "مثال: Norvasc",
    genericLabel: "الاسم العلمي",
    genericPlaceholder: "مثال: Amlodipine",
    noteLabel: "ملاحظة",
    notePlaceholder: "تعليمات الاستخدام، ملاحظات الجرعة...",
    classLabel: "الفئة",
    classPlaceholder: "مثال: Calcium channel blocker",
    doseLabel: "الجرعة",
    dosePlaceholder: "مثال: 10 mg يوميًا",
    formLabel: "الهيئة الدوائية",
    reminderTimeLabel: "وقت التذكير",
    updateMedication: "تحديث الدواء",
    saveMedication: "حفظ الدواء",
    done: "تم",
    formOptions: ["قرص", "كبسولة", "حقنة", "شراب", "قطرات", "أخرى"],
  },
} as const;

const FORM_OPTIONS_EN = STRINGS.en.formOptions;
const FORM_OPTIONS_AR = STRINGS.ar.formOptions;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddMedicationScreen() {
  const { addMedication, editMedication, addReminder, updateImage } =
    useMedications() as any;
  const { language } = useLanguage();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const t = STRINGS[language];
  const formOptions = language === "ar" ? FORM_OPTIONS_AR : FORM_OPTIONS_EN;
  const params = useLocalSearchParams();

  // Mode flags
  const isEditMode = params.editMode === "true";
  const isReminderOnly = params.reminderOnly === "true";
  const medicationId = params.medicationId
    ? parseInt(params.medicationId as string)
    : null;

  // Form state
  const [brandName, setBrandName] = useState(
    (params.brandName as string) || "",
  );
  const [genericName, setGenericName] = useState(
    (params.genericName as string) || "",
  );
  const [note, setNote] = useState((params.note as string) || "");
  const [drugClass, setDrugClass] = useState(
    (params.drugClass as string) || "",
  );
  const [dose, setDose] = useState((params.dose as string) || "");
  const [selectedForm, setSelectedForm] = useState(
    (params.form as string) || "",
  );

  const initialImg = params.imageUri as string;
  const [imageUri, setImageUri] = useState<string | null>(
    initialImg && initialImg !== "null" && initialImg.trim() !== ""
      ? initialImg
      : null,
  );

  const [notifyTime, setNotifyTime] = useState<Date>(
    timeToDate(params.reminderTime as string | undefined),
  );
  const [showPicker, setShowPicker] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-sync when params change
  useEffect(() => {
    setBrandName((params.brandName as string) || "");
    setGenericName((params.genericName as string) || "");
    setNote((params.note as string) || "");
    setDrugClass((params.drugClass as string) || "");
    setDose((params.dose as string) || "");
    setSelectedForm((params.form as string) || "");
    const img = params.imageUri as string;
    setImageUri(img && img !== "null" && img.trim() !== "" ? img : null);
    setNotifyTime(timeToDate(params.reminderTime as string | undefined));
  }, [params.medicationId, params.editMode, params.reminderOnly]);

  // Request notification permission
  useEffect(() => {
    Notifications.requestPermissionsAsync().then(({ status }) => {
      if (status !== "granted") {
        Alert.alert(
          t.permissionRequiredTitle,
          t.permissionRequiredBody,
        );
      }
    });
    // we intentionally omit `t` from deps to avoid re-requesting permissions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Image picker ─────────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t.permissionNeededTitle,
        t.permissionPhotos,
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0])
      setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.permissionNeededTitle, t.permissionCamera);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0])
      setImageUri(result.assets[0].uri);
  };

  const handleImagePress = () =>
    Alert.alert(t.addImageTitle, t.addImageBody, [
      { text: t.takePhoto, onPress: takePhoto },
      { text: t.chooseFromLibrary, onPress: pickImage },
      { text: t.cancel, style: "cancel" },
    ]);

  // ── Save image only (formulary drugs) ────────────────────────────────────────
  const handleSaveImage = async () => {
    if (!medicationId || !imageUri) return;

    const originalImg = params.imageUri as string;
    if (imageUri === originalImg || imageUri === "null") {
      Alert.alert(t.noChangeTitle, t.noChangeBody);
      return;
    }

    setSavingImage(true);
    const ok = await updateImage(medicationId, imageUri);
    setSavingImage(false);

    if (ok) {
      Alert.alert(t.imageUpdatedTitle, t.imageUpdatedBody);
    } else {
      Alert.alert(t.imageErrorTitle, t.imageErrorBody);
    }
  };

  // ── Save reminder only (formulary drugs) ─────────────────────────────────────
  const handleSaveReminder = async () => {
    if (!medicationId) return;

    setSavingReminder(true);
    const tStr = dateToTimeStr(notifyTime);
    const ok = await addReminder(
      medicationId,
      (params.brandName as string) || "Medication",
      tStr,
    );
    setSavingReminder(false);

    if (ok) {
      Alert.alert(
        t.reminderSetTitle,
        `${t.reminderSetBodyPrefix}${formatTime(notifyTime)}.`,
      );
      router.push("/(tabs)");
    } else {
      Alert.alert("Error", "Failed to set reminder. Please try again.");
    }
  };

  // ── Save (add / edit regular medications) ────────────────────────────────────
  const handleSave = async () => {
    if (!brandName.trim()) {
      Alert.alert(t.validationTitle, t.validationBrand);
      return;
    }

    setSaving(true);
    try {
      const tStr = dateToTimeStr(notifyTime);
      const fields = {
        brandName: brandName.trim(),
        genericName: genericName.trim(),
        note: note.trim(),
        drugClass: drugClass.trim(),
        dose: dose.trim(),
        form: selectedForm,
        imageUri: imageUri || "",
        reminderTime: tStr,
      };

      let ok: boolean;
      if (isEditMode && medicationId) {
        ok = await editMedication(medicationId, fields);
        if (ok)
          Alert.alert(t.updatedTitle, `${brandName}${t.updatedBodySuffix}`);
        else throw new Error("Update returned 0 changes");
      } else {
        ok = await addMedication(fields);
        if (ok)
          Alert.alert(t.savedTitle, `${brandName}${t.savedBodySuffix}`);
        else throw new Error("Insert failed");
      }

      setBrandName("");
      setGenericName("");
      setNote("");
      setDrugClass("");
      setDose("");
      setSelectedForm("");
      setImageUri(null);
      setNotifyTime(timeToDate());
      router.push("/(tabs)");
    } catch (err) {
      console.error(err);
      Alert.alert(
        t.saveErrorTitle,
        isEditMode ? t.saveErrorBodyUpdate : t.saveErrorBodySave,
      );
    } finally {
      setSaving(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────────
  const screenTitle = isReminderOnly
    ? (params.brandName as string) || t.screenTitleReminder
    : isEditMode
      ? t.screenTitleEdit
      : t.screenTitleAdd;

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={isDark ? "#0A1628" : "#000000"}
      />
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#0A1628" : "#F9FAFB" },
        ]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "ios" ? 56 : 64 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
      <Text
        style={[
          styles.screenTitle,
          { color: isDark ? "#FFFFFF" : "#111827" },
        ]}
      >
        {screenTitle}
      </Text>

      {/* ── Reminder-only UI (formulary drugs) ── */}
      {isReminderOnly ? (
        <>
          <View style={styles.reminderOnlyBanner}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#4F8EF7"
            />
            <Text
              style={[
                styles.reminderOnlyText,
                { color: isDark ? "#8E9BAE" : "#4B5563" },
              ]}
            >
              {t.formularyBanner}
            </Text>
          </View>

          {/* ── IMAGE SECTION ── */}
          <View style={styles.sectionCard}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              <Ionicons name="image-outline" size={15} color="#A0AEC0" />{" "}
              {t.medicationImage}
            </Text>

            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handleImagePress}
              activeOpacity={0.8}
            >
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

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.imageBtn,
                { backgroundColor: isDark ? "#2D5A8E" : "#2563EB" },
              ]}
              onPress={handleSaveImage}
              disabled={savingImage}
              activeOpacity={0.85}
            >
              {savingImage ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="image-outline"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionBtnText}>{t.saveImage}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── REMINDER SECTION ── */}
          <View style={styles.sectionCard}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              <Ionicons name="alarm-outline" size={15} color="#A0AEC0" />{" "}
              {t.dailyReminder}
            </Text>

            <TouchableOpacity
              style={[
                styles.timePicker,
                {
                  backgroundColor: isDark ? "#0A1628" : "#FFFFFF",
                  borderColor: isDark ? "#2D3E55" : "#D1D5DB",
                },
              ]}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="time-outline" size={22} color="#4F8EF7" />
              <Text
                style={[
                  styles.timeText,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                {formatTime(notifyTime)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#8E9BAE" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.reminderBtn,
                { backgroundColor: isDark ? "#4F8EF7" : "#16A34A" },
              ]}
              onPress={handleSaveReminder}
              disabled={savingReminder}
              activeOpacity={0.85}
            >
              {savingReminder ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="alarm-outline"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionBtnText}>{t.setReminder}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* ── Image ── */}
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handleImagePress}
            activeOpacity={0.8}
          >
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
            <Text
              style={[
                styles.label,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              {t.brandLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
                  borderColor: isDark ? "#2D3E55" : "#D1D5DB",
                  color: isDark ? "#FFFFFF" : "#111827",
                },
              ]}
              placeholder={t.brandPlaceholder}
              placeholderTextColor={isDark ? "#4A5568" : "#9CA3AF"}
              value={brandName}
              onChangeText={setBrandName}
            />
          </View>

          {/* ── Generic Name ── */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.label,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              {t.genericLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
                  borderColor: isDark ? "#2D3E55" : "#D1D5DB",
                  color: isDark ? "#FFFFFF" : "#111827",
                },
              ]}
              placeholder={t.genericPlaceholder}
              placeholderTextColor={isDark ? "#4A5568" : "#9CA3AF"}
              value={genericName}
              onChangeText={setGenericName}
            />
          </View>

          {/* ── Note ── */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.label,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              {t.noteLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
                  borderColor: isDark ? "#2D3E55" : "#D1D5DB",
                  color: isDark ? "#FFFFFF" : "#111827",
                },
              ]}
              placeholder={t.notePlaceholder}
              placeholderTextColor={isDark ? "#4A5568" : "#9CA3AF"}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* ── Class ── */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.label,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              {t.classLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
                  borderColor: isDark ? "#2D3E55" : "#D1D5DB",
                  color: isDark ? "#FFFFFF" : "#111827",
                },
              ]}
              placeholder={t.classPlaceholder}
              placeholderTextColor={isDark ? "#4A5568" : "#9CA3AF"}
              value={drugClass}
              onChangeText={setDrugClass}
            />
          </View>

          {/* ── Dose ── */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.label,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              {t.doseLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
                  borderColor: isDark ? "#2D3E55" : "#D1D5DB",
                  color: isDark ? "#FFFFFF" : "#111827",
                },
              ]}
              placeholder={t.dosePlaceholder}
              placeholderTextColor={isDark ? "#4A5568" : "#9CA3AF"}
              value={dose}
              onChangeText={setDose}
            />
          </View>

          {/* ── Form ── */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.label,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              {t.formLabel}
            </Text>
            <View style={styles.chipRow}>
              {formOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedForm === opt 
                        ? "#4F8EF7" 
                        : isDark ? "#1A2740" : "#F3F4F6",
                      borderColor: selectedForm === opt 
                        ? "#4F8EF7" 
                        : isDark ? "#2D3E55" : "#D1D5DB",
                    }
                  ]}
                  onPress={() => setSelectedForm(opt)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selectedForm === opt 
                          ? "#FFFFFF" 
                          : isDark ? "#8E9BAE" : "#4B5563"
                      }
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Reminder Time ── */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.label,
                { color: isDark ? "#A0AEC0" : "#4B5563" },
              ]}
            >
              {t.reminderTimeLabel}
            </Text>
            <TouchableOpacity
              style={[
                styles.timePicker,
                {
                  backgroundColor: isDark ? "#0A1628" : "#FFFFFF",
                  borderColor: isDark ? "#2D3E55" : "#D1D5DB",
                },
              ]}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="time-outline" size={22} color="#4F8EF7" />
              <Text
                style={[
                  styles.timeText,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                {formatTime(notifyTime)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#8E9BAE" />
            </TouchableOpacity>
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: isDark ? "#4F8EF7" : "#2563EB" },
            ]}
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
                  {isEditMode ? t.updateMedication : t.saveMedication}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* ── Date/Time Picker ── */}
      {showPicker && (
        <DateTimePicker
          value={notifyTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant={isDark ? "dark" : "light"}
          onChange={(_, selectedDate) => {
            setShowPicker(Platform.OS === "ios");
            if (selectedDate) setNotifyTime(selectedDate);
          }}
        />
      )}
      {showPicker && Platform.OS === "ios" && (
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => setShowPicker(false)}
        >
          <Text
            style={[
              styles.doneBtnText,
              { color: isDark ? "#4F8EF7" : "#2563EB" },
            ]}
          >
            {t.done}
          </Text>
        </TouchableOpacity>
      )}
      </ScrollView>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  content: { padding: 24, paddingBottom: 56 },

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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2D3E55",
    gap: 10,
  },
  reminderOnlyText: { flex: 1, color: "#8E9BAE", fontSize: 14, lineHeight: 20 },

  // ── Section card ──
  sectionCard: {
    backgroundColor: "#1A2740",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2D3E55",
  },
  sectionTitle: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
  },

  // ── Image ──
  imagePicker: { alignSelf: "center", marginBottom: 16, position: "relative" },
  image: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#4F8EF7",
  },
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

  // ── Independent action buttons ──
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  imageBtn: { backgroundColor: "#2D5A8E" },
  reminderBtn: { backgroundColor: "#4F8EF7" },

  // ── Time picker row ──
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1628",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2D3E55",
    marginBottom: 12,
  },
  timeText: { flex: 1, color: "#fff", fontSize: 16, marginLeft: 10 },

  // ── Regular form fields ──
  fieldGroup: { marginBottom: 20 },
  label: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "#1A2740",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2D3E55",
  },
  textArea: { height: 90, paddingTop: 12 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

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
    elevation: 6,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
