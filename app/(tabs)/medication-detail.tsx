import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

// Class → color mapping
const CLASS_COLORS: Record<string, string> = {
  "Calcium channel blocker": "#F6AD55",
  "ACE inhibitor": "#68D391",
  ARB: "#63B3ED",
  "Beta blocker": "#FC8181",
  Diuretic: "#B794F4",
  "Loop diuretic": "#9F7AEA",
  "K-sparing diuretic": "#D6BCFA",
  Biguanide: "#F6E05E",
  Sulfonylurea: "#FBD38D",
  "DPP-4 inhibitor": "#9AE6B4",
  "SGLT2 inhibitor": "#76E4F7",
  "Long-acting insulin": "#FEB2B2",
  "Rapid insulin": "#FED7D7",
  TZD: "#E9D8FD",
  "GLP-1 agonist": "#C6F6D5",
  Antiplatelet: "#FFF3CD",
  Statin: "#CCE5FF",
  Nitrate: "#D4EDDA",
  "Cardiac glycoside": "#F8D7DA",
  "Cholinesterase inhibitor": "#D1ECF1",
  "NMDA antagonist": "#E2D9F3",
  Combination: "#D6E4FF",
  "Monoclonal antibody": "#FFECD2",
  "MAO inhibitor": "#FEE2E2",
  Antioxidant: "#DCFCE7",
  default: "#4F8EF7",
};

const getClassColor = (cls: string) =>
  CLASS_COLORS[cls] || CLASS_COLORS["default"];

const STRINGS = {
  en: {
    back: "Back",
    formularyDrug: "Formulary Drug",
    drugInformation: "Drug Information",
    dose: "Dose",
    form: "Form",
    drugClass: "Drug Class",
    notes: "Notes",
    reminderSection: "Reminder",
    dailyReminder: "Daily Reminder",
    noDetails: "No additional details available.",
  },
  ar: {
    back: "رجوع",
    formularyDrug: "دواء من القائمة الأساسية",
    drugInformation: "معلومات الدواء",
    dose: "الجرعة",
    form: "الهيئة الدوائية",
    drugClass: "الفئة الدوائية",
    notes: "ملاحظات",
    reminderSection: "التذكير",
    dailyReminder: "تذكير يومي",
    noDetails: "لا توجد تفاصيل إضافية.",
  },
} as const;

// ── Info Row Component ────────────────────────────────────────────────────────

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent?: string;
  delay?: number;
};

