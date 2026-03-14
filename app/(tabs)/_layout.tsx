import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useThemeMode } from "../../context/ThemeContext";

const STRINGS = {
  en: {
    meds: "My Medications",
    add: "Add Medication",
    reminders: "My Reminders",
    details: "Medication Details",
    themeLight: "Light",
    themeDark: "Dark",
    langShort: "EN",
  },
  ar: {
    meds: "أدويتي",
    add: "إضافة دواء",
    reminders: "تذكيراتي",
    details: "تفاصيل الدواء",
    themeLight: "نهاري",
    themeDark: "ليلي",
    langShort: "ع",
  },
} as const;

const HeaderControls = () => {
  const { mode, toggleTheme } = useThemeMode();
  const { language, toggleLanguage } = useLanguage();

  const isDark = mode === "dark";
  const labelColor = isDark ? "#E5E7EB" : "#111827";
  const chipBg = isDark ? "#111827" : "#E5E7EB";
  const borderColor = isDark ? "#374151" : "#D1D5DB";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginRight: 8,
      }}
    >
      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: chipBg,
          borderWidth: 1,
          borderColor,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={16}
          color={labelColor}
        />
        <Text
          style={{
            marginLeft: 6,
            fontSize: 12,
            fontWeight: "600",
            color: labelColor,
          }}
        >
          {isDark ? STRINGS[language].themeDark : STRINGS[language].themeLight}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleLanguage}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: chipBg,
          borderWidth: 1,
          borderColor,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="language" size={16} color={labelColor} />
        <Text
          style={{
            marginLeft: 6,
            fontSize: 12,
            fontWeight: "700",
            color: labelColor,
          }}
        >
          {STRINGS[language].langShort}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function TabLayout() {
  const { mode } = useThemeMode();
  const { language } = useLanguage();

  const strings = STRINGS[language];
  const isDark = mode === "dark";

  const headerBackground = isDark ? "#0F1B2D" : "#F9FAFB";
  const headerTint = isDark ? "#FFFFFF" : "#111827";
  const tabBarBackground = isDark ? "#0F1B2D" : "#FFFFFF";
  const activeTint = isDark ? "#4F8EF7" : "#2563EB";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTint,
        tabBarStyle: { backgroundColor: tabBarBackground },
        headerStyle: { backgroundColor: headerBackground },
        headerTintColor: headerTint,
        headerTitleStyle: { color: headerTint, fontWeight: "700" },
        headerRight: () => <HeaderControls />,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.meds,
          tabBarIcon: ({ color }) => (
            <Ionicons name="list" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: strings.add,
          href: "/explore",
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: strings.reminders,
          tabBarIcon: ({ color }) => (
            <Ionicons name="alarm" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medication-detail"
        options={{
          title: strings.details,
          tabBarIcon: ({ color }) => (
            <Ionicons name="medical" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
