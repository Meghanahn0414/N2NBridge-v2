import { Platform } from "react-native";

const webStore = {
  getItem: async (key: string): Promise<string | null> =>
    typeof window !== "undefined" ? localStorage.getItem(key) : null,
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  },
};

async function getNativeStore() {
  const mod = await import("@react-native-async-storage/async-storage");
  return mod.default;
}

export const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") return webStore.getItem(key);
    const s = await getNativeStore();
    return s.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") return webStore.setItem(key, value);
    const s = await getNativeStore();
    return s.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") return webStore.removeItem(key);
    const s = await getNativeStore();
    return s.removeItem(key);
  },
};
