"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Progress, User } from "@/types";

interface UserState {
  user: User | null;
  progress: Partial<Progress>;
  setUser: (user: User | null) => void;
  setProgress: (progress: Partial<Progress>) => void;
  updateProgress: (key: keyof Progress, value: boolean) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      progress: {},
      setUser: (user) => set({ user }),
      setProgress: (progress) => set({ progress }),
      updateProgress: (key, value) =>
        set((state) => ({
          progress: { ...state.progress, [key]: value },
        })),
      clear: () => set({ user: null, progress: {} }),
    }),
    {
      name: "growth-studio-user",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
