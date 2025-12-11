// lib/store.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import uuid from "react-native-uuid";
import { extractDomain, fetchUrlMeta, normalizeUrl } from "./utils";

export type LinkRow = {
  id: string;
  url: string;
  domain: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
  createdAt: number;
  lastMetaAt?: number | null;
  lockedTitle?: boolean; // manual title lock
};

type AddMetaOpts = { lockTitle?: boolean };

export type AppSettings = {
  theme: "light" | "dark" | "system";
  themeColor: "auto" | string;
  shareAction: "open" | "notification";
};

type LinkStore = {
  links: LinkRow[];
  settings: AppSettings;
  addLink: (url: string, hintTitle?: string | null, opts?: AddMetaOpts) => string;
  addLinkWithMeta: (url: string, hintTitle?: string | null, opts?: AddMetaOpts) => Promise<string>;
  updateLink: (id: string, patch: Partial<LinkRow>) => void;
  removeLink: (id: string) => void;
  clearAll: () => void;
  renameDomain: (oldDomain: string, newDomain: string) => void;
  refetchMeta: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

export const useLinkStore = create<LinkStore>()(
  persist(
    (set, get) => ({
      links: [],
      settings: {
        theme: "system",
        themeColor: "auto",
        shareAction: "open",
      },

      addLink: (url, hintTitle, opts) => {
        const id = String(uuid.v4());
        const normalized = normalizeUrl(url);
        const row: LinkRow = {
          id,
          url: normalized,
          domain: extractDomain(normalized),
          title: hintTitle ?? null,
          description: null,
          image: null,
          siteName: null,
          createdAt: Date.now(),
          lastMetaAt: null,
          lockedTitle: !!opts?.lockTitle && !!hintTitle,
        };
        set({ links: [row, ...get().links] });
        return id;
      },

      addLinkWithMeta: async (url, hintTitle, opts) => {
        const id = get().addLink(url, hintTitle, opts);
        try {
          const meta = await fetchUrlMeta(url);
          const row = get().links.find((l) => l.id === id);
          if (!row) return id;

          const title = row.lockedTitle ? row.title ?? null : meta.title ?? row.title ?? null;

          get().updateLink(id, {
            title,
            description: meta.description ?? row.description ?? null,
            image: meta.image ?? row.image ?? null,
            siteName: meta.siteName ?? row.siteName ?? null,
            lastMetaAt: Date.now(),
          });
        } catch {}
        return id;
      },

      updateLink: (id, patch) =>
        set({ links: get().links.map((l) => (l.id === id ? { ...l, ...patch } : l)) }),

      removeLink: (id) => set({ links: get().links.filter((l) => l.id !== id) }),

      clearAll: () => set({ links: [] }),

      renameDomain: (oldDomain, newDomain) =>
        set({
          links: get().links.map((l) => (l.domain === oldDomain ? { ...l, domain: newDomain } : l)),
        }),

      refetchMeta: async (id) => {
        const row = get().links.find((l) => l.id === id);
        if (!row) return;
        try {
          const meta = await fetchUrlMeta(row.url);
          const title = row.lockedTitle ? row.title ?? null : meta.title ?? row.title ?? null;

          get().updateLink(id, {
            title,
            description: meta.description ?? row.description ?? null,
            image: meta.image ?? row.image ?? null,
            siteName: meta.siteName ?? row.siteName ?? null,
            lastMetaAt: Date.now(),
          });
        } catch {}
      },

      updateSettings: (patch) =>
        set({ settings: { ...get().settings, ...patch } }),
    }),
    {
      name: "link-categorizer-store",
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: async (state: any, version) => {
        if (version < 3 && state?.state?.links) {
          state.state.links = state.state.links.map((l: any) => ({
            lockedTitle: !!l.lockedTitle,
            ...l,
          }));
        }
        if (version < 4) {
          state.state.settings = {
            theme: "system",
            themeColor: "auto",
            shareAction: "open",
          };
        }
        if (version < 5) {
          state.state.settings = {
            ...state.state.settings,
            themeColor: "auto",
          };
        }
        return state;
      },
    }
  )
);
