// src/context/DatabaseContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getAllMedications,
  searchMedications,
  deleteMedication,
} from "../database/db";
import { cancelMedicationReminder } from "../services/notificationService";

const DatabaseContext = createContext(null);

export const DatabaseProvider = ({ children }) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all medications from SQLite
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

  // Search medications by name
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
    [loadMedications],
  );

  // Remove a medication + cancel its notification
  const removeMedication = useCallback(async (id, notifId) => {
    try {
      await cancelMedicationReminder(notifId);
      await deleteMedication(id);
      setMedications((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Failed to remove medication:", error);
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
        removeMedication,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useMedications = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx)
    throw new Error("useMedications must be used inside DatabaseProvider");
  return ctx;
};
