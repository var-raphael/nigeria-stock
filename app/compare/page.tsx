"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import Sidenav from "@/components/Sidenav";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import { HiTrendingUp, HiTrendingDown, HiOutlineSearch, HiOutlineSwitchHorizontal, HiOutlineX, HiOutlineInformationCircle } from "react-icons/hi";
import type { StockDetail } from "@/backend/ticker";

// ── Constants ──────────────────────────────────────────────────────────────
const COLOR_A = "#2563eb";
const COLOR_B = "#f59e0b";
const DATE_LABELS = ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"];

const STAT_TIPS: Record<string, string> = {
  "Price":    "Current trading price on the NGX",
  "Change %": "Today's percentage price movement",
  "Day Open": "Price at market open today (10:00 AM)",
  "Day High": "Highest price traded today",
  "Day Low":  "Lowest price traded today",
  "Volume":   "Number of shares traded today",
  "Mkt Cap":  "Total market value (price × shares outstanding)",
  "52w High": "Highest closing price in the past 52 weeks",
  "52w Low":  "Lowest closing price in the past 52 weeks",
  "Sector":   "NGX industry classification",
};

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
  return "₦" + (n / 1_000).toFixed(0) + "K";
}

// ── Overlaid normalised chart ──────────────────────────────────────────────
function OverlaidChart({ a, b, isDark, border }: { a: StockDetail; b: StockDetail; isDark: boolean; border: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx]     = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const W = 700, H = 160, padX = 8, padY = 12;
  const normalise = (data: number[]) => data.map((v) => ((v - data[0]) / data[0]) * 100);
  const normA = normalise(a.chart), normB = normalise(b.chart);
  const allNorm = [...normA, ...normB];
  const min = Math.min(...allNorm), max = Math.max(...allNorm), range = max - min || 1;

  const makePts = (norm: number[]) => norm.map((v, i) => [
    padX + (i / (norm.length - 1)) * (W - padX * 2),
    padY + (H - padY * 2) - ((v - min) / range) * (H - padY * 2),
  ] as [number, number]);

  const ptsA = makePts(normA);
  const ptsB = makePts(normB);

  const makePath = (pts: [number, number][]) => pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = pts[i - 1]; const cx = (px + x) / 2;
    return `${acc} C${cx} ${py},${cx} ${y},${x} ${y}`;
  }, "");

  const pathA = makePath(ptsA);
  const pathB = makePath(ptsB);
  const zeroY = padY + (H - padY * 2) - ((0 - min) / range) * (H - padY * 2);

  const handleMove = (clientX: number) => {
    const svg = svgRef.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * W;
    let closest = 0, minDist = Infinity;
    ptsA.forEach(([px], i) => { const d = Math.abs(px - relX); if (d < minDist) { minDist = d; closest = i; } });
    const midX = rect.left + ptsA[closest][0] * (rect.width / W);
    const midY = rect.top  + ((ptsA[closest][1] + ptsB[closest][1]) / 2) * (rect.height / H);
    setHoverIdx(closest);
    setTooltipPos({ x: midX, y: midY });
  };

  const handleLeave = () => { setHoverIdx(null); setTooltipPos(null); };

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        width="100%" height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={handleLeave}
        onTouchMove={(e) => { handleMove(e.touches[0].clientX); e.preventDefault(); }}
        onTouchEnd={handleLeave}
      >
        <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke={border} strokeWidth="1" strokeDasharray="4 4" />
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i} x1={0} y1={padY + (H - padY * 2) * f} x2={W} y2={padY + (H - padY * 2) * f}
            stroke={isDark ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.05)"} strokeWidth="1" />
        ))}
        <path d={pathA} fill="none" stroke={COLOR_A} strokeWidth="2.5" strokeLinecap="round" />
        <path d={pathB} fill="none" stroke={COLOR_B} strokeWidth="2.5" strokeLinecap="round" />

        {hoverIdx !== null && (
          <line x1={ptsA[hoverIdx][0]} y1={padY} x2={ptsA[hoverIdx][0]} y2={H - padY}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
        )}
        {ptsA.map(([x, y], i) => (
          <circle key={`a${i}`} cx={x} cy={y}
            r={hoverIdx === i ? 6 : (i === ptsA.length - 1 ? 4 : 2.5)}
            fill={hoverIdx === i || i === ptsA.length - 1 ? COLOR_A : "none"}
            stroke={COLOR_A} strokeWidth="2" style={{ transition: "r .1s ease" }}
          />
        ))}
        {ptsB.map(([x, y], i) => (
          <circle key={`b${i}`} cx={x} cy={y}
            r={hoverIdx === i ? 6 : (i === ptsB.length - 1 ? 4 : 2.5)}
            fill={hoverIdx === i || i === ptsB.length - 1 ? COLOR_B : "none"}
            stroke={COLOR_B} strokeWidth="2" style={{ transition: "r .1s ease" }}
          />
        ))}
      </svg>

      {hoverIdx !== null && tooltipPos && (
        <div style={{
          position: "fixed", left: tooltipPos.x, top: tooltipPos.y,
          transform: "translate(-50%, -115%)",
          background: "#0a1628", border: "1px solid rgba(96,165,250,0.2)",
          borderRadius: 12, padding: "9px 13px", pointerEvents: "none",
          zIndex: 9999, boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
          minWidth: 160, whiteSpace: "nowrap",
        }}>
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 10, height: 6, overflow: "hidden" }}>
            <div style={{ width: 10, height: 10, background: "#0a1628", border: "1px solid rgba(96,165,250,0.2)", transform: "rotate(45deg) translate(-3px,-3px)" }} />
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: ".63rem", color: "#7a95c0", marginBottom: 7, textAlign: "center" }}>{DATE_LABELS[hoverIdx]}</div>
          {([{ s: a, c: COLOR_A }, { s: b, c: COLOR_B }]).map(({ s, c }, idx) => (
            <div key={idx}>
              {idx === 1 && <div style={{ height: 1, background: "rgba(96,165,250,0.1)", margin: "4px 0" }} />}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: idx === 1 ? 5 : 0, marginBottom: idx === 0 ? 5 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: ".72rem", fontWeight: 800, color: c }}>{s.symbol}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: ".78rem", fontWeight: 800, color: "#e8f0ff" }}>{fmtPrice(s.chart[hoverIdx])}</div>
                  {hoverIdx > 0 && (
                    <div style={{ fontSize: ".62rem", fontWeight: 700, color: s.chart[hoverIdx] >= s.chart[hoverIdx - 1] ? "#16a34a" : "#dc2626" }}>
                      {s.chart[hoverIdx] >= s.chart[hoverIdx - 1] ? "▲" : "▼"} {fmtPrice(Math.abs(s.chart[hoverIdx] - s.chart[hoverIdx - 1]))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual sparkline ───────────────────────────────────────────────────
function IndivChart({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 700, H = 72, px = 6, py = 6;
  const pts = data.map((v, i) => [
    px + (i / (data.length - 1)) * (W - px * 2),
    py + (H - py * 2) - ((v - min) / range) * (H - py * 2),
  ] as [number, number]);
  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [p, q] = pts[i - 1]; const cx = (p + x) / 2;
    return `${acc} C${cx} ${q},${cx} ${y},${x} ${y}`;
  }, "");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`ig${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`} fill={`url(#ig${color.replace("#", "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2.5}
          fill={i === pts.length - 1 ? color : "none"} stroke={color} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ── Info tooltip ───────────────────────────────────────────────────────────
function Tooltip({ text, isDark }: { text: string; isDark: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow((v) => !v)}
    >
      <HiOutlineInformationCircle size={13} style={{ color: "#7a95c0", cursor: "help", flexShrink: 0 }} />
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: isDark ? "#1a2f5a" : "#1e293b",
          color: "white", fontSize: ".68rem", fontWeight: 500,
          padding: "6px 10px", borderRadius: 8,
          zIndex: 200, pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,.3)",
          maxWidth: 200, whiteSpace: "normal", textAlign: "center", lineHeight: 1.4,
        }}>
          {text}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: `5px solid ${isDark ? "#1a2f5a" : "#1e293b"}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ── Stock picker ───────────────────────────────────────────────────────────
function StockPicker({ value, color, label, onChange, exclude, allSymbols, stockMap, isDark, surface, surfAlt, border, text, muted, dropLeft }: {
  value: string | null; color: string; label: string;
  onChange: (s: string) => void; exclude: string | null;
  allSymbols: string[]; stockMap: Record<string, StockDetail>;
  isDark: boolean; surface: string; surfAlt: string;
  border: string; text: string; muted: string; dropLeft?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const results = allSymbols.filter((s) =>
    s !== exclude &&
    (s.toLowerCase().includes(query.toLowerCase()) ||
     (stockMap[s]?.name ?? "").toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: surface, border: `2px solid ${value ? color : border}`, borderRadius: 14, cursor: "pointer", transition: "border-color .18s" }}
      >
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: value ? color : muted, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          {value ? (
            <>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: ".85rem", fontWeight: 800, color: text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
              <div style={{ fontSize: ".65rem", color: muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stockMap[value]?.name}</div>
            </>
          ) : (
            <div style={{ fontSize: ".78rem", color: muted, whiteSpace: "nowrap" }}>{label}</div>
          )}
        </div>
        {value
          ? <HiOutlineX size={14} color={muted} onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }} />
          : <HiOutlineSearch size={14} color={muted} />
        }
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)",
          ...(dropLeft ? { right: 0 } : { left: 0 }),
          width: "min(260px, 90vw)", zIndex: 200,
          background: surface, border: `1px solid ${border}`,
          borderRadius: 14, boxShadow: `0 8px 32px rgba(0,0,0,${isDark ? ".5" : ".15"})`,
          maxHeight: 260, overflowY: "auto", overflowX: "hidden",
        }}>
          <div style={{ padding: "9px 10px", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, background: surface, zIndex: 1 }}>
            <div style={{ position: "relative" }}>
              <HiOutlineSearch style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: muted }} size={13} />
              <input
                autoFocus value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stock..."
                onClick={(e) => e.stopPropagation()}
                style={{ width: "100%", padding: "6px 8px 6px 26px", borderRadius: 8, border: `1px solid ${border}`, background: surfAlt, color: text, fontSize: ".78rem", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
              />
            </div>
          </div>

          {results.map((s) => {
            const stock = stockMap[s];
            if (!stock) return null;
            const up = stock.changePct >= 0;
            return (
              <div key={s}
                onClick={() => { onChange(s); setOpen(false); setQuery(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", borderBottom: `1px solid ${border}`, transition: "background .12s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(59,130,246,.07)" : "rgba(59,130,246,.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: ".8rem", fontWeight: 800, color: text }}>{s}</div>
                  <div style={{ fontSize: ".67rem", color: muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stock.name}</div>
                </div>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: up ? "#16a34a" : "#dc2626", flexShrink: 0, display: "flex", alignItems: "center", gap: 2 }}>
                  {up ? <HiTrendingUp size={11} /> : <HiTrendingDown size={11} />}
                  {up ? "+" : ""}{stock.changePct.toFixed(2)}%
                </div>
              </div>
            );
          })}
          {results.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: muted, fontSize: ".76rem" }}>No stocks found</div>
          )}
        </div>
      )}
    </div>
  );
}

