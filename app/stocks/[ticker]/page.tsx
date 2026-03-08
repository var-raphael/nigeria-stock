"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import Sidenav from "@/components/Sidenav";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import { HiTrendingUp, HiTrendingDown, HiOutlineArrowLeft, HiOutlineSwitchHorizontal } from "react-icons/hi";
import { RiEthLine } from "react-icons/ri";
import type { StockDetail } from "@/backend/ticker";

// ── Helpers ────────────────────────────────────────────────────────────────
function isNGXOpen(): boolean {
  const wat = new Date(Date.now() + 60 * 60 * 1000);
  const h = wat.getUTCHours(), m = wat.getUTCMinutes(), day = wat.getUTCDay();
  return day >= 1 && day <= 5 && (h > 10 || (h === 10 && m >= 0)) && (h < 14 || (h === 14 && m <= 30));
}

function fmtPrice(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtVol(n: number) {
  if (n >= 1_000_000_000) return "₦" + (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return "₦" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

// ── SVG Sparkline (hero mini chart) ───────────────────────────────────────
function Sparkline({ data, up, width = 100, height = 52 }: { data: number[]; up: boolean; width?: number; height?: number }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pad = 4, w = width - pad * 2, h = height - pad * 2;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * w, pad + h - ((v - min) / range) * h] as [number, number]);
  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, "");
  const fill = `${path} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`;
  const color = up ? "#16a34a" : "#dc2626";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${up})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}

// ── Interactive Chart with Tooltip ────────────────────────────────────────
const DATE_LABELS = ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"];

