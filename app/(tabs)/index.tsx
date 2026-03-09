// src/screens/MedicationsListScreen.js
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

// Convert "HH:MM" to "h:mm AM/PM"
const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

// Single card component (memoised for performance)
const MedicationCard = React.memo(({ item, onDelete, onEdit }) => {
  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      `Remove "${item.name}" and its reminder?`,
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

  const handleEdit = () => {
    onEdit(item);
  };

  return (
    <View style={styles.card}>
      {/* Image */}
      <Image
        source={
          item.image_uri
            ? { uri: item.image_uri }
            : require("../../assets/images/pill-placeholder.png")
        }
        style={styles.cardImage}
        defaultSource={require("../../assets/images/pill-placeholder.png")}
      />

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.cardTimeRow}>
          <Ionicons name="alarm-outline" size={14} color="#4F8EF7" />
          <Text style={styles.cardTime}>{formatTime(item.notify_time)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={handleEdit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil-outline" size={18} color="#4F8EF7" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color="#E53E3E" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function MedicationsListScreen() {
  const { medications, loading, loadMedications, search, removeMedication } =
    useMedications();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Reload when tab gains focus
  useFocusEffect(
    useCallback(() => {
      if (!query) loadMedications();
    }, [query, loadMedications]),
  );

  const handleSearch = (text) => {
    setQuery(text);
    search(text);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const handleDelete = async (id, notifId) => {
    await removeMedication(id, notifId);
  };

  const handleEdit = (medication) => {
    // Navigate to explore screen with medication data for editing
    router.push({
      pathname: "/(tabs)/explore",
      params: {
        editMode: "true",
        medicationId: medication.id.toString(),
        name: medication.name,
        description: medication.description || "",
        imageUri: medication.image_uri && medication.image_uri.trim() !== "" ? medication.image_uri : "null",
        notifyTime: medication.notify_time,
        notifId: medication.notif_id || "",
      },
    });
  };

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medkit-outline" size={64} color="#2D3E55" />
      <Text style={styles.emptyTitle}>
        {query ? "No results found" : "No medications yet"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {query
          ? `Try a different search term.`
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
          placeholder="Search medications..."
          placeholderTextColor="#4A5568"
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={18} color="#8E9BAE" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count badge */}
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

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2740",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2D3E55",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#0A1628",
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardName: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  cardDesc: { color: "#8E9BAE", fontSize: 13, marginBottom: 6, lineHeight: 18 },
  cardTimeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardTime: {
    color: "#4F8EF7",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },

  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: { padding: 6 },
  deleteBtn: { padding: 6 },

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
