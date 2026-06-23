import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

export default function FabScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/citizen/new-complaint" as any);
  }, []);
  return <View style={{ flex: 1, backgroundColor: "#F0F4FF" }} />;
}
