import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored =
      (localStorage.getItem("whistle-theme") as Theme | null) ?? "dark";

    setTheme(stored);

    const root = document.documentElement;
    root.classList.toggle("dark", stored === "dark");
    (root as any).dataset.theme = stored;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    (root as any).dataset.theme = theme;
    localStorage.setItem("whistle-theme", theme);
  }, [theme]);

  const label = theme === "dark" ? "Whistle Dark" : "Whistle Light";

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="theme-toggle"
    >
      {label}
    </button>
  );
}
