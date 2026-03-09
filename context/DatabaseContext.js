// context/DatabaseContext.js
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  deleteMedication,
  getAllMedications,
  insertMedication,
  searchMedications,
  updateMedication,
  updateMedicationReminder,
} from "../database/db";
import {
  cancelMedicationReminder,
  scheduleMedicationReminder,
} from "../services/notificationService";

const DatabaseContext = createContext(null);

export const DatabaseProvider = ({ children }) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadMedications = useCallback(async () => {
    setLoading(true);
    try {
      const meds = await getAllMedications();
      setMedications(meds);
    } catch (error) {
      console.error("Failed to load medications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  const search = useCallback(
    async (query) => {
      try {
        if (!query.trim()) {
          await loadMedications();
          return;
        }
        const results = await searchMedications(query);
        setMedications(results);
      } catch (error) {
        console.error("Search failed:", error);
      }
    },
    [loadMedications]
  );

  // ── Add reminder (works for ALL medications) ────────────────────────────────
  const addReminder = useCallback(async (id, brandName, timeString) => {
    try {
      // Schedule notification
      let notifId = "";
      try {
        notifId = await scheduleMedicationReminder(brandName, timeString);
      } catch (e) {
        console.warn("Notification scheduling failed:", e);
      }

      await updateMedicationReminder(id, {
        reminderTime: timeString,
        notifId,
      });

      setMedications((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, reminder_time: timeString, notif_id: notifId } : m
        )
      );
      return true;
    } catch (error) {
      console.error("Failed to add reminder:", error);
      return false;
    }
  }, []);

  // ── Remove reminder ─────────────────────────────────────────────────────────
  const removeReminder = useCallback(async (id, notifId) => {
    try {
      await cancelMedicationReminder(notifId);
      await updateMedicationReminder(id, { reminderTime: null, notifId: "" });
      setMedications((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, reminder_time: null, notif_id: "" } : m
        )
      );
    } catch (error) {
      console.error("Failed to remove reminder:", error);
    }
  }, []);

  // ── Add user medication ─────────────────────────────────────────────────────
  const addMedication = useCallback(async (fields) => {
    try {
      await insertMedication(fields);
      await loadMedications();
      return true;
    } catch (error) {
      console.error("Failed to add medication:", error);
      return false;
    }
  }, [loadMedications]);

  // ── Update user medication (blocked for defaults in db layer) ───────────────
  const editMedication = useCallback(async (id, fields) => {
    try {
      const changes = await updateMedication(id, fields);
      if (changes > 0) await loadMedications();
      return changes > 0;
    } catch (error) {
      console.error("Failed to update medication:", error);
      return false;
    }
  }, [loadMedications]);

  // ── Delete user medication (blocked for defaults in db layer) ───────────────
  const removeMedication = useCallback(async (id, notifId) => {
    try {
      await cancelMedicationReminder(notifId);
      const changes = await deleteMedication(id);
      if (changes > 0) {
        setMedications((prev) => prev.filter((m) => m.id !== id));
      }
      return changes > 0;
    } catch (error) {
      console.error("Failed to remove medication:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  return (
    <DatabaseContext.Provider
      value={{
        medications,
        loading,
        loadMedications,
        search,
        addMedication,
        editMedication,
        removeMedication,
        addReminder,
        removeReminder,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useMedications = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error("useMedications must be used inside DatabaseProvider");
  return ctx;
};
