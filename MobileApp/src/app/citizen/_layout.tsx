import { Tabs } from "expo-router";
import { Text } from "react-native";
export default function CitizenLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1D4ED8",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      {/* 1 — Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>🏠</Text>
          ),
        }}
      />
      {/* 2 — Complaints */}
      <Tabs.Screen
        name="complaints"
        options={{
          title: "Complaints",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>📋</Text>
          ),
        }}
      />
      {/* 3 — Services hub */}
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>🛎️</Text>
          ),
        }}
      />
      {/* 4 — Profile */}
      <Tabs.Screen
        name="emergency"
        options={{
          title: "Emergency",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🚨</Text>
          ),
          tabBarActiveTintColor: "#DC2626",
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>👤</Text>
          ),
        }}
      />
      {/* Hidden — navigable but not in tab bar */}
      <Tabs.Screen name="new-complaint"     options={{ href: null }} />
      <Tabs.Screen name="campaigns"         options={{ href: null }} />
      <Tabs.Screen name="events"            options={{ href: null }} />
      <Tabs.Screen name="feedback"          options={{ href: null }} />
      <Tabs.Screen name="complaint-detail"  options={{ href: null }} />
      <Tabs.Screen name="sos"               options={{ href: null }} />
      <Tabs.Screen name="notifications"     options={{ href: null }} />
    </Tabs>
  );
}
