import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "../utils/storage";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  profileComplete: boolean;
  setAuth: (token: string, user: User) => void;
  setProfileComplete: (v: boolean) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      profileComplete: false,
      setAuth: (token, user) => set({ token, user }),
      setProfileComplete: (profileComplete) => set({ profileComplete }),
      updateUser: (partial) => set((s) => ({ user: s.user ? { ...s.user, ...partial } : s.user })),
      logout: () => set({ token: null, user: null }),
      // profileComplete is intentionally kept across logouts so the
      // profile-setup screen is only shown the very first time.
    }),
    {
      name: "jana-seva-auth",
      storage: createJSONStorage(() => ({
        getItem:    (name)        => storage.getItem(name),
        setItem:    (name, value) => storage.setItem(name, value),
        removeItem: (name)        => storage.removeItem(name),
      })),
    }
  )
);
