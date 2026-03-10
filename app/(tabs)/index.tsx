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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMedications } from "../../context/DatabaseContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (timeStr?: string | null) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

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
  }: MedicationCardProps) => {
    const isDefault = item.is_default === 1;
    const formattedTime = formatTime(item.reminder_time);

    const handleDelete = () => {
      Alert.alert(
        "Delete Medication",
        `Remove "${item.brand_name}" and its reminder?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(item.id, item.notif_id),
          },
        ],
      );
    };

    return (
      <View style={[styles.card, isDefault && styles.cardDefault]}>
        {/* Formulary badge */}
        {isDefault && (
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={11} color="#4F8EF7" />
            <Text style={styles.badgeText}>Formulary Drug</Text>
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
            style={styles.cardImage}
            defaultSource={require("../../assets/images/pill-placeholder.png")}
          />

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardBrand} numberOfLines={1}>
              {item.brand_name}
            </Text>
            {item.generic_name ? (
              <Text style={styles.cardGeneric} numberOfLines={1}>
                {item.generic_name}
              </Text>
            ) : null}

            <View style={styles.pillRow}>
              {item.drug_class ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{item.drug_class}</Text>
                </View>
              ) : null}
              {item.form ? (
                <View style={[styles.pill, styles.pillForm]}>
                  <Text style={styles.pillText}>{item.form}</Text>
                </View>
              ) : null}
            </View>

            {item.dose ? (
              <Text style={styles.cardDose} numberOfLines={1}>
                <Ionicons name="medical-outline" size={12} color="#8E9BAE" />{" "}
                {item.dose}
              </Text>
            ) : null}

            {formattedTime ? (
              <View style={styles.timeRow}>
                <Ionicons name="alarm-outline" size={13} color="#4F8EF7" />
                <Text style={styles.timeText}>{formattedTime}</Text>
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
              ? `Reminder: ${formattedTime}  (tap to change)`
              : "Set Reminder"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  },
);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MedicationsListScreen() {
  const { medications, loading, loadMedications, search, removeMedication } =
    useMedications() as any;
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!query) loadMedications();
    }, [query, loadMedications]),
  );

  const handleSearch = (text: string) => {
    setQuery(text);
    search(text);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
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
        {query ? "No results found" : "No medications yet"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {query
          ? "Try a different search term."
          : 'Tap "Add Medication" to get started.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color="#8E9BAE"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search brand or generic name..."
          placeholderTextColor="#4A5568"
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
        <Text style={styles.countText}>
          {medications.length} medication{medications.length !== 1 ? "s" : ""}
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
    backgroundColor: "#0E2044",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1E3A6E",
  },
  badgeText: {
    color: "#4F8EF7",
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