const InfoRow = ({
  icon,
  label,
  value,
  accent = "#4F8EF7",
  delay = 0,
}: InfoRowProps) => {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.infoRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.infoIconWrap, { backgroundColor: accent + "22" }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[
          styles.infoLabel,
          { color: isDark ? "#8E9BAE" : "#6B7280" }
        ]}>{label}</Text>
        <Text style={[
          styles.infoValue,
          { color: isDark ? "#E2E8F0" : "#111827" }
        ]}>{value}</Text>
      </View>
    </Animated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MedicationDetailScreen() {
  const params = useLocalSearchParams();
  const { language } = useLanguage();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const t = STRINGS[language];

  // Params passed via router.push
  const brandName = (params.brandName as string) || "Medication";
  const genericName = (params.genericName as string) || "";
  const drugClass = (params.drugClass as string) || "";
  const dose = (params.dose as string) || "";
  const form = (params.form as string) || "";
  const note = (params.note as string) || "";
  const imageUri = (params.imageUri as string) || "";
  const reminderTime = (params.reminderTime as string) || "";
  const isDefault = params.isDefault === "1";

  // Get localized medication data
  const { getLocalizedMedication, getFormularyTranslation } = require("../../constants/formularyTranslations");
  const medicationData = {
    brand: brandName,
    generic: genericName,
    cls: drugClass,
    dose: dose,
    form: form,
    image: imageUri,
  };
  
  const localizedMed = getLocalizedMedication(medicationData, language);
  const formularyTr = isDefault ? getFormularyTranslation(brandName) : null;
  const formattedTime = formatTime(reminderTime, language);
  const classColor = getClassColor(localizedMed.cls);

  // ── Animations ─────────────────────────────────────────────────────────────
  const heroScale = useRef(new Animated.Value(0.8)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(heroScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  const hasImage = imageUri && imageUri.trim() !== "" && imageUri !== "null";

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? "#0A1628" : "#F9FAFB" },
      ]}
    >
      <StatusBar 
        barStyle={isDark ? "light-content" : "light-content"} 
        backgroundColor={isDark ? "#0A1628" : "#000000"}
      />

      {/* ── Hero gradient background ── */}
      <LinearGradient
        colors={
          isDark
            ? ["#0A1628", "#0D2045", "#0A1628"]
            : ["#EFF6FF", "#DBEAFE", "#EFF6FF"]
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* ── Decorative blobs ── */}
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />

      {/* ── Back button ── */}
      <TouchableOpacity
        style={[
          styles.backBtn,
          {
            backgroundColor: isDark ? "#1A2740CC" : "#E5E7EBCC",
            borderColor: isDark ? "#2D3E55" : "#D1D5DB",
          },
        ]}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="chevron-back"
          size={22}
          color={isDark ? "#FFFFFF" : "#111827"}
        />
        <Text
          style={[
            styles.backText,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          {t.back}
        </Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "ios" ? 40 : 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero image ── */}
        <Animated.View
          style={[
            styles.heroWrap,
            { opacity: heroOpacity, transform: [{ scale: heroScale }] },
          ]}
        >
          {/* Glow ring */}
          <View style={[styles.glowRing, { borderColor: classColor + "55" }]} />
          <View
            style={[styles.glowRing2, { borderColor: classColor + "22" }]}
          />

          <Image
            source={
              hasImage
                ? { uri: imageUri }
                : require("../../assets/images/pill-placeholder.png")
            }
            style={styles.heroImage}
            defaultSource={require("../../assets/images/pill-placeholder.png")}
          />

          {/* Formulary badge */}
          {isDefault && (
            <View
              style={[
                styles.formularyBadge,
                {
                  backgroundColor: isDark ? "#0E2044" : "#E0F2FE",
                  borderColor: isDark ? "#1E3A6E" : "#93C5FD",
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={12} color="#4F8EF7" />
              <Text
                style={[
                  styles.formularyText,
                  { color: isDark ? "#4F8EF7" : "#1D4ED8" },
                ]}
              >
                {t.formularyDrug}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Title block ── */}
        <Animated.View
          style={[
            styles.titleBlock,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleSlide }],
            },
          ]}
        >
          <Text
            style={[
              styles.brandName,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            {language === "ar" && formularyTr?.brandAr
              ? formularyTr.brandAr
              : brandName}
          </Text>
          {genericName ? (
            <Text
              style={[
                styles.genericName,
                { color: isDark ? "#8E9BAE" : "#4B5563" },
              ]}
            >
              {language === "ar" && formularyTr?.genericAr
                ? formularyTr.genericAr
                : genericName}
            </Text>
          ) : null}

          {/* Class chip */}
          {drugClass ? (
            <View
              style={[
                styles.classChip,
                {
                  backgroundColor: classColor + "22",
                  borderColor: classColor + "55",
                },
              ]}
            >
              <View
                style={[styles.classDot, { backgroundColor: classColor }]}
              />
              <Text style={[styles.classText, { color: classColor }]}>
                {language === "ar" && formularyTr?.clsAr
                  ? formularyTr.clsAr
                  : drugClass}
              </Text>
            </View>
          ) : null}
        </Animated.View>

        {/* ── Details card ── */}
        <Animated.View
          style={[
            styles.detailCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardSlide }],
              backgroundColor: isDark ? "#1A2740" : "#FFFFFF",
              borderColor: isDark ? "#2D3E55" : "#E5E7EB",
            },
          ]}
        >
          <Text
            style={[
              styles.cardSectionTitle,
              { color: isDark ? "#8E9BAE" : "#4B5563" },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={isDark ? "#8E9BAE" : "#6B7280"}
            />
            {"  "}
            {t.drugInformation}
          </Text>

          {dose ? (
            <InfoRow
              icon="medical-outline"
              label={t.dose}
              value={
                language === "ar" && formularyTr?.doseAr
                  ? formularyTr.doseAr
                  : dose
              }
              accent="#F6AD55"
              delay={0}
            />
          ) : null}

          {form ? (
            <InfoRow
              icon="flask-outline"
              label={t.form}
              value={form}
              accent="#68D391"
              delay={60}
            />
          ) : null}

          {drugClass ? (
            <InfoRow
              icon="layers-outline"
              label={t.drugClass}
              value={drugClass}
              accent={classColor}
              delay={120}
            />
          ) : null}

          {note ? (
            <InfoRow
              icon="document-text-outline"
              label={t.notes}
              value={note}
              accent="#B794F4"
              delay={180}
            />
          ) : null}

          {/* Divider */}
          {formattedTime ? (
            <>
              <View style={[
                styles.divider,
                { backgroundColor: isDark ? "#2D3E55" : "#E5E7EB" }
              ]} />
              <Text
                style={[
                  styles.cardSectionTitle,
                  { color: isDark ? "#8E9BAE" : "#4B5563" },
                ]}
              >
                <Ionicons
                  name="alarm-outline"
                  size={14}
                  color={isDark ? "#8E9BAE" : "#6B7280"}
                />
                {"  "}
                {t.reminderSection}
              </Text>
              <InfoRow
                icon="alarm"
                label={t.dailyReminder}
                value={formattedTime}
                accent="#4F8EF7"
                delay={240}
              />
            </>
          ) : null}

          {/* No details fallback */}
          {!dose && !form && !drugClass && !note && !formattedTime ? (
            <View style={styles.noDetails}>
              <Ionicons
                name="information-circle-outline"
                size={32}
                color={isDark ? "#2D3E55" : "#9CA3AF"}
              />
              <Text
                style={[
                  styles.noDetailsText,
                  { color: isDark ? "#4A5568" : "#9CA3AF" },
                ]}
              >
                {t.noDetails}
              </Text>
            </View>
          ) : null}
        </Animated.View>

        {/* bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A1628" },

  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 100 : 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ── Decorative blobs ──
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.12,
  },
  blobTopRight: {
    width: 260,
    height: 260,
    backgroundColor: "#4F8EF7",
    top: -80,
    right: -80,
  },
  blobBottomLeft: {
    width: 200,
    height: 200,
    backgroundColor: "#6C63FF",
    bottom: 100,
    left: -80,
  },

  // ── Back button ──
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    left: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2740CC",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2D3E55",
  },
  backText: { color: "#fff", fontSize: 14, fontWeight: "600", marginLeft: 2 },

  // ── Hero ──
  heroWrap: { alignItems: "center", marginBottom: 24, position: "relative" },
  glowRing: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
  },
  glowRing2: {
    position: "absolute",
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 1,
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#4F8EF7",
    backgroundColor: "#0A1628",
  },
  formularyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 14,
    backgroundColor: "#0E2044",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E3A6E",
  },
  formularyText: { color: "#4F8EF7", fontSize: 12, fontWeight: "700" },

  // ── Title ──
  titleBlock: { alignItems: "center", marginBottom: 24 },
  brandName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  genericName: {
    color: "#8E9BAE",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 12,
  },
  classChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  classDot: { width: 8, height: 8, borderRadius: 4 },
  classText: { fontSize: 13, fontWeight: "700" },

  // ── Details card ──
  detailCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },

  // ── Info row ──
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },

  // ── No details ──
  noDetails: { alignItems: "center", paddingVertical: 24 },
  noDetailsText: { fontSize: 14, marginTop: 10 },
});
