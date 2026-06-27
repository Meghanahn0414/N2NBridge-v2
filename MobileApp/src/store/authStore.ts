import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "../utils/storage";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  age?: number;
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
      setAuth: (token, user) => set({ token, user, profileComplete: false }),
      setProfileComplete: (profileComplete) => set({ profileComplete }),
      updateUser: (partial) => set((s) => ({ user: s.user ? { ...s.user, ...partial } : s.user })),
      logout: () => {
        // Remove the persisted key synchronously BEFORE updating in-memory state.
        // This prevents a race where rehydrate() on the login screen reads the
        // old token back from storage before the async persist write completes.
        storage.removeItem("jana-seva-auth");
        set({ token: null, user: null, profileComplete: false });
      },
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
