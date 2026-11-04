"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const themeContext = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !themeContext) {
    return <div className="w-8 h-8 rounded border border-border" />;
  }

  const { theme, setTheme } = themeContext;
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-1.5 rounded border border-border hover:bg-elevated transition-colors text-text-secondary hover:text-text-primary"
      aria-label="Toggle visual theme"
    >
      {isDark ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-accent" />}
    </button>
  );
}
