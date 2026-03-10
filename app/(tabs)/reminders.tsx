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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

export default function RemindersScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = useCallback(async () => {
    try {
      const data = await getMedicationsWithReminders();
      setMedications(data);
    } catch (error) {
      console.error("Error loading reminders:", error);
      Alert.alert("Error", "Failed to load reminders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReminders();
    }, [loadReminders]),
  );

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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

    return (
      <View style={styles.medicationCard}>
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
          <Text style={styles.brandName}>{item.brand_name}</Text>
          {item.generic_name ? (
            <Text style={styles.genericName}>{item.generic_name}</Text>
          ) : null}
          {item.drug_class ? (
            <Text style={styles.drugClass}>{item.drug_class}</Text>
          ) : null}
          {item.dose || item.form ? (
            <Text style={styles.dose}>
              {[item.dose, item.form].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}

          <View style={styles.reminderInfo}>
            <Ionicons name="alarm" size={16} color="#4F8EF7" />
            <Text style={styles.reminderTime}>
              {formatTime(item.reminder_time)}
            </Text>
          </View>
        </View>

        {/* 👁️ Eye icon — view details */}
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => handleViewDetail(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="eye-outline" size={20} color="#63B3ED" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#4F8EF7" size="large" />
      </View>
    );
  }

  if (medications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alarm-outline" size={80} color="#2D3E55" />
        <Text style={styles.emptyTitle}>No Reminders</Text>
        <Text style={styles.emptySubtitle}>
          You haven't set any medication reminders yet.
        </Text>
        <Text style={styles.emptyHint}>
          Go to "My Medications" and tap "Set Reminder" on any medication.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reminders</Text>
        <Text style={styles.headerSubtitle}>
          {medications.length} active reminder
          {medications.length !== 1 ? "s" : ""}
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
    backgroundColor: "#0E2044",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#1E3A6E",
    gap: 5,
  },
  reminderTime: { color: "#4F8EF7", fontSize: 13, fontWeight: "700" },

  // 👁️ Eye button
  eyeBtn: {
    padding: 8,
    marginLeft: 6,
    backgroundColor: "#0D1E35",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E3A6E",
  },
});
