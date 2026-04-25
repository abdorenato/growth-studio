"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Progress, User } from "@/types";

interface UserState {
  user: User | null;
  progress: Partial<Progress>;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setProgress: (progress: Partial<Progress>) => void;
  updateProgress: (key: keyof Progress, value: boolean) => void;
  setHasHydrated: (v: boolean) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      progress: {},
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setProgress: (progress) => set({ progress }),
      updateProgress: (key, value) =>
        set((state) => ({
          progress: { ...state.progress, [key]: value },
        })),
      setHasHydrated: (v) => set({ hasHydrated: v }),
      clear: () => set({ user: null, progress: {} }),
    }),
    {
      name: "growth-studio-user",
      storage: createJSONStorage(() => sessionStorage),
      // Não persiste o flag de hidratação
      partialize: (state) => ({
        user: state.user,
        progress: state.progress,
      }),
      onRehydrateStorage: () => (state) => {
        // Marca como hidratado quando a hidratação termina
        state?.setHasHydrated(true);
      },
    }
  )
);
