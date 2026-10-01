import { create } from "zustand";

interface ThemeState {
  themeVariant: "pharmacy-green" | "reference-blue";
  isDarkMode: boolean;
  setThemeVariant: (variant: "pharmacy-green" | "reference-blue") => void;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeVariant: "pharmacy-green",
  isDarkMode: false,
  setThemeVariant: (themeVariant) => {
    document.documentElement.setAttribute("data-theme", themeVariant);
    set({ themeVariant });
  },
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return { isDarkMode: next };
    }),
}));
