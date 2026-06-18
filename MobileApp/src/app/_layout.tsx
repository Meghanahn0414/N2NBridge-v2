import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
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
