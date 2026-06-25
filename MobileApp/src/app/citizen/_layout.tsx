import { useEffect, useState } from "react";
import { Stack, Redirect, useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { storage } from "../../utils/storage";

export default function CitizenLayout() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!token) return;
    storage.getItem("onboarding_done").then((val) => {
      if (!val) {
        router.replace("/onboarding" as any);
      } else {
        setOnboardingChecked(true);
      }
    });
  }, [token]);

  // Not logged in — redirect to login screen
  if (!token) {
    return <Redirect href="/" />;
  }

  // Wait until we've checked onboarding status before rendering tabs
  if (!onboardingChecked) return null;

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
      <Stack.Screen name="complaint-list" />
    </Stack>
  );
}
