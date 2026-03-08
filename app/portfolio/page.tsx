"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import Sidenav from "@/components/Sidenav";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import { HiTrendingUp, HiTrendingDown } from "react-icons/hi";
import { RiEthLine } from "react-icons/ri";
import type { PortfolioData, EnrichedHolding } from "@/backend/portfolio";

// ── Constants ──────────────────────────────────────────────────────────────
const PALETTE = ["#2563eb", "#60a5fa", "#16a34a", "#f59e0b", "#8b5cf6"];

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
function fmtETH(n: number) { return n.toFixed(4) + " ETH"; }
function fmtPct(n: number) { return (n >= 0 ? "+" : "") + n.toFixed(2) + "%"; }

// ── Tooltip-enabled SVG Donut ──────────────────────────────────────────────
function DonutChart({ data, total }: { data: EnrichedHolding[]; total: number }) {
  const R = 56, cx = 72, cy = 72, stroke = 22, circ = 2 * Math.PI * R;
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; symbol: string; pct: string; value: string; color: string;
  } | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  let offset = 0;
  const segs = data.map((h, i) => {
    const dash = (h.value / total) * circ;
    const midAngle = ((offset + dash / 2) / circ) * 2 * Math.PI - Math.PI / 2;
    const seg = {
      dash, offset,
      color: PALETTE[i % PALETTE.length],
      symbol: h.symbol,
      value: h.value,
      pct: ((h.value / total) * 100).toFixed(1),
      midAngle,
    };
    offset += dash;
    return seg;
  });

  const showTooltip = (i: number, clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const seg = segs[i];
    const scaleX = rect.width / 144;
    const scaleY = rect.height / 144;
    const tipX = rect.left + (cx + R * Math.cos(seg.midAngle)) * scaleX;
    const tipY = rect.top  + (cy + R * Math.sin(seg.midAngle)) * scaleY;
    setTooltip({ x: tipX, y: tipY, symbol: seg.symbol, pct: seg.pct, value: fmtShort(seg.value), color: seg.color });
    setActiveIdx(i);
  };

  const hideTooltip = () => { setTooltip(null); setActiveIdx(null); };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <svg
        ref={svgRef}
        width={144} height={144} viewBox="0 0 144 144"
        style={{ display: "block" }}
        onMouseLeave={hideTooltip}
      >
        {segs.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={s.color}
            strokeWidth={activeIdx === i ? stroke + 6 : stroke}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ cursor: "pointer", transition: "stroke-width .15s ease, opacity .15s ease", opacity: activeIdx !== null && activeIdx !== i ? 0.4 : 1 }}
            onMouseEnter={(e) => showTooltip(i, e.clientX, e.clientY)}
            onTouchStart={(e) => { showTooltip(i, e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }}
            onTouchEnd={hideTooltip}
          />
        ))}

        {activeIdx === null ? (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle"
              style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, fill: "currentColor" }}>
              {data.length}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle"
              style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fill: "#7a95c0" }}>
              STOCKS
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 7} textAnchor="middle"
              style={{ fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 800, fill: segs[activeIdx].color }}>
              {segs[activeIdx].symbol}
            </text>
            <text x={cx} y={cy + 7} textAnchor="middle"
              style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 800, fill: "currentColor" }}>
              {segs[activeIdx].pct}%
            </text>
          </>
        )}
      </svg>

      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x, top: tooltip.y,
          transform: "translate(-50%, -115%)",
          background: "#0a1628", border: `1px solid ${tooltip.color}44`,
          borderRadius: 12, padding: "8px 12px", pointerEvents: "none",
          zIndex: 9999, boxShadow: `0 6px 24px rgba(0,0,0,0.5), 0 0 0 1px ${tooltip.color}22`,
          minWidth: 110,
        }}>
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 10, height: 6, overflow: "hidden" }}>
            <div style={{ width: 10, height: 10, background: "#0a1628", border: `1px solid ${tooltip.color}44`, transform: "rotate(45deg) translate(-3px, -3px)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: tooltip.color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: ".76rem", fontWeight: 800, color: "#e8f0ff" }}>{tooltip.symbol}</span>
          </div>
          <div style={{ fontSize: ".68rem", color: "#7a95c0", marginBottom: 2 }}>{tooltip.value}</div>
          <div style={{ fontSize: ".72rem", color: tooltip.color, fontWeight: 700 }}>{tooltip.pct}% of portfolio</div>
        </div>
      )}
    </div>
  );
}

