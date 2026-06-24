import { Stack } from "expo-router";

export default function CitizenLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-complaint" />
      <Stack.Screen name="complaint-detail" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="campaigns" />
      <Stack.Screen name="events" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="notification" />
      <Stack.Screen name="sos" />
      <Stack.Screen name="mla-profile" />
    </Stack>
  );
}
