import { Tabs } from "expo-router";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

function FABButton() {
  return (
    <TouchableOpacity
      style={fabS.wrap}
      onPress={() => router.push("/citizen/new-complaint" as any)}
      activeOpacity={0.85}
    >
      <View style={fabS.circle}>
        <Text style={fabS.plus}>+</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CitizenTabsLayout() {
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
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: "Activity",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "list" : "list-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fab"
        options={{
          title: "",
          tabBarButton: () => <FABButton />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const fabS = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
  },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -12,
    elevation: 6,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  plus: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 32,
    marginTop: -2,
  },
});
