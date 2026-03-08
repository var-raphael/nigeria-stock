"use client";

import {
  HiOutlineViewGrid,
  HiOutlineChartBar,
  HiOutlineBriefcase,
  HiOutlineCog,
} from "react-icons/hi";
import { useTheme } from "@/context/ThemeContext";

const NAV = [
  { icon: HiOutlineViewGrid,  label: "Dashboard", href: "/dashboard" },
  { icon: HiOutlineChartBar,  label: "Stocks",    href: "/stocks"    },
  { icon: HiOutlineBriefcase, label: "Portfolio", href: "/portfolio" },
  { icon: HiOutlineCog,       label: "Settings",  href: "/settings"  },
];

interface BottomNavProps {
  active: string;
}

export default function BottomNav({ active }: BottomNavProps) {
  const { isDark } = useTheme();

  const surface = isDark ? "#0d1b35" : "#ffffff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const blue    = "#2563eb";

  return (
    <>
      <style>{`
        .bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          background: ${surface}; border-top: 1px solid ${border};
          padding: 10px 0 max(10px, env(safe-area-inset-bottom));
        }
        .bottom-nav-inner { display: flex; justify-content: space-around; }
        .bot-link {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          color: ${muted}; text-decoration: none; cursor: pointer;
          font-size: .6rem; font-weight: 600; padding: 4px 12px;
          border-radius: 10px; transition: color .18s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .bot-link.active { color: ${blue}; }
        .bot-link svg { width: 22px; height: 22px; }

        @media (max-width: 768px) {
          .bottom-nav { display: block; }
        }
      `}</style>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className={`bot-link ${active === n.label ? "active" : ""}`}>
              <n.icon/>
              <span>{n.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
