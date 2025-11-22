// src/components/DarkModeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark";
type Ctx = {
  mode: Mode;
  toggle: () => void;
};

const DarkModeContext = createContext<Ctx>({ mode: "light", toggle: () => {} });

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("theme") as Mode | null) : null;
    if (stored === "dark" || stored === "light") setMode(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", mode === "dark");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", mode);
    }
  }, [mode]);

  return (
    <DarkModeContext.Provider value={{ mode, toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")) }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
