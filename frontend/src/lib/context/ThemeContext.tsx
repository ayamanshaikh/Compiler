"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useCallback,
} from "react";
import { AccentColor, AnimationMode } from "../api/auth";

export type Theme = "dark" | "light" | "system";
export type { AccentColor, AnimationMode };

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  accent: AccentColor;
  animationMode: AnimationMode;
  resolvedAnimationMode: AnimationMode;
  prefersReducedMotion: boolean;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: AccentColor) => void;
  setAnimationMode: (mode: AnimationMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

let listeners: Array<() => void> = [];
function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", () => {
    emitChange();
  });
}

export const themeStore = {
  getTheme(): Theme {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("codevista-theme") as Theme | null;
    return stored === "dark" || stored === "light" || stored === "system"
      ? stored
      : "dark";
  },
  setTheme(theme: Theme) {
    localStorage.setItem("codevista-theme", theme);
    emitChange();
  },
  getAccent(): AccentColor {
    if (typeof window === "undefined") return "emerald";
    const stored = localStorage.getItem("codevista-accent") as AccentColor | null;
    return stored === "emerald" ||
      stored === "indigo" ||
      stored === "cyan" ||
      stored === "amber" ||
      stored === "rose"
      ? stored
      : "emerald";
  },
  setAccent(accent: AccentColor) {
    localStorage.setItem("codevista-accent", accent);
    emitChange();
  },
  getAnimationMode(): AnimationMode {
    if (typeof window === "undefined") return "balanced";
    const stored = localStorage.getItem("codevista-animation-mode") as AnimationMode | null;
    return stored === "professional" ||
      stored === "balanced" ||
      stored === "enhanced"
      ? stored
      : "balanced";
  },
  setAnimationMode(mode: AnimationMode) {
    localStorage.setItem("codevista-animation-mode", mode);
    emitChange();
  },
  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getTheme,
    () => "dark" as Theme
  );

  const accent = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getAccent,
    () => "emerald" as AccentColor
  );

  const animationMode = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getAnimationMode,
    () => "balanced" as AnimationMode
  );

  const isSystemDark = useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : true,
    () => true
  );

  const prefersReducedMotion = useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
    () => false
  );

  const resolvedTheme: "dark" | "light" =
    theme === "system" ? (isSystemDark ? "dark" : "light") : theme;

  const resolvedAnimationMode: AnimationMode = prefersReducedMotion
    ? "professional"
    : animationMode;

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute("data-animation-mode", resolvedAnimationMode);
  }, [resolvedAnimationMode]);

  const setTheme = useCallback((newTheme: Theme) => {
    themeStore.setTheme(newTheme);
  }, []);

  const setAccent = useCallback((newAccent: AccentColor) => {
    themeStore.setAccent(newAccent);
  }, []);

  const setAnimationMode = useCallback((newMode: AnimationMode) => {
    themeStore.setAnimationMode(newMode);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        accent,
        animationMode,
        resolvedAnimationMode,
        prefersReducedMotion,
        setTheme,
        setAccent,
        setAnimationMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
