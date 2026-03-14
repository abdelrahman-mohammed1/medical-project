// app/(tabs)/reminders.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { getFormularyTranslation } from "../../constants/formularyTranslations";
import { useLanguage } from "../../context/LanguageContext";
import { useThemeMode } from "../../context/ThemeContext";
import { getMedicationsWithReminders } from "../../database/db";

interface Medication {
  id: number;
  brand_name: string;
  generic_name: string;
  drug_class: string;
  dose: string;
  form: string;
  image_uri: string;
  reminder_time: string;
  note: string;
  is_default?: number;
}

const STRINGS = {
  en: {
    errorTitle: "Error",
    errorBody: "Failed to load reminders.",
    noRemindersTitle: "No Reminders",
    noRemindersSubtitle: "You haven't set any medication reminders yet.",
    noRemindersHint:
      'Go to "My Medications" and tap "Set Reminder" on any medication.',
    headerTitle: "My Reminders",
    activeReminderSuffixSingle: " active reminder",
    activeReminderSuffixPlural: " active reminders",
  },
  ar: {
    errorTitle: "خطأ",
    errorBody: "فشل في تحميل التذكيرات.",
    noRemindersTitle: "لا توجد تذكيرات",
    noRemindersSubtitle: "لم تقم بإضافة أي تذكير للأدوية حتى الآن.",
    noRemindersHint:
      'اذهب إلى "أدويتي" ثم اضغط "تعيين تذكير" لأي دواء.',
    headerTitle: "تذكيراتي",
    activeReminderSuffixSingle: " تذكير نشط",
    activeReminderSuffixPlural: " تذكيرات نشطة",
  },
} as const;

