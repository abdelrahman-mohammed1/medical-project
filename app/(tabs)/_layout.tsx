import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4F8EF7",
        tabBarStyle: { backgroundColor: "#0F1B2D" },
        headerStyle: { backgroundColor: "#0F1B2D" },
        headerTintColor: "#fff" , 
        headerShown:true
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Medications",
          tabBarIcon: ({ color }) => (
            <Ionicons name="list" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Add Medication",
          href: "/explore",
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "My Reminders",
          tabBarIcon: ({ color }) => (
            <Ionicons name="alarm" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
