import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "../utils/storage";
import type { RepType } from "../services/lookupApi";

/**
 * A citizen can now be linked to several representatives at once — their
 * own Councillor, MLA, and MP — each living on a completely separate
 * server with its own database, each with its own login/token. This store
 * holds one entry per rep_type the citizen has linked so far.
 */
export interface RepresentativeLink {
  repType:     RepType;
  repCode:     string;
  serverUrl:   string;      // this representative's own server — everything about them goes here
  token:       string;      // this citizen's session token on THAT server
  citizenId:   string;
  name:        string;      // citizen's own name as known to that server
  repName:     string;      // the representative's display name
  constituency: string;     // assembly_name / parliamentary_name / ward_name, whichever applies
  profileComplete: boolean;
  linkedAt:    string;
}

interface RepresentativesState {
  links: Record<string, RepresentativeLink>;   // keyed by repType
  activeRepType: RepType | null;                // which linked rep the citizen is currently viewing
  addLink: (link: RepresentativeLink) => void;
  removeLink: (repType: RepType) => void;
  setProfileComplete: (repType: RepType, v: boolean) => void;
  setActive: (repType: RepType | null) => void;
  getLink: (repType: RepType) => RepresentativeLink | undefined;
}

export const useRepresentativesStore = create<RepresentativesState>()(
  persist(
    (set, get) => ({
      links: {},
      activeRepType: null,
      addLink: (link) =>
        set((s) => ({
          links: { ...s.links, [link.repType]: link },
          activeRepType: link.repType,
        })),
      removeLink: (repType) =>
        set((s) => {
          const links = { ...s.links };
          delete links[repType];
          const activeRepType = s.activeRepType === repType ? null : s.activeRepType;
          return { links, activeRepType };
        }),
      setProfileComplete: (repType, v) =>
        set((s) => {
          const existing = s.links[repType];
          if (!existing) return {};
          return { links: { ...s.links, [repType]: { ...existing, profileComplete: v } } };
        }),
      setActive: (repType) => set({ activeRepType: repType }),
      getLink: (repType) => get().links[repType],
    }),
    {
      name: "jana-seva-representatives",
      storage: createJSONStorage(() => ({
        getItem:    (name)        => storage.getItem(name),
        setItem:    (name, value) => storage.setItem(name, value),
        removeItem: (name)        => storage.removeItem(name),
      })),
    }
  )
);
