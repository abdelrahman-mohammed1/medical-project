// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
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

const formatTime = (timeStr?: string | null, language: "en" | "ar" = "en") => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const ampmEn = h >= 12 ? "PM" : "AM";
  const ampmAr = h >= 12 ? "م" : "ص";
  const hour = h % 12 || 12;
  const suffix = language === "ar" ? ampmAr : ampmEn;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const STRINGS = {
  en: {
    deleteTitle: "Delete Medication",
    deleteBodyPrefix: 'Remove "',
    deleteBodySuffix: '" and its reminder?',
    cancel: "Cancel",
    delete: "Delete",
    reminderLabelPrefix: "Reminder: ",
    reminderLabelSuffix: "  (tap to change)",
    reminderEmpty: "Set Reminder",
    emptyNoResults: "No results found",
    emptyNoMeds: "No medications yet",
    emptySearchHint: "Try a different search term.",
    emptyListHint: 'Tap "Add Medication" to get started.',
    searchPlaceholder: "Search brand or generic name...",
    countSuffixSingle: " medication",
    countSuffixPlural: " medications",
    formularyBadge: "Formulary Drug",
  },
  ar: {
    deleteTitle: "حذف دواء",
    deleteBodyPrefix: 'هل تريد حذف "',
    deleteBodySuffix: '" والتذكير الخاص به؟',
    cancel: "إلغاء",
    delete: "حذف",
    reminderLabelPrefix: "تذكير: ",
    reminderLabelSuffix: "  (اضغط للتعديل)",
    reminderEmpty: "تعيين تذكير",
    emptyNoResults: "لا توجد نتائج",
    emptyNoMeds: "لا توجد أدوية بعد",
    emptySearchHint: "جرّب كلمة بحث مختلفة.",
    emptyListHint: 'اضغط "إضافة دواء" للبدء.',
    searchPlaceholder: "ابحث باسم الدواء أو الاسم العلمي...",
    countSuffixSingle: " دواء",
    countSuffixPlural: " أدوية",
    formularyBadge: "دواء من القائمة الأساسية",
  },
} as const;

// ── MedicationCard ────────────────────────────────────────────────────────────

type MedicationCardProps = {
  item: any;
  onDelete: (id: number, notifId: string) => void;
  onEdit: (medication: any) => void;
  onSetReminder: (medication: any) => void;
  onViewDetail: (medication: any) => void;
};

