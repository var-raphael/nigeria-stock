"use client";

import { HiSun, HiMoon } from "react-icons/hi";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  size?: number;
}

export default function ThemeToggle({ className = "", size = 20 }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={className}
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "12px",
        border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.2)"}`,
        background: isDark ? "rgba(10,20,45,0.8)" : "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      }}
    >
      {isDark ? (
        <HiSun size={size} color="#f59e0b" />
      ) : (
        <HiMoon size={size} color="#2563eb" />
      )}
    </button>
  );
}
