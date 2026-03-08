"use client";

import {
  HiOutlineViewGrid,
  HiOutlineChartBar,
  HiOutlineBriefcase,
  HiOutlineBookmark,
  HiOutlineCog,
} from "react-icons/hi";
import { useTheme } from "@/context/ThemeContext";

const NAV = [
  { icon: HiOutlineViewGrid,  label: "Dashboard", href: "/dashboard" },
  { icon: HiOutlineChartBar,  label: "Stocks",    href: "/stocks"    },
  { icon: HiOutlineBriefcase, label: "Portfolio", href: "/portfolio" },
  { icon: HiOutlineBookmark,  label: "Watchlist", href: "/watchlist" },
  { icon: HiOutlineCog,       label: "Settings",  href: "/settings"  },
];

export default function BottomNav({ active }: { active: string }) {
  const { isDark } = useTheme();

  const surface = isDark ? "#0d1b35" : "#ffffff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const muted   = isDark ? "#7a95c0" : "#94a3b8";
  const blue    = "#2563eb";

  return (
    <>
      <style>{`
        .bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          background: ${surface};
          border-top: 1px solid ${border};
          padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
        }
        .bottom-nav-inner {
          display: flex; align-items: center; justify-content: space-around;
          max-width: 480px; margin: 0 auto;
        }
        .bnav-item {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 4px 10px; border-radius: 10px; text-decoration: none;
          color: ${muted}; transition: color .15s ease;
          font-size: .58rem; font-weight: 600; font-family: 'DM Sans', sans-serif;
          min-width: 52px;
        }
        .bnav-item.active { color: ${blue}; }
        .bnav-item:hover { color: ${blue}; }

        @media (max-width: 768px) {
          .bottom-nav { display: block; }
        }
      `}</style>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className={`bnav-item ${active === n.label ? "active" : ""}`}>
              <n.icon size={22} />
              <span>{n.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
