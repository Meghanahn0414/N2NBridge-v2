import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "../utils/storage";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  age?: number;
  repType?: "MLA" | "MP" | "COUNCILLOR";
  mobile?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  profileComplete: boolean;
  // Set only for a citizen who logged in via the Lookup Service flow (picked
  // a representative category + constituency, which resolved to that
  // representative's own server_url) — services/api.ts reads this and
  // routes every request there instead of the shared API_BASE. Staff/Admin/
  // Field/Manager logins (and citizens on the old central-OTP flow) leave
  // this null, so they keep hitting API_BASE exactly as before.
  serverUrl: string | null;
  setAuth: (token: string, user: User, serverUrl?: string | null) => void;
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
      serverUrl: null,
      setAuth: (token, user, serverUrl = null) => set({ token, user, profileComplete: false, serverUrl }),
      setProfileComplete: (profileComplete) => set({ profileComplete }),
      updateUser: (partial) => set((s) => ({ user: s.user ? { ...s.user, ...partial } : s.user })),
      logout: () => {
        // Remove the persisted key synchronously BEFORE updating in-memory state.
        // This prevents a race where rehydrate() on the login screen reads the
        // old token back from storage before the async persist write completes.
        storage.removeItem("jana-seva-auth");
        set({ token: null, user: null, profileComplete: false, serverUrl: null });
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