function Skel({ w, h, surface }: { w: string; h: number; surface: string }) {
  return <div style={{ width: w, height: h, borderRadius: 8, background: `linear-gradient(90deg,${surface} 25%,rgba(59,130,246,0.06) 50%,${surface} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const { isDark } = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [data, setData]             = useState<PortfolioData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sideOpen, setSideOpen]     = useState(true);
  const [marketOpen, setMarketOpen] = useState(isNGXOpen());
  const [tab, setTab]               = useState<"holdings" | "transactions">("holdings");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isNGXOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json() as Promise<PortfolioData>; })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setFetchError("Could not load portfolio data."); setLoading(false); });
  }, []);

  if (!mounted) return null;

  const bg      = isDark ? "#070d1a" : "#f0f4ff";
  const surface = isDark ? "#0d1b35" : "#ffffff";
  const surfAlt = isDark ? "#111f3d" : "#f8faff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const text    = isDark ? "#e8f0ff" : "#0f172a";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const blue    = "#2563eb";

  const summary = data?.summary;
  const up      = (summary?.totalPnL ?? 0) >= 0;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: bg, minHeight: "100vh", display: "flex", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 4px; }

        .port-main { flex:1; display:flex; flex-direction:column; min-height:100vh; min-width:0; max-width:100%; overflow-x:hidden; transition:margin-left .3s cubic-bezier(.16,1,.3,1); }
        .port-main.with-nav { margin-left:240px; }
        .port-main.no-nav   { margin-left:0; }
        .port-content { padding:20px; flex:1; width:100%; max-width:100%; }

        .p-summary { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; width:100%; }
        .p-sum-card { background:${surface}; border:1px solid ${border}; border-radius:14px; padding:12px 14px; min-width:0; overflow:hidden; }
        .p-sum-label { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:${muted}; margin-bottom:4px; white-space:nowrap; }
        .p-sum-val { font-family:'Syne',sans-serif; font-size:.9rem; font-weight:800; color:${text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .p-sum-up { color:#16a34a; } .p-sum-dn { color:#dc2626; }

        .alloc-card { background:${surface}; border:1px solid ${border}; border-radius:18px; padding:18px; margin-bottom:14px; width:100%; }
        .alloc-inner { display:flex; align-items:center; gap:20px; }
        .alloc-title { font-family:'Syne',sans-serif; font-size:.84rem; font-weight:800; color:${text}; margin-bottom:14px; }

        .legend { display:grid; grid-template-columns:1fr 1fr; gap:8px 10px; flex:1; min-width:0; overflow:hidden; }
        .legend-row { display:flex; align-items:center; gap:5px; min-width:0; overflow:hidden; }
        .legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .legend-sym { font-size:.68rem; font-weight:700; color:${text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; }
        .legend-pct { font-size:.65rem; color:${muted}; flex-shrink:0; white-space:nowrap; }

        .table-card { background:${surface}; border:1px solid ${border}; border-radius:18px; overflow:hidden; width:100%; margin-bottom:14px; }
        .tabs { display:flex; gap:6px; padding:12px 14px; border-bottom:1px solid ${border}; }
        .ptab { padding:6px 14px; border-radius:9px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:.78rem; font-weight:600; border:1px solid transparent; color:${muted}; transition:all .18s ease; }
        .ptab:hover { color:${blue}; }
        .ptab.active { background:${blue}; color:white; }

        .h-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 14px; border-bottom:1px solid ${border}; cursor:pointer; transition:background .15s; }
        .h-row:last-child { border-bottom:none; }
        .h-row:hover { background:rgba(59,130,246,.03); }
        .h-left { min-width:0; flex:1; }
        .h-sym  { font-family:'Syne',sans-serif; font-size:.84rem; font-weight:800; color:${text}; }
        .h-name { font-size:.67rem; color:${muted}; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .h-right { text-align:right; flex-shrink:0; }
        .h-val  { font-family:'Syne',sans-serif; font-size:.82rem; font-weight:700; color:${text}; }
        .h-pnl-up { color:#16a34a; font-size:.72rem; font-weight:700; display:flex; align-items:center; gap:2px; justify-content:flex-end; }
        .h-pnl-dn { color:#dc2626; font-size:.72rem; font-weight:700; display:flex; align-items:center; gap:2px; justify-content:flex-end; }

        .tx-row { display:flex; align-items:center; gap:10px; padding:11px 14px; border-bottom:1px solid ${border}; }
        .tx-row:last-child { border-bottom:none; }
        .tx-badge { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:.58rem; font-weight:800; font-family:'Syne',sans-serif; flex-shrink:0; }
        .tx-buy  { background:rgba(22,163,74,.1);  color:#16a34a; }
        .tx-sell { background:rgba(220,38,38,.08); color:#dc2626; }
        .tx-info  { flex:1; min-width:0; }
        .tx-sym   { font-family:'Syne',sans-serif; font-size:.8rem; font-weight:700; color:${text}; }
        .tx-det   { font-size:.66rem; color:${muted}; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tx-right { text-align:right; flex-shrink:0; }
        .tx-eth   { font-size:.75rem; font-weight:600; color:${text}; display:flex; align-items:center; gap:3px; justify-content:flex-end; white-space:nowrap; }
        .tx-date  { font-size:.64rem; color:${muted}; margin-top:2px; }

        .error-msg { color:#dc2626; font-size:.85rem; text-align:center; padding:40px 20px; }
        .fade-in { animation:fadeIn .3s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        @media(min-width:769px) {
          .port-content { padding:24px 28px; }
          .p-summary { grid-template-columns:repeat(4,1fr); }
        }
        @media(max-width:768px) {
          .port-main { margin-left:0 !important; }
          .port-content { padding:14px 14px 90px; }
        }
      `}</style>

      <Sidenav active="Portfolio" isOpen={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={`port-main ${sideOpen ? "with-nav" : "no-nav"}`}>
        <Topbar title="Portfolio" marketOpen={marketOpen} sideOpen={sideOpen} onMenuClick={() => setSideOpen(true)} />

        <div className="port-content">
          {loading ? (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="p-summary">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-sum-card" style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <Skel w="65%" h={9}  surface={surfAlt} />
                    <Skel w="85%" h={15} surface={surfAlt} />
                  </div>
                ))}
              </div>
              <div className="alloc-card" style={{ height: 180 }}><Skel w="100%" h={150} surface={surfAlt} /></div>
              <div className="table-card" style={{ padding: 16 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ marginBottom: 10 }}><Skel w="100%" h={44} surface={surfAlt} /></div>
                ))}
              </div>
            </div>
          ) : fetchError ? (
            <div className="error-msg">{fetchError}</div>
          ) : data && summary ? (
            <div className="fade-in">

              {/* Summary strip */}
              <div className="p-summary">
                {[
                  { label: "Portfolio Value", val: fmtShort(summary.totalValue) },
                  { label: "Total Invested",  val: fmtShort(summary.totalCost)  },
                  { label: "Total P&L",       val: (up ? "+" : "-") + fmtShort(Math.abs(summary.totalPnL)), up, dn: !up },
                  { label: "ETH Equivalent",  val: fmtETH(summary.totalETH)     },
                ].map((s) => (
                  <div className="p-sum-card" key={s.label}>
                    <div className="p-sum-label">{s.label}</div>
                    <div className={`p-sum-val ${s.up ? "p-sum-up" : s.dn ? "p-sum-dn" : ""}`}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Allocation donut */}
              <div className="alloc-card">
                <div className="alloc-title">Allocation</div>
                <div className="alloc-inner">
                  <DonutChart data={data.holdings} total={summary.totalValue} />
                  <div className="legend">
                    {data.holdings.map((h, i) => (
                      <div className="legend-row" key={h.symbol}>
                        <span className="legend-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="legend-sym">{h.symbol}</span>
                        <span className="legend-pct">{((h.value / summary.totalValue) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Holdings / Transactions tabs */}
              <div className="table-card">
                <div className="tabs">
                  <button className={`ptab ${tab === "holdings" ? "active" : ""}`} onClick={() => setTab("holdings")}>Holdings</button>
                  <button className={`ptab ${tab === "transactions" ? "active" : ""}`} onClick={() => setTab("transactions")}>Transactions</button>
                </div>

                {tab === "holdings" ? (
                  data.holdings.map((h) => (
                    <div className="h-row" key={h.symbol} onClick={() => window.location.href = `/stocks/${h.symbol}`}>
                      <div className="h-left">
                        <div className="h-sym">{h.symbol}</div>
                        <div className="h-name">{h.name} · {h.shares} shares</div>
                      </div>
                      <div className="h-right">
                        <div className="h-val">{fmtShort(h.value)}</div>
                        <div className={h.pnlPct >= 0 ? "h-pnl-up" : "h-pnl-dn"}>
                          {h.pnlPct >= 0 ? <HiTrendingUp size={11} /> : <HiTrendingDown size={11} />}
                          {fmtPct(h.pnlPct)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  data.transactions.map((tx, i) => (
                    <div className="tx-row" key={i}>
                      <div className={`tx-badge ${tx.type === "BUY" ? "tx-buy" : "tx-sell"}`}>{tx.type}</div>
                      <div className="tx-info">
                        <div className="tx-sym">{tx.symbol}</div>
                        <div className="tx-det">{tx.shares} shares · {fmtPrice(tx.price)}/share</div>
                      </div>
                      <div className="tx-right">
                        <div className="tx-eth"><RiEthLine size={11} />{fmtETH(tx.eth)}</div>
                        <div className="tx-date">{tx.date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          ) : null}
        </div>
      </div>

      <BottomNav active="Portfolio" />
    </div>
  );
}