function InteractiveChart({ data, up, border }: { data: number[]; up: boolean; border: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx]     = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; arrow: number } | null>(null);

  const color = up ? "#16a34a" : "#dc2626";
  const W = 700, H = 140, padX = 8, padY = 10;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;

  const pts = data.map((v, i) => [
    padX + (i / (data.length - 1)) * (W - padX * 2),
    padY + (H - padY * 2) - ((v - min) / range) * (H - padY * 2),
  ] as [number, number]);

  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, "");
  const fill   = `${path} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;
  const gradId = `cg-${up ? "up" : "dn"}`;

  const TOOLTIP_W = 120;

  const getIdxFromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * W;
    let closest = 0, minDist = Infinity;
    pts.forEach(([px], i) => {
      const d = Math.abs(px - relX);
      if (d < minDist) { minDist = d; closest = i; }
    });
    return closest;
  };

  const updateTooltip = (clientX: number) => {
    const idx = getIdxFromClientX(clientX);
    if (idx === null) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / H;
    const rawX = rect.left + pts[idx][0] * scaleX;
    const margin = 8;
    const clampedX = Math.min(Math.max(rawX, TOOLTIP_W / 2 + margin), window.innerWidth - TOOLTIP_W / 2 - margin);
    setHoverIdx(idx);
    setTooltipPos({ x: clampedX, y: rect.top + pts[idx][1] * scaleY, arrow: rawX - clampedX });
  };

  const handleMouseMove  = (e: React.MouseEvent<SVGSVGElement>)  => updateTooltip(e.clientX);
  const handleTouchMove  = (e: React.TouchEvent<SVGSVGElement>)  => { updateTooltip(e.touches[0].clientX); e.preventDefault(); };
  const handleLeave      = () => { setHoverIdx(null); setTooltipPos(null); };

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        width="100%" height="140"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleLeave}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i}
            x1={0} y1={padY + (H - padY * 2) * f}
            x2={W} y2={padY + (H - padY * 2) * f}
            stroke={border} strokeWidth="1" strokeDasharray="4 4"
          />
        ))}

        <path d={fill} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {hoverIdx !== null && (
          <line
            x1={pts[hoverIdx][0]} y1={padY}
            x2={pts[hoverIdx][0]} y2={H - padY}
            stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
          />
        )}

        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y}
            r={hoverIdx === i ? 6 : (i === pts.length - 1 ? 5 : 3)}
            fill={hoverIdx === i || i === pts.length - 1 ? color : "none"}
            stroke={color} strokeWidth="2"
            style={{ transition: "r .1s ease" }}
          />
        ))}
      </svg>

      {hoverIdx !== null && tooltipPos && (
        <div style={{
          position: "fixed",
          left: tooltipPos.x,
          top: tooltipPos.y,
          transform: "translate(-50%, -115%)",
          background: "#0a1628",
          border: `1px solid ${color}44`,
          borderRadius: 10,
          padding: "7px 12px",
          pointerEvents: "none",
          zIndex: 9999,
          boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
          minWidth: 110,
          whiteSpace: "nowrap",
        }}>
          <div style={{
            position: "absolute", bottom: -6,
            left: `calc(50% + ${tooltipPos.arrow}px)`,
            transform: "translateX(-50%)",
            width: 10, height: 6, overflow: "hidden",
          }}>
            <div style={{
              width: 10, height: 10, background: "#0a1628",
              border: `1px solid ${color}44`,
              transform: "rotate(45deg) translate(-3px,-3px)",
            }} />
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: ".65rem", color: "#7a95c0", marginBottom: 3 }}>
            {DATE_LABELS[hoverIdx]}
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: ".82rem", fontWeight: 800, color: "#e8f0ff" }}>
            {fmtPrice(data[hoverIdx])}
          </div>
          {hoverIdx > 0 && (
            <div style={{
              fontSize: ".65rem", fontWeight: 700,
              color: data[hoverIdx] >= data[hoverIdx - 1] ? "#16a34a" : "#dc2626",
              marginTop: 2,
            }}>
              {data[hoverIdx] >= data[hoverIdx - 1] ? "▲" : "▼"}
              {" "}{fmtPrice(Math.abs(data[hoverIdx] - data[hoverIdx - 1]))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton blocks ────────────────────────────────────────────────────────
function Skel({ w, h, surface }: { w: string; h: number; surface: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: `linear-gradient(90deg,${surface} 25%,rgba(59,130,246,0.06) 50%,${surface} 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function TickerPage() {
  const params      = useParams();
  const ticker      = (params?.ticker as string ?? "").toUpperCase();
  const { isDark }  = useTheme();

  const [mounted, setMounted]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [stock, setStock]           = useState<StockDetail | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sideOpen, setSideOpen]     = useState(true);
  const [marketOpen, setMarketOpen] = useState(isNGXOpen());
  const [buyClicked, setBuyClicked] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isNGXOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch single stock detail from backend
  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setFetchError(null);
    fetch(`/api/stocks/${ticker}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json() as Promise<StockDetail>; })
      .then((d) => { setStock(d); setLoading(false); })
      .catch(() => { setFetchError("Could not load stock data."); setLoading(false); });
  }, [ticker]);

  if (!mounted) return null;

  const bg      = isDark ? "#070d1a" : "#f0f4ff";
  const surface = isDark ? "#0d1b35" : "#ffffff";
  const surfAlt = isDark ? "#111f3d" : "#f8faff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const text    = isDark ? "#e8f0ff" : "#0f172a";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const blue    = "#2563eb";
  const green   = "#16a34a";
  const red     = "#dc2626";

  const up = stock ? stock.change >= 0 : true;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: bg, minHeight: "100vh", display: "flex", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.2);border-radius:4px;}

        .main{flex:1;display:flex;flex-direction:column;min-height:100vh;min-width:0;overflow-x:hidden;transition:margin-left .3s cubic-bezier(.16,1,.3,1);}
        .main.with-nav{margin-left:240px;} .main.no-nav{margin-left:0;}
        .content{padding:24px 28px;flex:1;max-width:900px;width:100%;}

        .back-link{display:inline-flex;align-items:center;gap:6px;color:${muted};font-size:.8rem;font-weight:600;text-decoration:none;margin-bottom:22px;transition:color .18s ease;cursor:pointer;}
        .back-link:hover{color:${blue};}

        .hero{display:grid;grid-template-columns:1fr auto;align-items:flex-start;gap:20px;margin-bottom:28px;}
        .hero-sector{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${muted};margin-bottom:6px;}
        .hero-name{font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;color:${text};letter-spacing:-.02em;line-height:1.15;margin-bottom:4px;}
        .hero-sym{font-size:.8rem;color:${muted};font-weight:500;}
        .hero-price-row{display:flex;align-items:baseline;gap:10px;margin-top:14px;flex-wrap:wrap;}
        .hero-price{font-family:'Syne',sans-serif;font-size:2.4rem;font-weight:800;color:${text};letter-spacing:-.03em;line-height:1;}
        .hero-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:.78rem;font-weight:700;font-family:'Syne',sans-serif;}
        .badge-up{background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.2);color:${green};}
        .badge-dn{background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.15);color:${red};}

        .chart-card{background:${surface};border:1px solid ${border};border-radius:18px;padding:20px;margin-bottom:20px;overflow:hidden;}
        .chart-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${muted};margin-bottom:14px;}
        .chart-svg-wrap{width:100%;height:140px;}
        .chart-dates{display:flex;justify-content:space-between;margin-top:8px;}
        .chart-date{font-size:.62rem;color:${muted};}

        .stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;}
        .stat-card{background:${surface};border:1px solid ${border};border-radius:14px;padding:14px 16px;min-width:0;overflow:hidden;}
        .stat-label{font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:${muted};margin-bottom:5px;white-space:nowrap;}
        .stat-val{font-family:'Syne',sans-serif;font-size:.9rem;font-weight:800;color:${text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

        .about-card{background:${surface};border:1px solid ${border};border-radius:18px;padding:20px;margin-bottom:24px;}
        .about-title{font-family:'Syne',sans-serif;font-size:.85rem;font-weight:800;color:${text};margin-bottom:10px;letter-spacing:-.01em;}
        .about-text{font-size:.84rem;line-height:1.65;color:${muted};}

        .buy-wrap{position:sticky;bottom:80px;z-index:30;padding:0 0 8px;}
        .btn-row{display:flex;gap:8px;}
        .btn-compare{padding:11px 14px;border-radius:12px;border:1px solid ${border};cursor:pointer;background:${surfAlt};color:${text};font-family:'Syne',sans-serif;font-size:.8rem;font-weight:700;display:flex;align-items:center;gap:6px;transition:all .18s ease;white-space:nowrap;flex-shrink:0;}
        .btn-compare:hover{border-color:#2563eb;color:#2563eb;background:rgba(37,99,235,.05);}
        .btn-buy-main{flex:1;padding:11px 16px;border-radius:12px;border:none;cursor:pointer;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:white;font-family:'Syne',sans-serif;font-size:.85rem;font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s ease;box-shadow:0 6px 18px rgba(37,99,235,.35);}
        .btn-buy-main:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(37,99,235,.45);}
        .btn-buy-main:active{transform:translateY(0);}

        .error-msg{color:#dc2626;font-size:.85rem;text-align:center;padding:60px 20px;}
        .fade-in{animation:fadeIn .3s ease both;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}

        @media(min-width:769px){.stats-grid{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:768px){
          .main{margin-left:0!important;}
          .content{padding:14px 14px 100px;}
          .hero{grid-template-columns:1fr;}
          .hero-price{font-size:1.9rem;}
          .buy-wrap{bottom:70px;}
        }
      `}</style>

      <Sidenav active="Stocks" isOpen={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={`main ${sideOpen ? "with-nav" : "no-nav"}`}>
        <Topbar
          title={ticker || "Stock"}
          marketOpen={marketOpen}
          sideOpen={sideOpen}
          onMenuClick={() => setSideOpen(true)}
        />

        <div className="content">
          <a className="back-link" onClick={() => window.history.back()}>
            <HiOutlineArrowLeft size={14} /> All Stocks
          </a>

          {loading ? (
            <div className="fade-in">
              <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
                <Skel w="80px"  h={11} surface={surfAlt} />
                <Skel w="260px" h={22} surface={surfAlt} />
                <Skel w="120px" h={13} surface={surfAlt} />
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <Skel w="160px" h={40} surface={surfAlt} />
                  <Skel w="90px"  h={30} surface={surfAlt} />
                </div>
              </div>
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 18, padding: 20, marginBottom: 20 }}>
                <Skel w="80px" h={10} surface={surfAlt} />
                <div style={{ marginTop: 14 }}><Skel w="100%" h={140} surface={surfAlt} /></div>
              </div>
              <div className="stats-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
                    <Skel w="60%" h={9}  surface={surfAlt} />
                    <Skel w="80%" h={14} surface={surfAlt} />
                  </div>
                ))}
              </div>
            </div>

          ) : fetchError ? (
            <div className="error-msg">{fetchError}</div>

          ) : stock ? (
            <div className="fade-in">

              {/* Hero */}
              <div className="hero">
                <div className="hero-left">
                  <div className="hero-sector">{stock.sector} · NGX</div>
                  <div className="hero-name">{stock.name}</div>
                  <div className="hero-sym">{stock.symbol}</div>
                  <div className="hero-price-row">
                    <span className="hero-price">{fmtPrice(stock.price)}</span>
                    <span className={`hero-badge ${up ? "badge-up" : "badge-dn"}`}>
                      {up ? <HiTrendingUp size={13} /> : <HiTrendingDown size={13} />}
                      {up ? "+" : ""}{stock.changePct.toFixed(2)}%
                    </span>
                    <span style={{ fontSize: ".8rem", color: muted, fontWeight: 500 }}>
                      {up ? "+" : ""}{fmtPrice(Math.abs(stock.change))} today
                    </span>
                  </div>
                </div>
                <div style={{ paddingTop: 20 }}>
                  <Sparkline data={stock.chart} up={up} width={120} height={60} />
                </div>
              </div>

              {/* Interactive Chart */}
              <div className="chart-card">
                <div className="chart-label">7-Day Price History</div>
                <div className="chart-svg-wrap">
                  <InteractiveChart data={stock.chart} up={up} border={border} />
                </div>
                <div className="chart-dates">
                  {DATE_LABELS.map((d) => (
                    <span key={d} className="chart-date">{d}</span>
                  ))}
                </div>
              </div>

              {/* Stats grid */}
              <div className="stats-grid">
                {[
                  { label: "Open",       val: fmtPrice(stock.open)       },
                  { label: "Day High",   val: fmtPrice(stock.high)       },
                  { label: "Day Low",    val: fmtPrice(stock.low)        },
                  { label: "Volume",     val: fmtVol(stock.volume)       },
                  { label: "Market Cap", val: fmtVol(stock.marketCap)    },
                  { label: "52w High",   val: fmtPrice(stock.week52High) },
                  { label: "52w Low",    val: fmtPrice(stock.week52Low)  },
                  { label: "Sector",     val: stock.sector               },
                  { label: "Exchange",   val: "NGX"                      },
                ].map((s) => (
                  <div className="stat-card" key={s.label} title={s.val}>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-val">{s.val}</div>
                  </div>
                ))}
              </div>

              {/* About */}
              <div className="about-card">
                <div className="about-title">About {stock.name}</div>
                <p className="about-text">{stock.about}</p>
              </div>

              {/* Buy + Compare CTA */}
              <div className="buy-wrap">
                <div className="btn-row">
                  <button
                    className="btn-compare"
                    onClick={() => window.location.href = `/compare?a=${stock.symbol}`}
                  >
                    <HiOutlineSwitchHorizontal size={17} />
                    Compare
                  </button>
                  <button
                    className="btn-buy-main"
                    onClick={() => setBuyClicked(true)}
                  >
                    <RiEthLine size={20} />
                    {buyClicked ? "Connect Wallet to Continue" : `Buy ${stock.symbol} with ETH`}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ padding: "60px", textAlign: "center", color: muted }}>
              Stock not found.
            </div>
          )}
        </div>
      </div>

      <BottomNav active="Stocks" />
    </div>
  );
}
