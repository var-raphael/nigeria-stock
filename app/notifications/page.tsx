"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Sidenav from "@/components/Sidenav";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import {
  HiTrendingUp, HiTrendingDown, HiOutlineBell,
} from "react-icons/hi";
import { RiEthLine, RiStockLine } from "react-icons/ri";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import type { Notif, NotifType, NotificationsData } from "@/backend/notifications";

// ── Constants ──────────────────────────────────────────────────────────────
type FilterTab = "all" | "unread" | "price" | "trade" | "watchlist" | "dividend";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",       label: "All"       },
  { key: "unread",    label: "Unread"    },
  { key: "price",     label: "Prices"    },
  { key: "trade",     label: "Trades"    },
  { key: "watchlist", label: "Watchlist" },
  { key: "dividend",  label: "Dividends" },
];

const TYPE_META: Record<NotifType, { bg: string; color: string }> = {
  price:     { bg: "rgba(59,130,246,.1)",  color: "#2563eb" },
  trade:     { bg: "rgba(139,92,246,.1)",  color: "#8b5cf6" },
  market:    { bg: "rgba(22,163,74,.1)",   color: "#16a34a" },
  system:    { bg: "rgba(245,158,11,.1)",  color: "#f59e0b" },
  watchlist: { bg: "rgba(236,72,153,.1)",  color: "#ec4899" },
  dividend:  { bg: "rgba(20,184,166,.1)",  color: "#14b8a6" },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function isNGXOpen(): boolean {
  const wat = new Date(Date.now() + 60 * 60 * 1000);
  const h = wat.getUTCHours(), m = wat.getUTCMinutes(), day = wat.getUTCDay();
  return day >= 1 && day <= 5 && (h > 10 || (h === 10 && m >= 0)) && (h < 14 || (h === 14 && m <= 30));
}

function NotifIcon({ n }: { n: Notif }) {
  const size = 17;
  if (n.type === "trade")     return <RiEthLine size={size} />;
  if (n.type === "watchlist") return n.up ? <HiTrendingUp size={size} /> : <HiTrendingDown size={size} />;
  if (n.type === "dividend")  return <MdOutlineAccountBalanceWallet size={size} />;
  if (n.type === "price")     return n.up ? <HiTrendingUp size={size} /> : <HiTrendingDown size={size} />;
  if (n.type === "market")    return <RiStockLine size={size} />;
  return <HiOutlineBell size={size} />;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { isDark } = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [sideOpen, setSideOpen]     = useState(true);
  const [marketOpen, setMarketOpen] = useState(isNGXOpen());
  const [notifs, setNotifs]         = useState<Notif[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<FilterTab>("all");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isNGXOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch notifications from API
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json() as Promise<NotificationsData>)
      .then((d) => { setNotifs(d.notifications); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Auto mark all read after 5 seconds (optimistic UI — fire-and-forget PATCH)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
      fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    }, 5_000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!mounted) return null;

  const bg      = isDark ? "#070d1a" : "#f0f4ff";
  const surface = isDark ? "#0d1b35" : "#ffffff";
  const surfAlt = isDark ? "#111f3d" : "#f8faff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const text    = isDark ? "#e8f0ff" : "#0f172a";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const blue    = "#2563eb";

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = notifs.filter((n) => {
    if (tab === "unread")    return !n.read;
    if (tab === "price")     return n.type === "price";
    if (tab === "trade")     return n.type === "trade";
    if (tab === "watchlist") return n.type === "watchlist";
    if (tab === "dividend")  return n.type === "dividend";
    return true;
  });

  const markRead = (id: number) => {
    setNotifs((ns) => ns.map((x) => x.id === id ? { ...x, read: true } : x));
    fetch(`/api/notifications?id=${id}`, { method: "PATCH" }).catch(() => {});
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: bg, minHeight: "100vh", display: "flex", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 4px; }

        .notif-main { flex:1; display:flex; flex-direction:column; min-height:100vh; min-width:0; max-width:100%; overflow-x:hidden; transition:margin-left .3s cubic-bezier(.16,1,.3,1); }
        .notif-main.with-nav { margin-left:240px; }
        .notif-main.no-nav   { margin-left:0; }
        .notif-content { padding:20px; flex:1; width:100%; max-width:680px; }

        .notif-bar { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
        .tabs-wrap { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; flex:1; }
        .tabs-wrap::-webkit-scrollbar { display:none; }
        .ntab { padding:6px 14px; border-radius:10px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:.78rem; font-weight:600; border:1px solid ${border}; background:${surfAlt}; color:${muted}; white-space:nowrap; transition:all .18s ease; }
        .ntab:hover { border-color:${blue}; color:${blue}; }
        .ntab.active { background:${blue}; border-color:${blue}; color:white; }
        .ntab-badge { display:inline-flex; align-items:center; justify-content:center; min-width:16px; height:16px; padding:0 4px; border-radius:8px; background:rgba(255,255,255,0.25); font-size:.6rem; font-weight:800; margin-left:5px; transition:opacity .4s ease; }
        .ntab-badge.fading { opacity:0; }

        .notif-list { background:${surface}; border:1px solid ${border}; border-radius:18px; overflow:hidden; }

        .notif-row { display:flex; align-items:flex-start; gap:13px; padding:15px 16px; border-bottom:1px solid ${border}; cursor:pointer; position:relative; transition:background .6s ease; }
        .notif-row:last-child { border-bottom:none; }
        .notif-row:hover { background:rgba(59,130,246,.03); }
        .notif-row.unread { background:${isDark ? "rgba(37,99,235,.05)" : "rgba(37,99,235,.03)"}; }
        .notif-row.unread:hover { background:${isDark ? "rgba(37,99,235,.08)" : "rgba(37,99,235,.06)"}; }

        .unread-dot { position:absolute; top:20px; right:16px; width:7px; height:7px; border-radius:50%; background:${blue}; transition:opacity .6s ease; }
        .unread-dot.hidden { opacity:0; }

        .notif-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
        .notif-body { flex:1; min-width:0; padding-right:16px; }
        .notif-title { font-family:'Syne',sans-serif; font-size:.84rem; font-weight:700; color:${text}; margin-bottom:4px; line-height:1.3; }
        .notif-text { font-size:.76rem; color:${muted}; line-height:1.55; }
        .notif-meta { display:flex; align-items:center; gap:8px; margin-top:7px; flex-wrap:wrap; }
        .notif-time { font-size:.66rem; color:${muted}; }

        .type-pill { display:inline-flex; align-items:center; font-size:.6rem; font-weight:700; padding:2px 7px; border-radius:6px; text-transform:uppercase; letter-spacing:.04em; }
        .notif-sym { display:inline-flex; align-items:center; gap:3px; font-size:.67rem; font-weight:700; padding:2px 7px; border-radius:6px; }
        .sym-up { background:rgba(22,163,74,.08); color:#16a34a; }
        .sym-dn { background:rgba(220,38,38,.06); color:#dc2626; }

        .view-btn { margin-top:8px; display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:7px; cursor:pointer; font-size:.7rem; font-weight:600; border:1px solid ${border}; background:transparent; color:${muted}; transition:all .15s ease; font-family:'DM Sans',sans-serif; text-decoration:none; }
        .view-btn:hover { border-color:${blue}; color:${blue}; }

        /* Skeleton */
        .skel { border-radius:8px; background:linear-gradient(90deg,${surfAlt} 25%,rgba(59,130,246,0.06) 50%,${surfAlt} 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        .empty { display:flex; flex-direction:column; align-items:center; padding:64px 20px; gap:12px; }
        .empty-icon { width:54px; height:54px; border-radius:16px; background:rgba(59,130,246,.08); display:flex; align-items:center; justify-content:center; }
        .empty-title { font-family:'Syne',sans-serif; font-size:.92rem; font-weight:800; color:${text}; }
        .empty-sub { font-size:.76rem; color:${muted}; text-align:center; max-width:260px; line-height:1.5; }

        .fade-in { animation:fadeIn .3s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }

        @media(min-width:769px) { .notif-content { padding:24px 28px; } }
        @media(max-width:768px) {
          .notif-main { margin-left:0 !important; }
          .notif-content { padding:14px 14px 90px; max-width:100%; }
        }
      `}</style>

      <Sidenav active="Settings" isOpen={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={`notif-main ${sideOpen ? "with-nav" : "no-nav"}`}>
        <Topbar title="Notifications" marketOpen={marketOpen} sideOpen={sideOpen} onMenuClick={() => setSideOpen(true)} />

        <div className="notif-content">
          <div className="fade-in">

            {/* Filter tabs */}
            <div className="notif-bar">
              <div className="tabs-wrap">
                {TABS.map((t) => (
                  <button key={t.key} className={`ntab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                    {t.label}
                    {t.key === "all" && unreadCount > 0 && (
                      <span className={`ntab-badge ${unreadCount === 0 ? "fading" : ""}`}>{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Skeleton */}
            {loading ? (
              <div className="notif-list">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: 13, padding: "15px 16px", borderBottom: `1px solid ${border}` }}>
                    <div className="skel" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                      <div className="skel" style={{ width: "55%", height: 12 }} />
                      <div className="skel" style={{ width: "85%", height: 10 }} />
                      <div className="skel" style={{ width: "30%", height: 9 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="notif-list">
                <div className="empty">
                  <div className="empty-icon"><HiOutlineBell size={24} color={muted} /></div>
                  <div className="empty-title">All caught up</div>
                  <div className="empty-sub">
                    No {tab !== "all" ? tab + " " : ""}notifications right now. We'll alert you on price moves, trades, and market events.
                  </div>
                </div>
              </div>
            ) : (
              <div className="notif-list">
                {filtered.map((n) => {
                  const meta = TYPE_META[n.type];
                  return (
                    <div
                      key={n.id}
                      className={`notif-row ${!n.read ? "unread" : ""}`}
                      onClick={() => markRead(n.id)}
                    >
                      <div className={`unread-dot ${n.read ? "hidden" : ""}`} />

                      <div className="notif-icon" style={{ background: meta.bg, color: meta.color }}>
                        <NotifIcon n={n} />
                      </div>

                      <div className="notif-body">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-text">{n.body}</div>
                        <div className="notif-meta">
                          <span className="notif-time">{n.time}</span>
                          {/* Type pill */}
                          <span className="type-pill" style={{ background: meta.bg, color: meta.color }}>
                            {n.type}
                          </span>
                          {/* Symbol badge for stock-related notifs */}
                          {n.symbol && (
                            <span className={`notif-sym ${n.up ? "sym-up" : "sym-dn"}`}>
                              {n.up ? <HiTrendingUp size={10} /> : <HiTrendingDown size={10} />}
                              {n.symbol}
                            </span>
                          )}
                        </div>
                        {n.symbol && (
                          <a className="view-btn" href={`/stocks/${n.symbol}`} onClick={(e) => e.stopPropagation()}>
                            View {n.symbol} →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      <BottomNav active="" />
    </div>
  );
}
