"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Sidenav from "@/components/Sidenav";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import { HiTrendingUp, HiTrendingDown, HiOutlineArrowRight } from "react-icons/hi";
import { RiEthLine } from "react-icons/ri";
import type { DashboardData } from "@/backend/dashboard";

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
function fmtETH(n: number)  { return n.toFixed(4) + " ETH"; }
function fmtPct(n: number)  { return (n >= 0 ? "+" : "") + n.toFixed(2) + "%"; }

// ── Sub-components ─────────────────────────────────────────────────────────

function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 72, H = 30, px = 2, py = 4;
  const pts = data.map((v, i) => [
    px + (i / (data.length - 1)) * (W - px * 2),
    py + (H - py * 2) - ((v - min) / range) * (H - py * 2),
  ] as [number, number]);
  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px2, py2] = pts[i - 1]; const cx = (px2 + x) / 2;
    return `${acc} C${cx} ${py2},${cx} ${y},${x} ${y}`;
  }, "");
  const color = up ? "#16a34a" : "#dc2626";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", flexShrink: 0 }}>
      <path d={`${path} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`} fill={up ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.1)"} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

function Skel({ w, h, r = 8, surface }: { w: string; h: number; r?: number; surface: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: `linear-gradient(90deg,${surface} 25%,rgba(59,130,246,0.06) 50%,${surface} 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isDark } = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [sideOpen, setSideOpen]     = useState(true);
  const [marketOpen, setMarketOpen] = useState(isNGXOpen());
  const [data, setData]             = useState<DashboardData | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isNGXOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch dashboard data from backend
  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json() as Promise<DashboardData>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Could not load dashboard data."); setLoading(false); });
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

        .dash-main { flex:1; display:flex; flex-direction:column; min-height:100vh; min-width:0; max-width:100%; overflow-x:hidden; transition:margin-left .3s cubic-bezier(.16,1,.3,1); }
        .dash-main.with-nav { margin-left:240px; }
        .dash-main.no-nav   { margin-left:0; }
        .dash-content { padding:20px; flex:1; width:100%; max-width:100%; }

        .hero-card {
          width:100%; border-radius:20px; padding:20px;
          background:linear-gradient(135deg,#1a3a7a 0%,#1e4bbd 50%,#2563eb 100%);
          margin-bottom:16px; position:relative; overflow:hidden;
        }
        .hero-card::before { content:''; position:absolute; top:-40px; right:-40px; width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,0.04); }
        .hero-label { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,0.6); margin-bottom:6px; }
        .hero-price { font-family:'Syne',sans-serif; font-weight:800; color:white; letter-spacing:-.03em; line-height:1; margin-bottom:5px; font-size:clamp(1.4rem,6vw,2.4rem); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .hero-eth { font-size:.78rem; color:rgba(255,255,255,0.55); display:flex; align-items:center; gap:4px; margin-bottom:16px; }
        .hero-bottom { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .hero-pnl { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .pnl-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:20px; font-size:.75rem; font-weight:700; font-family:'Syne',sans-serif; white-space:nowrap; }
        .pnl-up { background:rgba(22,163,74,.2); border:1px solid rgba(22,163,74,.3); color:#4ade80; }
        .pnl-dn { background:rgba(220,38,38,.2); border:1px solid rgba(220,38,38,.3); color:#f87171; }
        .pnl-abs { font-size:.72rem; color:rgba(255,255,255,0.5); white-space:nowrap; }

        .quick-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:16px; width:100%; }
        .qs-card { background:${surface}; border:1px solid ${border}; border-radius:14px; padding:12px 14px; min-width:0; overflow:hidden; }
        .qs-label { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:${muted}; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .qs-val { font-family:'Syne',sans-serif; font-size:.88rem; font-weight:800; color:${text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .section-card { background:${surface}; border:1px solid ${border}; border-radius:18px; overflow:hidden; margin-bottom:14px; width:100%; }
        .section-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid ${border}; }
        .section-title { font-family:'Syne',sans-serif; font-size:.86rem; font-weight:800; color:${text}; }
        .section-link { font-size:.72rem; font-weight:600; color:${blue}; text-decoration:none; display:flex; align-items:center; gap:3px; cursor:pointer; white-space:nowrap; }

        .holding-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid ${border}; cursor:pointer; transition:background .15s; gap:8px; }
        .holding-row:last-child { border-bottom:none; }
        .holding-row:hover { background:rgba(59,130,246,.03); }
        .holding-left { min-width:0; flex:1; }
        .holding-sym { font-family:'Syne',sans-serif; font-size:.84rem; font-weight:800; color:${text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .holding-name { font-size:.68rem; color:${muted}; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .holding-right { text-align:right; flex-shrink:0; }
        .holding-val { font-family:'Syne',sans-serif; font-size:.82rem; font-weight:700; color:${text}; }
        .chg-up { color:#16a34a; font-size:.72rem; font-weight:700; display:flex; align-items:center; gap:2px; justify-content:flex-end; }
        .chg-dn { color:#dc2626; font-size:.72rem; font-weight:700; display:flex; align-items:center; gap:2px; justify-content:flex-end; }

        .mover-row { display:flex; align-items:center; justify-content:space-between; padding:11px 16px; border-bottom:1px solid ${border}; cursor:pointer; transition:background .15s; gap:8px; }
        .mover-row:last-child { border-bottom:none; }
        .mover-row:hover { background:rgba(59,130,246,.03); }
        .mover-sym { font-family:'Syne',sans-serif; font-size:.82rem; font-weight:800; color:${text}; }
        .mover-price { font-size:.72rem; color:${muted}; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mbadge { display:inline-flex; align-items:center; gap:3px; padding:3px 8px; border-radius:14px; font-size:.72rem; font-weight:700; white-space:nowrap; flex-shrink:0; }
        .mbadge-up { background:rgba(22,163,74,.08); color:#16a34a; }
        .mbadge-dn { background:rgba(220,38,38,.06); color:#dc2626; }

        .tx-row { display:flex; align-items:center; gap:10px; padding:11px 16px; border-bottom:1px solid ${border}; }
        .tx-row:last-child { border-bottom:none; }
        .tx-badge { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:.58rem; font-weight:800; font-family:'Syne',sans-serif; flex-shrink:0; }
        .tx-buy  { background:rgba(22,163,74,.1); color:#16a34a; }
        .tx-sell { background:rgba(220,38,38,.08); color:#dc2626; }
        .tx-info { flex:1; min-width:0; }
        .tx-sym    { font-family:'Syne',sans-serif; font-size:.8rem; font-weight:700; color:${text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tx-detail { font-size:.66rem; color:${muted}; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tx-right  { text-align:right; flex-shrink:0; }
        .tx-eth    { font-size:.76rem; font-weight:600; color:${text}; display:flex; align-items:center; gap:3px; justify-content:flex-end; white-space:nowrap; }
        .tx-date   { font-size:.65rem; color:${muted}; margin-top:2px; }

        .error-msg { color:#dc2626; font-size:.85rem; text-align:center; padding:40px 20px; }
        .fade-in { animation:fadeIn .3s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        @media(min-width:769px) {
          .dash-content { padding:24px 28px; }
          .quick-stats { grid-template-columns:repeat(3,1fr); }
          .two-col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
          .hero-price { font-size:2.4rem; }
        }
        @media(max-width:768px) {
          .dash-main { margin-left:0 !important; }
          .dash-content { padding:14px 14px 90px; }
        }
      `}</style>

      <Sidenav active="Dashboard" isOpen={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={`dash-main ${sideOpen ? "with-nav" : "no-nav"}`}>
        <Topbar title="Dashboard" marketOpen={marketOpen} sideOpen={sideOpen} onMenuClick={() => setSideOpen(true)} />

        <div className="dash-content">
          {loading ? (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: surfAlt, borderRadius: 20, padding: 20, height: 150 }}>
                <Skel w="110px" h={10} surface={surfAlt} /><div style={{ height: 10 }} />
                <Skel w="70%" h={34} surface={surfAlt} /><div style={{ height: 8 }} />
                <Skel w="140px" h={12} surface={surfAlt} />
              </div>
              <div className="quick-stats">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="qs-card" style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <Skel w="70%" h={9} surface={surfAlt} />
                    <Skel w="85%" h={15} surface={surfAlt} />
                  </div>
                ))}
              </div>
              <div className="section-card" style={{ padding: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ marginBottom: 10 }}><Skel w="100%" h={42} surface={surfAlt} /></div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="error-msg">{error}</div>
          ) : data && summary ? (
            <div className="fade-in">

              {/* Hero */}
              <div className="hero-card">
                <div className="hero-label">Total Portfolio Value</div>
                <div className="hero-price">{fmtPrice(summary.totalValue)}</div>
                <div className="hero-eth"><RiEthLine size={13} />{fmtETH(summary.totalETH)} equivalent</div>
                <div className="hero-bottom">
                  <div className="hero-pnl">
                    <span className={`pnl-badge ${up ? "pnl-up" : "pnl-dn"}`}>
                      {up ? <HiTrendingUp size={12} /> : <HiTrendingDown size={12} />}
                      {fmtPct(summary.totalPnLPct)}
                    </span>
                    <span className="pnl-abs">{up ? "+" : ""}{fmtShort(Math.abs(summary.totalPnL))} all time</span>
                  </div>
                  <MiniSparkline data={summary.chartData} up={up} />
                </div>
              </div>

              {/* Quick stats */}
              <div className="quick-stats">
                {[
                  { label: "Holdings",    val: `${data.holdings.length} stocks` },
                  { label: "Invested",    val: fmtShort(summary.totalCost)      },
                  { label: "ETH Balance", val: fmtETH(summary.ethBalance)       },
                ].map(s => (
                  <div className="qs-card" key={s.label}>
                    <div className="qs-label">{s.label}</div>
                    <div className="qs-val">{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Holdings + Movers */}
              <div className="two-col">

                <div className="section-card">
                  <div className="section-head">
                    <span className="section-title">My Holdings</span>
                    <a className="section-link" href="/portfolio">View all <HiOutlineArrowRight size={12} /></a>
                  </div>
                  {data.holdings.slice(0, 4).map(h => {
                    const val = h.shares * h.price;
                    const pct = ((h.price - h.avgBuy) / h.avgBuy) * 100;
                    const hUp = pct >= 0;
                    return (
                      <div className="holding-row" key={h.symbol} onClick={() => window.location.href = `/stocks/${h.symbol}`}>
                        <div className="holding-left">
                          <div className="holding-sym">{h.symbol}</div>
                          <div className="holding-name">{h.name}</div>
                        </div>
                        <div className="holding-right">
                          <div className="holding-val">{fmtShort(val)}</div>
                          <div className={hUp ? "chg-up" : "chg-dn"}>
                            {hUp ? <HiTrendingUp size={11} /> : <HiTrendingDown size={11} />}
                            {fmtPct(pct)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="section-card">
                  <div className="section-head">
                    <span className="section-title">Market Movers</span>
                    <a className="section-link" href="/stocks">NGX <HiOutlineArrowRight size={12} /></a>
                  </div>
                  {data.movers.map(m => {
                    const mUp = m.changePct >= 0;
                    return (
                      <div className="mover-row" key={m.symbol} onClick={() => window.location.href = `/stocks/${m.symbol}`}>
                        <div className="holding-left">
                          <div className="mover-sym">{m.symbol}</div>
                          <div className="mover-price">{fmtPrice(m.price)}</div>
                        </div>
                        <span className={`mbadge ${mUp ? "mbadge-up" : "mbadge-dn"}`}>
                          {mUp ? <HiTrendingUp size={11} /> : <HiTrendingDown size={11} />}
                          {fmtPct(m.changePct)}
                        </span>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Transactions */}
              <div className="section-card">
                <div className="section-head">
                  <span className="section-title">Recent Transactions</span>
                  <a className="section-link" href="/portfolio">All <HiOutlineArrowRight size={12} /></a>
                </div>
                {data.transactions.map((tx, i) => (
                  <div className="tx-row" key={i}>
                    <div className={`tx-badge ${tx.type === "BUY" ? "tx-buy" : "tx-sell"}`}>{tx.type}</div>
                    <div className="tx-info">
                      <div className="tx-sym">{tx.symbol}</div>
                      <div className="tx-detail">{tx.shares} shares · {fmtShort(tx.price * tx.shares)}</div>
                    </div>
                    <div className="tx-right">
                      <div className="tx-eth"><RiEthLine size={11} />{tx.eth.toFixed(4)}</div>
                      <div className="tx-date">{tx.date}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : null}
        </div>
      </div>

      <BottomNav active="Dashboard" />
    </div>
  );
}
