"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Sidenav from "@/components/Sidenav";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import {
  HiTrendingUp, HiTrendingDown, HiOutlineBell,
  HiOutlineBellOff, HiOutlineTrash, HiOutlineBookmark,
} from "react-icons/hi";
import type { WatchlistData, WatchlistItem } from "@/backend/watchlist";

// ── Helpers ────────────────────────────────────────────────────────────────
function isNGXOpen(): boolean {
  const wat = new Date(Date.now() + 60 * 60 * 1000);
  const h = wat.getUTCHours(), m = wat.getUTCMinutes(), day = wat.getUTCDay();
  return day >= 1 && day <= 5 && (h > 10 || (h === 10 && m >= 0)) && (h < 14 || (h === 14 && m <= 30));
}

function fmtPrice(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n: number) {
  if (n >= 1_000_000_000) return "₦" + (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return "₦" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)         return "₦" + (n / 1_000).toFixed(0) + "K";
  return "₦" + n.toFixed(0);
}
function fmtPct(n: number) { return (n >= 0 ? "+" : "") + n.toFixed(2) + "%"; }

// Mini sparkline
function Spark({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 80, H = 32, px = 2, py = 4;
  const pts = data.map((v, i) => [
    px + (i / (data.length - 1)) * (W - px * 2),
    py + (H - py * 2) - ((v - min) / range) * (H - py * 2),
  ] as [number, number]);
  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [p, q] = pts[i - 1]; const cx = (p + x) / 2;
    return `${acc} C${cx} ${q},${cx} ${y},${x} ${y}`;
  }, "");
  const color = up ? "#16a34a" : "#dc2626";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sg${up ? "u" : "d"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${pts[pts.length-1][0]} ${H} L${pts[0][0]} ${H} Z`} fill={`url(#sg${up?"u":"d"})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Alert badge — shows if alert thresholds are set
function AlertBadge({ above, below, muted }: { above?: number; below?: number; muted: string }) {
  if (!above && !below) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {above && (
        <span style={{ fontSize: ".6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "rgba(22,163,74,.08)", color: "#16a34a" }}>
          ▲ {fmtPrice(above)}
        </span>
      )}
      {below && (
        <span style={{ fontSize: ".6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "rgba(220,38,38,.06)", color: "#dc2626" }}>
          ▼ {fmtPrice(below)}
        </span>
      )}
    </div>
  );
}

// Alert editor modal
function AlertModal({
  item, onSave, onClose, isDark, surface, border, text, muted, blue,
}: {
  item: WatchlistItem;
  onSave: (symbol: string, above?: number, below?: number) => void;
  onClose: () => void;
  isDark: boolean; surface: string; border: string; text: string; muted: string; blue: string;
}) {
  const [above, setAbove] = useState(item.alertAbove?.toString() ?? "");
  const [below, setBelow] = useState(item.alertBelow?.toString() ?? "");

  const save = () => {
    onSave(
      item.symbol,
      above ? parseFloat(above) : undefined,
      below ? parseFloat(below) : undefined,
    );
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: `1px solid ${border}`, background: isDark ? "#0a1628" : "#f8faff",
    color: text, fontSize: ".84rem", outline: "none",
    fontFamily: "'DM Sans',sans-serif",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: surface, border: `1px solid ${border}`,
        borderRadius: 20, padding: "22px 20px", width: "100%", maxWidth: 340,
        boxShadow: "0 16px 48px rgba(0,0,0,.45)",
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: ".9rem", fontWeight: 800, color: text, marginBottom: 4 }}>
          Set Alerts — {item.symbol}
        </div>
        <div style={{ fontSize: ".72rem", color: muted, marginBottom: 18 }}>
          Get notified when {item.stock.name} crosses your price targets.
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#16a34a", display: "block", marginBottom: 6 }}>
            Alert Above (₦)
          </label>
          <input
            type="number" placeholder={`e.g. ${(item.stock.price * 1.05).toFixed(0)}`}
            value={above} onChange={(e) => setAbove(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#dc2626", display: "block", marginBottom: 6 }}>
            Alert Below (₦)
          </label>
          <input
            type="number" placeholder={`e.g. ${(item.stock.price * 0.95).toFixed(0)}`}
            value={below} onChange={(e) => setBelow(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={onClose}
            style={{ padding: "10px", borderRadius: 12, border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer", fontSize: ".8rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{ padding: "10px", borderRadius: 12, border: "none", background: blue, color: "white", cursor: "pointer", fontSize: ".8rem", fontWeight: 700, fontFamily: "'Syne',sans-serif" }}
          >
            Save Alerts
          </button>
        </div>
      </div>
    </div>
  );
}

function Skel({ w, h, surface }: { w: string; h: number; surface: string }) {
  return <div style={{ width: w, height: h, borderRadius: 8, background: `linear-gradient(90deg,${surface} 25%,rgba(59,130,246,0.06) 50%,${surface} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const { isDark } = useTheme();
  const [mounted, setMounted]         = useState(false);
  const [sideOpen, setSideOpen]       = useState(true);
  const [marketOpen, setMarketOpen]   = useState(isNGXOpen());
  const [loading, setLoading]         = useState(true);
  const [items, setItems]             = useState<WatchlistItem[]>([]);
  const [alertModal, setAlertModal]   = useState<WatchlistItem | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isNGXOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json() as Promise<WatchlistData>)
      .then((d) => { setItems(d.items); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const remove = (symbol: string) => {
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
    fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" }).catch(() => {});
  };

  const saveAlert = (symbol: string, alertAbove?: number, alertBelow?: number) => {
    setItems((prev) => prev.map((i) => i.symbol === symbol ? { ...i, alertAbove, alertBelow } : i));
    fetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, alertAbove, alertBelow }),
    }).catch(() => {});
  };

  if (!mounted) return null;

  const bg      = isDark ? "#070d1a" : "#f0f4ff";
  const surface = isDark ? "#0d1b35" : "#ffffff";
  const surfAlt = isDark ? "#111f3d" : "#f8faff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const text    = isDark ? "#e8f0ff" : "#0f172a";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const blue    = "#2563eb";

  const gainers = items.filter((i) => i.stock.changePct >= 0).length;
  const losers  = items.filter((i) => i.stock.changePct <  0).length;
  const alerted = items.filter((i) => i.alertAbove || i.alertBelow).length;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: bg, minHeight: "100vh", display: "flex", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 4px; }

        .wl-main { flex:1; display:flex; flex-direction:column; min-height:100vh; min-width:0; max-width:100%; overflow-x:hidden; transition:margin-left .3s cubic-bezier(.16,1,.3,1); }
        .wl-main.with-nav { margin-left:240px; }
        .wl-main.no-nav   { margin-left:0; }
        .wl-content { padding:20px; flex:1; width:100%; max-width:100%; }

        /* Summary strip */
        .wl-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
        .wl-sum-card { background:${surface}; border:1px solid ${border}; border-radius:14px; padding:12px 14px; }
        .wl-sum-label { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:${muted}; margin-bottom:4px; }
        .wl-sum-val { font-family:'Syne',sans-serif; font-size:1.1rem; font-weight:800; color:${text}; }

        /* List */
        .wl-list { background:${surface}; border:1px solid ${border}; border-radius:18px; overflow:hidden; }
        .wl-row { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid ${border}; transition:background .15s; }
        .wl-row:last-child { border-bottom:none; }
        .wl-row:hover { background:rgba(59,130,246,.03); }

        .wl-left { flex:1; min-width:0; }
        .wl-sym { font-family:'Syne',sans-serif; font-size:.88rem; font-weight:800; color:${text}; }
        .wl-name { font-size:.67rem; color:${muted}; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .wl-alerts { margin-top:5px; }

        .wl-mid { display:flex; flex-direction:column; align-items:flex-end; gap:3px; flex-shrink:0; }
        .wl-price { font-family:'Syne',sans-serif; font-size:.88rem; font-weight:800; color:${text}; }
        .wl-chg-up { font-size:.72rem; font-weight:700; color:#16a34a; display:flex; align-items:center; gap:2px; justify-content:flex-end; }
        .wl-chg-dn { font-size:.72rem; font-weight:700; color:#dc2626; display:flex; align-items:center; gap:2px; justify-content:flex-end; }

        .wl-actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .wl-btn { width:32px; height:32px; border-radius:9px; border:1px solid ${border}; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:${muted}; transition:all .15s ease; }
        .wl-btn:hover { border-color:${blue}; color:${blue}; }
        .wl-btn.danger:hover { border-color:#dc2626; color:#dc2626; }

        /* Empty */
        .wl-empty { display:flex; flex-direction:column; align-items:center; padding:64px 20px; gap:12px; text-align:center; }
        .wl-empty-icon { width:58px; height:58px; border-radius:18px; background:rgba(59,130,246,.08); display:flex; align-items:center; justify-content:center; }
        .wl-empty-title { font-family:'Syne',sans-serif; font-size:.96rem; font-weight:800; color:${text}; }
        .wl-empty-sub { font-size:.76rem; color:${muted}; max-width:260px; line-height:1.55; }
        .wl-empty-cta { margin-top:4px; padding:10px 22px; border-radius:12px; background:${blue}; color:white; font-family:'Syne',sans-serif; font-size:.82rem; font-weight:800; text-decoration:none; border:none; cursor:pointer; }

        .fade-in { animation:fadeIn .3s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        @media(min-width:769px) { .wl-content { padding:24px 28px; } }
        @media(max-width:768px) {
          .wl-main { margin-left:0 !important; }
          .wl-content { padding:14px 14px 90px; }
        }
      `}</style>

      {alertModal && (
        <AlertModal
          item={alertModal}
          onSave={saveAlert}
          onClose={() => setAlertModal(null)}
          isDark={isDark} surface={surface} border={border} text={text} muted={muted} blue={blue}
        />
      )}

      <Sidenav active="Watchlist" isOpen={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={`wl-main ${sideOpen ? "with-nav" : "no-nav"}`}>
        <Topbar title="Watchlist" marketOpen={marketOpen} sideOpen={sideOpen} onMenuClick={() => setSideOpen(true)} />

        <div className="wl-content">
          <div className="fade-in">

            {/* Summary strip */}
            {!loading && items.length > 0 && (
              <div className="wl-summary">
                <div className="wl-sum-card">
                  <div className="wl-sum-label">Watching</div>
                  <div className="wl-sum-val">{items.length}</div>
                </div>
                <div className="wl-sum-card">
                  <div className="wl-sum-label">Up Today</div>
                  <div className="wl-sum-val" style={{ color: "#16a34a" }}>{gainers}</div>
                </div>
                <div className="wl-sum-card">
                  <div className="wl-sum-label">Alerts Set</div>
                  <div className="wl-sum-val" style={{ color: "#2563eb" }}>{alerted}</div>
                </div>
              </div>
            )}

            {/* List */}
            {loading ? (
              <div className="wl-list">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${border}`, alignItems: "center" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                      <Skel w="35%" h={12} surface={surfAlt} />
                      <Skel w="55%" h={10} surface={surfAlt} />
                    </div>
                    <Skel w="80px" h={32} surface={surfAlt} />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                      <Skel w="70px" h={12} surface={surfAlt} />
                      <Skel w="50px" h={10} surface={surfAlt} />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="wl-list">
                <div className="wl-empty">
                  <div className="wl-empty-icon"><HiOutlineBookmark size={26} color={muted} /></div>
                  <div className="wl-empty-title">Your watchlist is empty</div>
                  <div className="wl-empty-sub">Add stocks from the dashboard or any stock detail page to track them here and set price alerts.</div>
                  <a href="/stocks" className="wl-empty-cta">Browse Stocks →</a>
                </div>
              </div>
            ) : (
              <div className="wl-list">
                {items.map((item) => {
                  const up = item.stock.changePct >= 0;
                  return (
                    <div className="wl-row" key={item.symbol}>

                      {/* Left — symbol, name, alerts */}
                      <div className="wl-left">
                        <a href={`/stocks/${item.symbol}`} style={{ textDecoration: "none" }}>
                          <div className="wl-sym">{item.symbol}</div>
                          <div className="wl-name">{item.stock.name}</div>
                        </a>
                        <div className="wl-alerts">
                          <AlertBadge above={item.alertAbove} below={item.alertBelow} muted={muted} />
                        </div>
                      </div>

                      {/* Sparkline */}
                      <Spark data={item.stock.chart} up={up} />

                      {/* Price + change */}
                      <div className="wl-mid">
                        <div className="wl-price">{fmtPrice(item.stock.price)}</div>
                        <div className={up ? "wl-chg-up" : "wl-chg-dn"}>
                          {up ? <HiTrendingUp size={11} /> : <HiTrendingDown size={11} />}
                          {fmtPct(item.stock.changePct)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="wl-actions">
                        <button
                          className="wl-btn"
                          title="Set price alert"
                          onClick={() => setAlertModal(item)}
                        >
                          {item.alertAbove || item.alertBelow
                            ? <HiOutlineBell size={15} color="#2563eb" />
                            : <HiOutlineBellOff size={15} />
                          }
                        </button>
                        <button
                          className="wl-btn danger"
                          title="Remove from watchlist"
                          onClick={() => remove(item.symbol)}
                        >
                          <HiOutlineTrash size={15} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      <BottomNav active="Watchlist" />
    </div>
  );
}