function Skel({ w, h, surface }: { w: string; h: number; surface: string }) {
  return <div style={{ width: w, height: h, borderRadius: 8, background: `linear-gradient(90deg,${surface} 25%,rgba(59,130,246,0.06) 50%,${surface} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const { isDark } = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [sideOpen, setSideOpen]     = useState(true);
  const [marketOpen, setMarketOpen] = useState(isNGXOpen());
  const [symA, setSymA]             = useState<string | null>(null);
  const [symB, setSymB]             = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [stockA, setStockA]         = useState<StockDetail | null>(null);
  const [stockB, setStockB]         = useState<StockDetail | null>(null);
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [stockMap, setStockMap]     = useState<Record<string, StockDetail>>({});

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isNGXOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Load all stocks on mount so the picker is fully populated immediately.
  // GET /api/compare (no params) returns { symbols, stockMap } with all stock data.
  useEffect(() => {
    fetch("/api/compare")
      .then((r) => r.json())
      .then(({ symbols, stockMap: map }: { symbols: string[]; stockMap: Record<string, StockDetail> }) => {
        setAllSymbols(symbols);
        setStockMap(map);
        const params = new URLSearchParams(window.location.search);
        const a = params.get("a")?.toUpperCase();
        if (a && symbols.includes(a)) setSymA(a);
      });
  }, []);

  // Fetch both stocks when symA or symB changes
  useEffect(() => {
    if (!symA && !symB) { setStockA(null); setStockB(null); return; }
    if (!symA) { setStockA(null); return; }
    if (!symB) { setStockB(null); return; }

    setLoading(true);
    fetch(`/api/compare?a=${symA}&b=${symB}`)
      .then((r) => r.json())
      .then(({ stockA: a, stockB: b, symbols }: { stockA: StockDetail; stockB: StockDetail; symbols: string[] }) => {
        setStockA(a);
        setStockB(b);
        // Keep stockMap up to date for the picker
        setStockMap((prev) => ({ ...prev, [a.symbol]: a, [b.symbol]: b }));
        setAllSymbols(symbols);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symA, symB]);

  const swap = useCallback(() => {
    setSymA(symB); setSymB(symA); setStockA(stockB); setStockB(stockA);
  }, [symA, symB, stockA, stockB]);

  if (!mounted) return null;

  const bg      = isDark ? "#070d1a" : "#f0f4ff";
  const surface = isDark ? "#0d1b35" : "#ffffff";
  const surfAlt = isDark ? "#111f3d" : "#f8faff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const text    = isDark ? "#e8f0ff" : "#0f172a";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const ready   = stockA && stockB && !loading;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: bg, minHeight: "100vh", display: "flex", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 4px; }

        .cmp-main { flex:1; display:flex; flex-direction:column; min-height:100vh; min-width:0; max-width:100%; overflow-x:hidden; transition:margin-left .3s cubic-bezier(.16,1,.3,1); }
        .cmp-main.with-nav { margin-left:240px; }
        .cmp-main.no-nav   { margin-left:0; }
        .cmp-content { padding:20px; flex:1; width:100%; max-width:100%; }

        .picker-row { display:flex; align-items:stretch; gap:8px; margin-bottom:16px; width:100%; }
        .swap-btn { width:36px; min-width:36px; border-radius:10px; border:1px solid ${border}; background:${surfAlt}; cursor:pointer; display:flex; align-items:center; justify-content:center; color:${muted}; transition:all .22s ease; flex-shrink:0; align-self:center; }
        .swap-btn:hover { border-color:#2563eb; color:#2563eb; transform:rotate(180deg); }

        .chart-card { background:${surface}; border:1px solid ${border}; border-radius:18px; padding:16px; margin-bottom:14px; width:100%; overflow:hidden; }
        .chart-title { font-family:'Syne',sans-serif; font-size:.82rem; font-weight:800; color:${text}; margin-bottom:3px; }
        .chart-sub { font-size:.66rem; color:${muted}; margin-bottom:12px; }
        .chart-legend { display:flex; gap:14px; margin-bottom:10px; flex-wrap:wrap; }
        .legend-item { display:flex; align-items:center; gap:5px; }
        .legend-line { width:18px; height:3px; border-radius:2px; }
        .legend-lbl { font-size:.72rem; font-weight:700; color:${text}; }
        .legend-pct { font-size:.68rem; }

        .side-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
        .side-card { background:${surface}; border:1px solid ${border}; border-radius:16px; padding:14px; overflow:hidden; }
        .side-sym { font-family:'Syne',sans-serif; font-size:.8rem; font-weight:800; }
        .side-name { font-size:.65rem; color:${muted}; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .side-price { font-family:'Syne',sans-serif; font-size:1rem; font-weight:800; color:${text}; margin:4px 0 2px; }
        .side-chg { font-size:.72rem; font-weight:700; display:flex; align-items:center; gap:3px; margin-bottom:8px; }
        .chg-up { color:#16a34a; } .chg-dn { color:#dc2626; }

        .stats-card { background:${surface}; border:1px solid ${border}; border-radius:18px; overflow:hidden; margin-bottom:14px; }
        .stats-head { display:grid; grid-template-columns:1fr auto 1fr; padding:10px 14px; background:${surfAlt}; border-bottom:1px solid ${border}; gap:8px; }
        .stats-head-a { font-family:'Syne',sans-serif; font-size:.78rem; font-weight:800; color:${COLOR_A}; }
        .stats-head-mid { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:${muted}; text-align:center; white-space:nowrap; }
        .stats-head-b { font-family:'Syne',sans-serif; font-size:.78rem; font-weight:800; color:${COLOR_B}; text-align:right; }
        .stat-row { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:10px 14px; gap:8px; border-bottom:1px solid ${border}; }
        .stat-row:last-child { border-bottom:none; }
        .stat-val { font-family:'Syne',sans-serif; font-size:0.78rem; font-weight:700; }
        .stat-label-cell { display:flex; align-items:center; justify-content:center; gap:4px; }
        .stat-label-text { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:${muted}; text-align:center; white-space:nowrap; }
        .win { color:#16a34a !important; }

        .winner-banner { display:flex; align-items:center; justify-content:center; gap:7px; padding:10px 14px; background:rgba(22,163,74,.06); border:1px solid rgba(22,163,74,.15); border-radius:12px; margin-bottom:14px; flex-wrap:wrap; text-align:center; }
        .winner-text { font-family:'Syne',sans-serif; font-size:.8rem; font-weight:800; color:#16a34a; }
        .winner-sub { font-size:.74rem; color:${muted}; }

        .empty-state { display:flex; flex-direction:column; align-items:center; padding:50px 20px; gap:12px; text-align:center; }
        .empty-icon { width:58px; height:58px; border-radius:18px; background:rgba(59,130,246,.08); display:flex; align-items:center; justify-content:center; }
        .empty-title { font-family:'Syne',sans-serif; font-size:.96rem; font-weight:800; color:${text}; }
        .empty-sub { font-size:.76rem; color:${muted}; max-width:260px; line-height:1.55; }

        .date-row { display:flex; justify-content:space-between; margin-top:6px; }
        .date-lbl { font-size:.58rem; color:${muted}; }

        .fade-in { animation:fadeIn .3s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        @media(min-width:769px) { .cmp-content { padding:24px 28px; } }
        @media(max-width:768px) {
          .cmp-main { margin-left:0 !important; }
          .cmp-content { padding:14px 14px 90px; }
          .side-grid { grid-template-columns:1fr 1fr; gap:10px; }
          .side-price { font-size:.88rem; }
        }
        @media(max-width:400px) { .side-grid { grid-template-columns:1fr; } }
      `}</style>

      <Sidenav active="Stocks" isOpen={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={`cmp-main ${sideOpen ? "with-nav" : "no-nav"}`}>
        <Topbar title="Compare Stocks" marketOpen={marketOpen} sideOpen={sideOpen} onMenuClick={() => setSideOpen(true)} />

        <div className="cmp-content">
          <div className="fade-in">

            {/* Pickers */}
            <div className="picker-row">
              <StockPicker
                value={symA} color={COLOR_A} label="First stock"
                onChange={(v) => setSymA(v || null)} exclude={symB}
                allSymbols={allSymbols} stockMap={stockMap}
                isDark={isDark} surface={surface} surfAlt={surfAlt}
                border={border} text={text} muted={muted} dropLeft={false}
              />
              <button className="swap-btn" style={{ height: 48 }} onClick={swap} title="Swap stocks">
                <HiOutlineSwitchHorizontal size={16} />
              </button>
              <StockPicker
                value={symB} color={COLOR_B} label="Second stock"
                onChange={(v) => setSymB(v || null)} exclude={symA}
                allSymbols={allSymbols} stockMap={stockMap}
                isDark={isDark} surface={surface} surfAlt={surfAlt}
                border={border} text={text} muted={muted} dropLeft={true}
              />
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="chart-card" style={{ height: 200 }}><Skel w="100%" h={160} surface={surfAlt} /></div>
                <div className="side-grid">
                  {[0, 1].map((i) => <div key={i} className="side-card" style={{ height: 120 }}><Skel w="100%" h={90} surface={surfAlt} /></div>)}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && (!symA || !symB) && (
              <div className="chart-card">
                <div className="empty-state">
                  <div className="empty-icon"><HiOutlineSwitchHorizontal size={26} color={muted} /></div>
                  <div className="empty-title">
                    {!symA && !symB ? "Pick two stocks to compare" : "Now pick a second stock"}
                  </div>
                  <div className="empty-sub">Compare 7-day performance, price stats, and market cap side by side.</div>
                </div>
              </div>
            )}

            {/* Results */}
            {ready && stockA && stockB && (() => {
              const winner = stockA.changePct >= stockB.changePct ? stockA : stockB;
              const loser  = winner.symbol === stockA.symbol ? stockB : stockA;
              const diff   = Math.abs(stockA.changePct - stockB.changePct).toFixed(2);

              const STATS = [
                { label: "Price",    valA: fmtPrice(stockA.price),     valB: fmtPrice(stockB.price),     rawA: stockA.price,      rawB: stockB.price      },
                { label: "Change %", valA: `${stockA.changePct >= 0 ? "+" : ""}${stockA.changePct.toFixed(2)}%`, valB: `${stockB.changePct >= 0 ? "+" : ""}${stockB.changePct.toFixed(2)}%`, rawA: stockA.changePct, rawB: stockB.changePct },
                { label: "Day Open", valA: fmtPrice(stockA.open),      valB: fmtPrice(stockB.open),      rawA: stockA.open,       rawB: stockB.open       },
                { label: "Day High", valA: fmtPrice(stockA.high),      valB: fmtPrice(stockB.high),      rawA: stockA.high,       rawB: stockB.high       },
                { label: "Day Low",  valA: fmtPrice(stockA.low),       valB: fmtPrice(stockB.low),       rawA: stockA.low,        rawB: stockB.low,       hib: false },
                { label: "Volume",   valA: stockA.volume.toLocaleString(), valB: stockB.volume.toLocaleString(), rawA: stockA.volume, rawB: stockB.volume  },
                { label: "Mkt Cap",  valA: fmtShort(stockA.marketCap), valB: fmtShort(stockB.marketCap), rawA: stockA.marketCap,  rawB: stockB.marketCap  },
                { label: "52w High", valA: fmtPrice(stockA.week52High), valB: fmtPrice(stockB.week52High), rawA: stockA.week52High, rawB: stockB.week52High },
                { label: "52w Low",  valA: fmtPrice(stockA.week52Low),  valB: fmtPrice(stockB.week52Low),  rawA: stockA.week52Low,  rawB: stockB.week52Low, hib: false },
                { label: "Sector",   valA: stockA.sector,               valB: stockB.sector,               rawA: 0,                 rawB: 0                },
              ];

              return (
                <>
                  <div className="winner-banner">
                    <HiTrendingUp size={15} color="#16a34a" />
                    <span className="winner-text">{winner.symbol}</span>
                    <span className="winner-sub">is outperforming {loser.symbol} by {diff}% today</span>
                  </div>

                  <div className="chart-card">
                    <div className="chart-title">7-Day Performance</div>
                    <div className="chart-sub">Normalised to % change from day 1 — equal starting point for both stocks</div>
                    <div className="chart-legend">
                      {([{ s: stockA, c: COLOR_A }, { s: stockB, c: COLOR_B }]).map(({ s, c }) => {
                        const pct = ((s.chart[s.chart.length - 1] - s.chart[0]) / s.chart[0]) * 100;
                        return (
                          <div className="legend-item" key={s.symbol}>
                            <div className="legend-line" style={{ background: c }} />
                            <span className="legend-lbl">{s.symbol}</span>
                            <span className="legend-pct" style={{ color: pct >= 0 ? "#16a34a" : "#dc2626" }}>
                              {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <OverlaidChart a={stockA} b={stockB} isDark={isDark} border={border} />
                    <div className="date-row">
                      {DATE_LABELS.map((d) => <span key={d} className="date-lbl">{d}</span>)}
                    </div>
                  </div>

                  <div className="side-grid">
                    {([{ s: stockA, c: COLOR_A }, { s: stockB, c: COLOR_B }]).map(({ s, c }) => (
                      <div className="side-card" key={s.symbol}>
                        <div className="side-sym" style={{ color: c }}>{s.symbol}</div>
                        <div className="side-name">{s.name}</div>
                        <div className="side-price">{fmtPrice(s.price)}</div>
                        <div className={`side-chg ${s.changePct >= 0 ? "chg-up" : "chg-dn"}`}>
                          {s.changePct >= 0 ? <HiTrendingUp size={11} /> : <HiTrendingDown size={11} />}
                          {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                        </div>
                        <IndivChart data={s.chart} color={c} />
                      </div>
                    ))}
                  </div>

                  <div className="stats-card">
                    <div className="stats-head">
                      <div className="stats-head-a">{stockA.symbol}</div>
                      <div className="stats-head-mid">Metric</div>
                      <div className="stats-head-b">{stockB.symbol}</div>
                    </div>
                    {STATS.map((row, i) => {
                      const hib  = row.hib !== false;
                      const aWins = row.rawA !== 0 && row.rawA !== row.rawB && (hib ? row.rawA > row.rawB : row.rawA < row.rawB);
                      const bWins = row.rawB !== 0 && row.rawA !== row.rawB && (hib ? row.rawB > row.rawA : row.rawB < row.rawA);
                      return (
                        <div key={row.label} className="stat-row"
                          style={{ background: i % 2 !== 0 ? (isDark ? "rgba(59,130,246,.02)" : "rgba(59,130,246,.01)") : "transparent" }}
                        >
                          <div className={`stat-val ${aWins ? "win" : ""}`} style={{ color: aWins ? "#16a34a" : text }}>{row.valA}</div>
                          <div className="stat-label-cell">
                            <span className="stat-label-text">{row.label}</span>
                            {STAT_TIPS[row.label] && <Tooltip text={STAT_TIPS[row.label]} isDark={isDark} />}
                          </div>
                          <div className={`stat-val ${bWins ? "win" : ""}`} style={{ color: bWins ? "#16a34a" : text, textAlign: "right" }}>{row.valB}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    {([{ s: stockA, c: COLOR_A }, { s: stockB, c: COLOR_B }]).map(({ s, c }) => (
                      <a key={s.symbol} href={`/stocks/${s.symbol}`}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", borderRadius: 14, textDecoration: "none", border: `1.5px solid ${c}`, color: c, fontFamily: "'Syne',sans-serif", fontSize: ".82rem", fontWeight: 800, transition: "all .18s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = `${c}15`)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        View {s.symbol} →
                      </a>
                    ))}
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      </div>

      <BottomNav active="Stocks" />
    </div>
  );
}
