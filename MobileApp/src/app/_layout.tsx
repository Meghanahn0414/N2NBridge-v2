import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="citizen" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="mla" />
        <Stack.Screen name="field" />
        <Stack.Screen name="manager" />
        <Stack.Screen name="webview" options={{ animation: "fade" }} />
      </Stack>
    </>
  );
}