export default function RemindersScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const t = STRINGS[language];

  const loadReminders = useCallback(async () => {
    try {
      console.log("Loading reminders...");
      const data = await getMedicationsWithReminders();
      console.log("Reminders loaded:", data.length);
      setMedications(data);
    } catch (error) {
      console.error("Error loading reminders:", error);
      console.error("Error details:", error.message, error.stack);
      Alert.alert(t.errorTitle, t.errorBody);
    } finally {
      setLoading(false);
    }
  }, [t.errorTitle, t.errorBody]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReminders();
    }, [loadReminders]),
  );

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampmEn = hour >= 12 ? "PM" : "AM";
    const ampmAr = hour >= 12 ? "م" : "ص";
    const displayHour = hour % 12 || 12;
    const suffix = language === "ar" ? ampmAr : ampmEn;
    return `${displayHour}:${minutes} ${suffix}`;
  };

  const handleViewDetail = (item: Medication) => {
    router.push({
      pathname: "/(tabs)/medication-detail",
      params: {
        brandName: item.brand_name,
        genericName: item.generic_name || "",
        drugClass: item.drug_class || "",
        dose: item.dose || "",
        form: item.form || "",
        note: item.note || "",
        imageUri:
          item.image_uri && item.image_uri.trim() !== "" ? item.image_uri : "",
        reminderTime: item.reminder_time || "",
        isDefault: item.is_default?.toString() || "0",
      },
    });
  };

  const renderMedicationItem = ({ item }: { item: Medication }) => {
    const hasImage = item.image_uri && item.image_uri.trim() !== "";
    const isDefault = item.is_default === 1;
    const formularyTr = isDefault
      ? getFormularyTranslation(item.brand_name)
      : null;

    return (
      <View
        style={[
          styles.medicationCard,
          {
            backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
            borderColor: isDark ? "#2D3E55" : "#E5E7EB",
          },
        ]}
      >
        <Image
          source={
            hasImage
              ? { uri: item.image_uri }
              : require("../../assets/images/pill-placeholder.png")
          }
          defaultSource={require("../../assets/images/pill-placeholder.png")}
          style={styles.medicationImage}
        />
        <View style={styles.medicationInfo}>
          <Text
            style={[
              styles.brandName,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            {language === "ar" && formularyTr?.brandAr
              ? formularyTr.brandAr
              : item.brand_name}
          </Text>
          {item.generic_name ? (
            <Text
              style={[
                styles.genericName,
                { color: isDark ? "#4F8EF7" : "#1D4ED8" },
              ]}
            >
              {language === "ar" && formularyTr?.genericAr
                ? formularyTr.genericAr
                : item.generic_name}
            </Text>
          ) : null}
          {item.drug_class ? (
            <Text
              style={[
                styles.drugClass,
                { color: isDark ? "#8E9BAE" : "#4B5563" },
              ]}
            >
              {language === "ar" && formularyTr?.clsAr
                ? formularyTr.clsAr
                : item.drug_class}
            </Text>
          ) : null}
          {item.dose || item.form ? (
            <Text
              style={[styles.dose, { color: isDark ? "#A0AEC0" : "#4B5563" }]}
            >
              {language === "ar" && formularyTr?.doseAr && item.dose
                ? `${formularyTr.doseAr}${
                    item.form ? ` · ${item.form}` : ""
                  }`
                : [item.dose, item.form].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}

          <View style={[
            styles.reminderInfo,
            {
              backgroundColor: isDark ? "#0E2044" : "#EBF4FF",
              borderColor: isDark ? "#1E3A6E" : "#BFDBFE",
            }
          ]}>
            <Ionicons name="alarm" size={16} color="#4F8EF7" />
            <Text style={[
              styles.reminderTime,
              { color: isDark ? "#4F8EF7" : "#1D4ED8" }
            ]}>
              {formatTime(item.reminder_time)}
            </Text>
          </View>
        </View>

        {/* 👁️ Eye icon — view details */}
        <TouchableOpacity
          style={[
            styles.eyeBtn,
            {
              backgroundColor: isDark ? "#0D1E35" : "#F0F9FF",
              borderColor: isDark ? "#1E3A6E" : "#BFDBFE",
            }
          ]}
          onPress={() => handleViewDetail(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="eye-outline" 
            size={20} 
            color={isDark ? "#63B3ED" : "#2563EB"} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDark ? "#0A1628" : "#F9FAFB" },
        ]}
      >
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={isDark ? "#0A1628" : "#000000"}
        />
        <ActivityIndicator color="#4F8EF7" size="large" />
      </View>
    );
  }

  if (medications.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: isDark ? "#0A1628" : "#F9FAFB" },
        ]}
      >
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={isDark ? "#0A1628" : "#000000"}
        />
        <Ionicons name="alarm-outline" size={80} color="#2D3E55" />
        <Text
          style={[
            styles.emptyTitle,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          {t.noRemindersTitle}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: isDark ? "#8E9BAE" : "#4B5563" },
          ]}
        >
          {t.noRemindersSubtitle}
        </Text>
        <Text
          style={[
            styles.emptyHint,
            { color: isDark ? "#4A5568" : "#6B7280" },
          ]}
        >
          {t.noRemindersHint}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0A1628" : "#F9FAFB" },
      ]}
    >
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={isDark ? "#0A1628" : "#000000"}
      />
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          {t.headerTitle}
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            { color: isDark ? "#4F8EF7" : "#2563EB" },
          ]}
        >
          {medications.length}
          {medications.length !== 1
            ? t.activeReminderSuffixPlural
            : t.activeReminderSuffixSingle}
        </Text>
      </View>

      <FlatList
        data={medications}
        renderItem={renderMedicationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A1628",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A1628",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#8E9BAE",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyHint: {
    color: "#4A5568",
    fontSize: 13,
    marginTop: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2A3A",
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "700" },
  headerSubtitle: {
    color: "#4F8EF7",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "600",
  },
  listContainer: { padding: 16 },

  medicationCard: {
    backgroundColor: "#1A2740",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D3E55",
    elevation: 3,
  },
  medicationImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: "#0A1628",
  },
  medicationInfo: { flex: 1 },
  brandName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  genericName: { color: "#4F8EF7", fontSize: 13, marginBottom: 3 },
  drugClass: { color: "#8E9BAE", fontSize: 12, marginBottom: 3 },
  dose: { color: "#A0AEC0", fontSize: 12, marginBottom: 6 },
  note: {
    color: "#F6AD55",
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
  },

  reminderInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    gap: 5,
  },
  reminderTime: { fontSize: 13, fontWeight: "700" },

  // 👁️ Eye button
  eyeBtn: {
    padding: 8,
    marginLeft: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
});
