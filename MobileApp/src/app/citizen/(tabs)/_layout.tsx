import { Tabs } from "expo-router";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { useT } from "../../../i18n/useT";

const PRIMARY = "#2B5BD7";
const INACTIVE = "#9AA3B5";

function FABButton() {
  return (
    <TouchableOpacity
      style={fab.wrap}
      onPress={() => router.push("/citizen/new-complaint" as any)}
      activeOpacity={0.85}
    >
      <View style={fab.btn}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export default function CitizenTabsLayout() {
  const tr = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#EDF0F6",
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tr("Home"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: tr("Activity"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "list" : "list-outline"} size={23} color={color} />
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
          title: tr("Explore"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tr("Profile"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const fab = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 6,
  },
  btn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -14,
    elevation: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
