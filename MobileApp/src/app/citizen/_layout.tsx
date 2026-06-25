import { useEffect, useState } from "react";
import { Stack, Redirect, useRouter, usePathname } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { storage } from "../../utils/storage";

export default function CitizenLayout() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const pathname = usePathname();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!token) return;
    storage.getItem("onboarding_done").then((val) => {
      if (!val) {
        router.replace("/citizen/onboarding" as any);
      } else {
        setOnboardingChecked(true);
      }
    });
  }, [token]);

  // Not logged in — allow the onboarding screen through (it's the guest entry point).
  // For all other citizen routes, redirect to onboarding.
  // Using pathname check to break the infinite redirect loop.
  if (!token) {
    if (pathname === "/citizen/onboarding") {
      // Let the screen render — no redirect, no loop
      return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
        </Stack>
      );
    }
    return <Redirect href="/citizen/onboarding" />;
  }

  // Wait until we've checked onboarding status before rendering tabs
  if (!onboardingChecked) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
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
