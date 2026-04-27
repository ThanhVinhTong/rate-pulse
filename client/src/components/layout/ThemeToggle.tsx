"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ThemeToggleButton
        aria-label="Toggle theme"
        title="Toggle theme"
        disabled
      >
        <MoonStar className="h-[18px] w-[18px] stroke-[2.35] opacity-0" aria-hidden />
      </ThemeToggleButton>
    );
  }

  const isDark = resolvedTheme === "dark";
  
  return (
    <ThemeToggleButton
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <SunMedium className="h-[18px] w-[18px] stroke-[2.35]" stroke="currentColor" aria-hidden />
      ) : (
        <MoonStar className="h-[18px] w-[18px] stroke-[2.35]" stroke="currentColor" aria-hidden />
      )}
    </ThemeToggleButton>
  );
}
