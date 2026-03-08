"use client";

import {
  HiOutlineViewGrid,
  HiOutlineChartBar,
  HiOutlineBriefcase,
  HiOutlineCog,
  HiOutlineX,
} from "react-icons/hi";
import { useTheme } from "@/context/ThemeContext";

const NAV = [
  { icon: HiOutlineViewGrid,  label: "Dashboard", href: "/dashboard" },
  { icon: HiOutlineChartBar,  label: "Stocks",    href: "/stocks"    },
  { icon: HiOutlineBriefcase, label: "Portfolio", href: "/portfolio" },
  { icon: HiOutlineCog,       label: "Settings",  href: "/settings"  },
];

interface SidenavProps {
  active: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidenav({ active, isOpen, onClose }: SidenavProps) {
  const { isDark } = useTheme();

  const surface = isDark ? "#0d1b35" : "#ffffff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const text    = isDark ? "#e8f0ff" : "#0f172a";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const blue    = "#2563eb";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

        .sidenav {
          position: fixed; top: 0; left: 0; height: 100vh; z-index: 50;
          display: flex; flex-direction: column;
          background: ${surface};
          border-right: 1px solid ${border};
          /* Animate opacity+transform instead of width to avoid overflow issues */
          width: 240px;
          transform: translateX(0);
          transition: transform .3s cubic-bezier(.16,1,.3,1), opacity .3s ease;
          opacity: 1;
        }
        .sidenav.shut {
          transform: translateX(-100%);
          opacity: 0;
          pointer-events: none;
        }

        .snav-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 16px;
          border-bottom: 1px solid ${border};
          gap: 8px;
        }
        .snav-brand {
          display: flex; align-items: center; gap: 11px;
          flex: 1; min-width: 0;
        }
        .snav-logo-box {
          width: 38px; height: 38px; flex-shrink: 0;
          background: linear-gradient(135deg, #1d4ed8, #60a5fa);
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(37,99,235,.4);
        }
        .snav-wordmark {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem; font-weight: 800;
          color: ${text};
          letter-spacing: -.02em; line-height: 1;
          /* Let text truncate if somehow too tight */
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .snav-wordmark span { color: ${blue}; }

        .snav-close-btn {
          flex-shrink: 0;
          width: 30px; height: 30px;
          background: transparent; border: none; cursor: pointer;
          color: ${muted};
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px; transition: all .18s ease;
        }
        .snav-close-btn:hover { background: rgba(59,130,246,.08); color: ${blue}; }

        .snav-links {
          flex: 1; padding: 12px 10px;
          display: flex; flex-direction: column; gap: 4px;
          overflow-y: auto;
        }
        .snav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 12px; cursor: pointer;
          text-decoration: none; color: ${muted};
          transition: all .18s ease; white-space: nowrap;
          font-size: .875rem; font-weight: 500;
          border: 1px solid transparent;
          font-family: 'DM Sans', sans-serif;
        }
        .snav-link:hover { background: rgba(59,130,246,.07); color: ${blue}; }
        .snav-link.active {
          background: rgba(37,99,235,.1); color: ${blue};
          border-color: rgba(37,99,235,.15);
        }

        @media (max-width: 768px) {
          .sidenav { display: none !important; }
        }
      `}</style>

      <nav className={`sidenav ${isOpen ? "open" : "shut"}`}>
        <div className="snav-header">
          <div className="snav-brand">
            <div className="snav-logo-box">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <span className="snav-wordmark">Naija<span>Stocks</span></span>
          </div>
          <button className="snav-close-btn" onClick={onClose} title="Close sidebar">
            <HiOutlineX size={16}/>
          </button>
        </div>

        <div className="snav-links">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className={`snav-link ${active === n.label ? "active" : ""}`}>
              <n.icon size={19}/>
              <span>{n.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
