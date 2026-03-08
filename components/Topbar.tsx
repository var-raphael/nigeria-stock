"use client";

import { HiOutlineBell, HiOutlineMenuAlt2 } from "react-icons/hi";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";

interface TopbarProps {
  title: string;
  marketOpen: boolean;
  sideOpen: boolean;
  onMenuClick: () => void;
}

export default function Topbar({ title, marketOpen, sideOpen, onMenuClick }: TopbarProps) {
  const { isDark } = useTheme();

  const surface = isDark ? "#0d1b35" : "#ffffff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const text    = isDark ? "#e8f0ff" : "#0f172a";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const blue    = "#2563eb";

  return (
    <>
      <style>{`
        .topbar {
          position: sticky; top: 0; z-index: 40;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px; height: 64px;
          background: ${surface}; border-bottom: 1px solid ${border};
          backdrop-filter: blur(12px);
        }
        .topbar-left { display: flex; align-items: center; gap: 10px; }
        .topbar-menu-btn {
          width: 38px; height: 38px; border-radius: 10px;
          border: 1px solid ${border}; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: ${muted}; transition: all .18s ease; flex-shrink: 0;
        }
        .topbar-menu-btn:hover { background: rgba(59,130,246,.07); color: ${blue}; }
        .topbar-title {
          font-family: 'Syne', sans-serif; font-size: 1.1rem;
          font-weight: 800; color: ${text}; letter-spacing: -.02em;
        }
        .nigeria-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 20px;
          font-size: .65rem; font-weight: 700;
          font-family: 'Syne', sans-serif;
          text-transform: uppercase; letter-spacing: .05em;
          background: rgba(22,163,74,.1);
          border: 1px solid rgba(22,163,74,.2);
          color: #16a34a; white-space: nowrap;
        }
        .nigeria-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #16a34a;
          animation: nigeria-blink 2s ease-in-out infinite;
        }
        @keyframes nigeria-blink { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .topbar-bell {
          width: 40px; height: 40px; border-radius: 10px;
          border: 1px solid ${border}; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: ${muted}; transition: all .18s ease;
          position: relative; flex-shrink: 0; text-decoration: none;
        }
        .topbar-bell:hover { background: rgba(59,130,246,.07); color: ${blue}; }
        .topbar-bell-dot {
          position: absolute; top: 8px; right: 8px;
          width: 6px; height: 6px; border-radius: 50%; background: #ef4444;
        }
        @media (max-width: 768px) {
          .topbar { padding: 0 14px; }
          .topbar-menu-btn { display: none; }
        }
      `}</style>

      <div className="topbar">
        <div className="topbar-left">
          {!sideOpen && (
            <button className="topbar-menu-btn" onClick={onMenuClick}>
              <HiOutlineMenuAlt2 size={18}/>
            </button>
          )}
          <span className="topbar-title">{title}</span>
          {marketOpen && (
            <div className="nigeria-pill">
              <span className="nigeria-dot"/>
              Nigeria
            </div>
          )}
        </div>
        <div className="topbar-right">
          <a href="/notifications" className="topbar-bell">
            <HiOutlineBell size={18}/>
            <span className="topbar-bell-dot"/>
          </a>
          <ThemeToggle/>
        </div>
      </div>
    </>
  );
}