const MedicationCard = React.memo(
  ({
    item,
    onDelete,
    onEdit,
    onSetReminder,
    onViewDetail,
    language,
  }: MedicationCardProps & { language: "en" | "ar" }) => {
    const { mode } = useThemeMode();
    const isDark = mode === "dark";
    const isDefault = item.is_default === 1;
    
    // Get localized medication data
    const { getLocalizedMedication } = require("../../constants/formularyTranslations");
    const medicationData = {
      brand: item.brand_name,
      generic: item.generic_name,
      cls: item.drug_class,
      dose: item.dose,
      form: item.form,
      image: item.image_uri,
    };
    
    const localizedMed = getLocalizedMedication(medicationData, language);
    const formattedTime = formatTime(item.reminder_time, language);

    const handleDelete = () => {
      Alert.alert(
        STRINGS[language].deleteTitle,
        `${STRINGS[language].deleteBodyPrefix}${item.brand_name}${STRINGS[language].deleteBodySuffix}`,
        [
          { text: STRINGS[language].cancel, style: "cancel" },
          {
            text: STRINGS[language].delete,
            style: "destructive",
            onPress: () => onDelete(item.id, item.notif_id),
          },
        ],
      );
    };

    return (
      <View
        style={[
          styles.card,
          isDefault && styles.cardDefault,
          {
            backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
            borderColor: isDark ? "#2D3E55" : "#E5E7EB",
          },
        ]}
      >
        {/* Formulary badge */}
        {isDefault && (
          <View style={[
            styles.badge,
            {
              backgroundColor: isDark ? "#0E2044" : "#EBF4FF",
              borderColor: isDark ? "#1E3A6E" : "#BFDBFE",
            }
          ]}>
            <Ionicons name="shield-checkmark" size={11} color="#4F8EF7" />
            <Text style={[
              styles.badgeText,
              { color: isDark ? "#4F8EF7" : "#1D4ED8" }
            ]}>
              {STRINGS[language].formularyBadge}
            </Text>
          </View>
        )}

        <View style={styles.cardRow}>
          {/* Image */}
          <Image
            source={
              item.image_uri && item.image_uri.trim() !== ""
                ? { uri: item.image_uri }
                : require("../../assets/images/pill-placeholder.png")
            }
            style={[
              styles.cardImage,
              {
                backgroundColor: isDark ? "#0A1628" : "#EFF6FF",
              },
            ]}
            defaultSource={require("../../assets/images/pill-placeholder.png")}
          />

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text
              style={[
                styles.cardBrand,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
              numberOfLines={1}
            >
              {localizedMed.brand}
            </Text>
            {localizedMed.generic ? (
              <Text
                style={[
                  styles.cardGeneric,
                  { color: isDark ? "#8E9BAE" : "#4B5563" },
                ]}
                numberOfLines={1}
              >
                {localizedMed.generic}
              </Text>
            ) : null}

            <View style={styles.pillRow}>
              {localizedMed.cls ? (
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isDark ? "#0A1628" : "#EFF6FF",
                      borderColor: isDark ? "#2D3E55" : "#DBEAFE",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: isDark ? "#8E9BAE" : "#1D4ED8" },
                    ]}
                  >
                    {localizedMed.cls}
                  </Text>
                </View>
              ) : null}
              {localizedMed.form ? (
                <View
                  style={[
                    styles.pill,
                    styles.pillForm,
                    {
                      backgroundColor: isDark ? "#0A1628" : "#EFF6FF",
                      borderColor: isDark ? "#3D5580" : "#BFDBFE",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: isDark ? "#8E9BAE" : "#1D4ED8" },
                    ]}
                  >
                    {localizedMed.form}
                  </Text>
                </View>
              ) : null}
            </View>

            {localizedMed.dose ? (
              <Text
                style={[
                  styles.cardDose,
                  { color: isDark ? "#8E9BAE" : "#4B5563" },
                ]}
                numberOfLines={1}
              >
                <Ionicons name="medical-outline" size={12} color="#8E9BAE" />{" "}
                {localizedMed.dose}
              </Text>
            ) : null}

            {formattedTime ? (
              <View style={styles.timeRow}>
                <Ionicons name="alarm-outline" size={13} color="#4F8EF7" />
                <Text
                  style={[
                    styles.timeText,
                    { color: isDark ? "#4F8EF7" : "#2563EB" },
                  ]}
                >
                  {formattedTime}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action buttons — right column */}
          <View style={styles.cardActions}>
            {/* 👁️ View Detail — shown for ALL cards */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onViewDetail(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="eye-outline" size={18} color="#63B3ED" />
            </TouchableOpacity>

            {/* Edit & Delete — only for non-default */}
            {!isDefault && (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onEdit(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil-outline" size={17} color="#4F8EF7" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleDelete}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color="#E53E3E" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Set / Edit Reminder button — full width at bottom */}
        <TouchableOpacity
          style={styles.reminderBtn}
          onPress={() => onSetReminder(item)}
        >
          <Ionicons
            name={formattedTime ? "alarm" : "alarm-outline"}
            size={15}
            color={formattedTime ? "#4F8EF7" : "#8E9BAE"}
          />
          <Text
            style={[
              styles.reminderBtnText,
              formattedTime && { color: "#4F8EF7" },
            ]}
          >
            {formattedTime
              ? `${STRINGS[language].reminderLabelPrefix}${formattedTime}${STRINGS[language].reminderLabelSuffix}`
              : STRINGS[language].reminderEmpty}
          </Text>
        </TouchableOpacity>
      </View>
    );
  },
);

MedicationCard.displayName = "MedicationCard";

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MedicationsListScreen() {
  const { medications, loading, loadMedications, search, removeMedication } =
    useMedications() as any;
  const { language } = useLanguage();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const t = STRINGS[language];
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!query) loadMedications(language);
    }, [query, loadMedications, language]),
  );

  const handleSearch = (text: string) => {
    setQuery(text);
    search(text, language);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMedications(language);
    setRefreshing(false);
  };

  const handleDelete = async (id: number, notifId: string) => {
    await removeMedication(id, notifId);
  };

  const handleEdit = (medication: any) => {
    router.push({
      pathname: "/(tabs)/explore",
      params: {
        editMode: "true",
        medicationId: medication.id.toString(),
        brandName: medication.brand_name,
        genericName: medication.generic_name || "",
        note: medication.note || "",
        drugClass: medication.drug_class || "",
        dose: medication.dose || "",
        form: medication.form || "",
        imageUri:
          medication.image_uri && medication.image_uri.trim() !== ""
            ? medication.image_uri
            : "null",
        reminderTime: medication.reminder_time || "",
        notifId: medication.notif_id || "",
      },
    });
  };

  const handleSetReminder = (medication: any) => {
    router.push({
      pathname: "/(tabs)/explore",
      params: {
        reminderOnly: "true",
        medicationId: medication.id.toString(),
        brandName: medication.brand_name,
        reminderTime: medication.reminder_time || "",
      },
    });
  };

  const handleViewDetail = (medication: any) => {
    router.push({
      pathname: "/(tabs)/medication-detail",
      params: {
        brandName: medication.brand_name,
        genericName: medication.generic_name || "",
        drugClass: medication.drug_class || "",
        dose: medication.dose || "",
        form: medication.form || "",
        note: medication.note || "",
        imageUri:
          medication.image_uri && medication.image_uri.trim() !== ""
            ? medication.image_uri
            : "",
        reminderTime: medication.reminder_time || "",
        isDefault: medication.is_default?.toString() || "0",
      },
    });
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medkit-outline" size={64} color="#2D3E55" />
      <Text style={styles.emptyTitle}>
        {query ? t.emptyNoResults : t.emptyNoMeds}
      </Text>
      <Text style={styles.emptySubtitle}>
        {query ? t.emptySearchHint : t.emptyListHint}
      </Text>
    </View>
  );

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
      {/* Search bar */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
            borderColor: isDark ? "#2D3E55" : "#E5E7EB",
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={isDark ? "#8E9BAE" : "#9CA3AF"}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={isDark ? "#4A5568" : "#9CA3AF"}
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={18} color="#8E9BAE" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      {!loading && medications.length > 0 && (
        <Text
          style={[
            styles.countText,
            { color: isDark ? "#8E9BAE" : "#4B5563" },
          ]}
        >
          {medications.length}
          {language === "ar"
            ? medications.length !== 1
              ? t.countSuffixPlural
              : t.countSuffixSingle
            : medications.length !== 1
              ? t.countSuffixPlural
              : t.countSuffixSingle}
        </Text>
      )}

      {/* List */}
      {loading && !refreshing ? (
        <ActivityIndicator
          color="#4F8EF7"
          size="large"
          style={{ marginTop: 48 }}
        />
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MedicationCard
              item={item}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onSetReminder={handleSetReminder}
              onViewDetail={handleViewDetail}
              language={language}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            medications.length === 0 ? styles.flatListEmpty : { padding: 16 }
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4F8EF7"
            />
          }
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2740",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2D3E55",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 12 },

  countText: {
    color: "#8E9BAE",
    fontSize: 12,
    marginHorizontal: 20,
    marginBottom: 4,
  },

  // ── Card ──
  card: {
    backgroundColor: "#1A2740",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2D3E55",
    elevation: 3,
  },
  cardDefault: { borderColor: "#2A3D5A" },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  cardRow: { flexDirection: "row", alignItems: "flex-start" },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#0A1628",
    marginRight: 14,
  },
  cardInfo: { flex: 1, minWidth: 0 },

  cardBrand: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardGeneric: { color: "#8E9BAE", fontSize: 13, marginBottom: 6 },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  pill: {
    backgroundColor: "#0A1628",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#2D3E55",
  },
  pillForm: { borderColor: "#3D5580" },
  pillText: { color: "#8E9BAE", fontSize: 11, fontWeight: "600" },

  cardDose: { color: "#8E9BAE", fontSize: 12, marginBottom: 4 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { color: "#4F8EF7", fontSize: 12, fontWeight: "600" },

  cardActions: { flexDirection: "column", gap: 6, marginLeft: 8 },
  actionBtn: { padding: 6 },

  reminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2D3E55",
  },
  reminderBtnText: {
    color: "#8E9BAE",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  // ── Empty ──
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    color: "#4A5568",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#4A5568",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  flatListEmpty: { flexGrow: 1 },
});
