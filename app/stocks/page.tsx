"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import Sidenav from "@/components/Sidenav";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import { HiOutlineSearch, HiTrendingUp, HiTrendingDown, HiOutlineSwitchHorizontal } from "react-icons/hi";
import { RiEthLine } from "react-icons/ri";
import type { Stock, Category, StocksData } from "@/backend/stocks";

// ── Constants ──────────────────────────────────────────────────────────────
const CATS: Category[]  = ["All", "Equities", "Bonds", "ETFs", "Suspended"];
const INITIAL_BATCH     = 15;
const MORE_BATCH        = 12;

// ── Nigeria market hours (UTC+1, Mon–Fri 10:00–14:30) ─────────────────────
function isNGXOpen(): boolean {
  const wat = new Date(Date.now() + 60 * 60 * 1000);
  const h   = wat.getUTCHours();
  const m   = wat.getUTCMinutes();
  const day = wat.getUTCDay();
  return day >= 1 && day <= 5 && (h > 10 || (h === 10 && m >= 0)) && (h < 14 || (h === 14 && m <= 30));
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtPrice(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cleanSymbol(sym: string) {
  return sym.replace(/\s*\[.*?\]/g, "");
}

// ── Mini sparkline ─────────────────────────────────────────────────────────
function seedChart(symbol: string, changePct: number): number[] {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (Math.imul(31, h) + symbol.charCodeAt(i)) | 0;
  const rng = () => { h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0; return ((h >>> 0) / 0xffffffff); };
  const pts: number[] = [100];
  for (let i = 1; i < 6; i++) pts.push(pts[i - 1] + (rng() - 0.5) * 3);
  pts.push(changePct >= 0 ? Math.max(...pts) * 1.005 : Math.min(...pts) * 0.995);
  return pts;
}

function MiniSparkline({ symbol, changePct }: { symbol: string; changePct: number }) {
  const data  = seedChart(symbol, changePct);
  const min   = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 56, H = 28, px = 2, py = 3;
  const pts = data.map((v, i) => [
    px + (i / (data.length - 1)) * (W - px * 2),
    py + (H - py * 2) - ((v - min) / range) * (H - py * 2),
  ] as [number, number]);
  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px2, py2] = pts[i - 1]; const cx = (px2 + x) / 2;
    return `${acc} C${cx} ${py2},${cx} ${y},${x} ${y}`;
  }, "");
  const fill  = `${path} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`;
  const color = changePct >= 0 ? "#16a34a" : "#dc2626";
  const gradId = `ms-${symbol.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={color} />
    </svg>
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────
function SkeletonRow({ surface, border }: { surface: string; border: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 64px 100px", padding: "14px", alignItems: "center", borderBottom: `1px solid ${border}`, gap: 8 }}>
      {[["60%", "38%"], ["55%"], ["45%", "30%"], ["100%"], ["80%"]].map((widths, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {widths.map((w, j) => (
            <div key={j} style={{
              height: j === 0 ? 13 : 9, width: w, borderRadius: 6,
              background: `linear-gradient(90deg, ${surface} 25%, rgba(59,130,246,0.06) 50%, ${surface} 75%)`,
              backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", border: `3px solid rgba(59,130,246,0.15)`, borderTopColor: color, animation: "spin 0.7s linear infinite" }} />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function StocksPage() {
  const { isDark } = useTheme();
  const [mounted, setMounted]               = useState(false);
  const [allStocks, setAllStocks]           = useState<Stock[]>([]);
  const [apiData, setApiData]               = useState<StocksData | null>(null);
  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebounced]     = useState("");
  const [category, setCategory]             = useState<Category>("All");
  const [stocks, setStocks]                 = useState<Stock[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore]       = useState(false);
  const [hasMore, setHasMore]               = useState(true);
  const [sideOpen, setSideOpen]             = useState(true);
  const [marketOpen, setMarketOpen]         = useState(isNGXOpen());
  const [fetchError, setFetchError]         = useState<string | null>(null);
  const loaderRef                           = useRef<HTMLDivElement>(null);
  const offsetRef                           = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isNGXOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch all stocks from backend once on mount
  useEffect(() => {
    fetch("/api/stocks")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json() as Promise<StocksData>; })
      .then((d) => { setApiData(d); setAllStocks(d.stocks); })
      .catch(() => { setFetchError("Could not load market data."); setInitialLoading(false); });
  }, []);

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Filter client-side (fast, data already in memory)
  const filteredSource = useMemo(() => allStocks.filter((s) => {
    const matchCat    = category === "All" || s.category === category;
    const matchSearch = s.symbol.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchCat && matchSearch;
  }), [allStocks, category, debouncedSearch]);

  // Paginate whenever filter changes
  useEffect(() => {
    if (allStocks.length === 0) return;
    setInitialLoading(true);
    setStocks([]);
    offsetRef.current = 0;
    // Small timeout to show skeleton while slicing
    const t = setTimeout(() => {
      const batch = filteredSource.slice(0, INITIAL_BATCH);
      setStocks(batch);
      offsetRef.current = batch.length;
      setHasMore(batch.length < filteredSource.length);
      setInitialLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [filteredSource, allStocks.length]);

  const handleCat = useCallback((c: Category) => setCategory(c), []);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loadingMore || initialLoading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          setTimeout(() => {
            const batch = filteredSource.slice(offsetRef.current, offsetRef.current + MORE_BATCH);
            setStocks((prev) => [...prev, ...batch]);
            offsetRef.current += batch.length;
            setHasMore(offsetRef.current < filteredSource.length);
            setLoadingMore(false);
          }, 400);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, initialLoading, filteredSource]);

  if (!mounted) return null;

  const bg      = isDark ? "#070d1a" : "#f0f4ff";
  const surface = isDark ? "#0d1b35" : "#ffffff";
  const surfAlt = isDark ? "#111f3d" : "#f8faff";
  const border  = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.1)";
  const text    = isDark ? "#e8f0ff" : "#0f172a";
  const muted   = isDark ? "#7a95c0" : "#64748b";
  const blue    = "#2563eb";
  const blueLt  = "#60a5fa";

  const summary = apiData?.summary;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: bg, minHeight: "100vh", display: "flex", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(59,130,246,0.2); border-radius:4px; }

        .main { flex:1; display:flex; flex-direction:column; min-height:100vh; min-width:0; overflow-x:hidden; transition:margin-left .3s cubic-bezier(.16,1,.3,1); }
        .main.with-nav { margin-left:240px; }
        .main.no-nav   { margin-left:0; }
        .content { padding:16px; flex:1; }

        .summary { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:18px; }
        .sum-card { background:${surface}; border:1px solid ${border}; border-radius:14px; padding:13px 14px; min-width:0; overflow:hidden; }
        .sum-label { font-size:.63rem; color:${muted}; text-transform:uppercase; letter-spacing:.07em; font-weight:600; margin-bottom:4px; }
        .sum-val { font-family:'Syne',sans-serif; font-size:1.05rem; font-weight:800; color:${text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sum-sub { font-size:.68rem; color:${muted}; margin-top:2px; }
        .sum-up { color:#16a34a; } .sum-dn { color:#dc2626; }

        .search-wrap { position:relative; margin-bottom:10px; }
        .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:${muted}; pointer-events:none; }
        .search-input { width:100%; padding:10px 12px 10px 38px; border-radius:12px; border:1px solid ${border}; background:${surfAlt}; color:${text}; font-family:'DM Sans',sans-serif; font-size:.875rem; outline:none; transition:all .18s ease; }
        .search-input::placeholder { color:${muted}; }
        .search-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.1); }

        .cats-wrap { overflow-x:auto; margin-bottom:14px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .cats-wrap::-webkit-scrollbar { display:none; }
        .cats { display:flex; gap:6px; width:max-content; }
        .cat-btn { padding:7px 14px; border-radius:10px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:.78rem; font-weight:600; border:1px solid ${border}; background:${surfAlt}; color:${muted}; transition:all .18s ease; white-space:nowrap; }
        .cat-btn:hover { border-color:#2563eb; color:#2563eb; }
        .cat-btn.active { background:#2563eb; border-color:#2563eb; color:white; }

        .table-wrap { background:${surface}; border:1px solid ${border}; border-radius:18px; overflow:hidden; }
        .table-header { display:grid; grid-template-columns:2fr 1.2fr 1fr 64px 100px; padding:10px 14px; background:${surfAlt}; border-bottom:1px solid ${border}; font-size:.64rem; font-weight:700; color:${muted}; text-transform:uppercase; letter-spacing:.08em; gap:8px; }
        .table-row { display:grid; grid-template-columns:2fr 1.2fr 1fr 64px 100px; padding:12px 14px; align-items:center; border-bottom:1px solid ${border}; transition:background .15s ease; gap:8px; }
        .table-row:last-child { border-bottom:none; }
        .table-row:hover { background:rgba(59,130,246,.04); }

        .stock-sym { font-family:'Syne',sans-serif; font-size:.84rem; font-weight:700; color:${text}; }
        .stock-cat { font-size:.58rem; font-weight:600; padding:2px 5px; border-radius:4px; margin-top:3px; background:rgba(59,130,246,.08); color:${blueLt}; display:inline-block; }
        .stock-price { font-family:'Syne',sans-serif; font-size:.86rem; font-weight:700; color:${text}; }
        .chg-cell { display:flex; flex-direction:column; gap:3px; }
        .chg-badge { display:inline-flex; align-items:center; gap:3px; padding:2px 6px; border-radius:6px; font-size:.72rem; font-weight:700; }
        .badge-up { background:rgba(22,163,74,.08); color:#16a34a; }
        .badge-dn { background:rgba(220,38,38,.06); color:#dc2626; }
        .chg-flat { color:${muted}; font-size:.76rem; font-weight:600; }

        .actions { display:flex; gap:4px; justify-content:flex-end; align-items:center; }
        .btn-see { padding:5px 7px; border-radius:7px; cursor:pointer; font-size:.63rem; font-weight:600; border:1px solid ${border}; background:transparent; color:${muted}; transition:all .18s ease; font-family:'DM Sans',sans-serif; white-space:nowrap; }
        .btn-see:hover { border-color:#2563eb; color:#2563eb; }
        .btn-cmp { padding:5px 7px; border-radius:7px; cursor:pointer; font-size:.63rem; font-weight:600; border:1px solid ${border}; background:transparent; color:${muted}; transition:all .18s ease; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:2px; }
        .btn-cmp:hover { border-color:#8b5cf6; color:#8b5cf6; }
        .btn-buy { padding:5px 8px; border-radius:7px; cursor:pointer; font-size:.63rem; font-weight:700; border:none; background:#2563eb; color:white; transition:all .18s ease; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:3px; }
        .btn-buy:hover { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 4px 12px rgba(37,99,235,.3); }
        .btn-buy:disabled { opacity:.4; cursor:not-allowed; transform:none; box-shadow:none; }
        .suspended-row { opacity:.5; }
        .end-msg { padding:14px; font-size:.72rem; color:${muted}; text-align:center; border-top:1px solid ${border}; }
        .error-msg { color:#dc2626; font-size:.85rem; text-align:center; padding:48px 20px; }

        @media(min-width:769px) {
          .summary { grid-template-columns:repeat(4,1fr); gap:14px; }
          .content { padding:24px 28px; }
        }
        @media(max-width:768px) {
          .main { margin-left:0 !important; }
          .content { padding:14px 14px 90px; }
          .table-header { display:none; }
          .table-row { grid-template-columns:1fr 64px auto; grid-template-rows:auto auto; gap:4px 8px; padding:12px 14px; }
          .table-row>*:nth-child(2) { grid-row:1; grid-column:2; text-align:right; }
          .table-row>*:nth-child(3) { grid-row:2; grid-column:1; }
          .table-row>*:nth-child(4) { display:none; }
          .actions { grid-row:2; grid-column:2 / span 2; justify-content:flex-end; }
        }

        .fade-in { animation:fadeIn .25s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
      `}</style>

      <Sidenav active="Stocks" isOpen={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={`main ${sideOpen ? "with-nav" : "no-nav"}`}>
        <Topbar title="NGX Market" marketOpen={marketOpen} sideOpen={sideOpen} onMenuClick={() => setSideOpen(true)} />

        <div className="content">

          {/* Summary cards — driven by backend summary */}
          <div className="summary">
            {[
              {
                label: "Total Stocks",
                val:   `${summary?.totalCount ?? "—"}`,
                sub:   "Listed on NGX",
              },
              {
                label: "Top Gainer",
                val:   summary?.topGainer.symbol ?? "—",
                sub:   summary ? `+${summary.topGainer.changePct.toFixed(2)}% today` : "",
                up:    true,
              },
              {
                label: "Top Loser",
                val:   summary?.topLoser.symbol ?? "—",
                sub:   summary ? `${summary.topLoser.changePct.toFixed(2)}% today` : "",
                dn:    true,
              },
              {
                label: "Market Status",
                val:   marketOpen ? "Open" : "Closed",
                sub:   marketOpen ? "Closes 14:30 Nigeria" : "Opens 10:00 Nigeria",
                up:    marketOpen,
              },
            ].map((s) => (
              <div className="sum-card" key={s.label}>
                <div className="sum-label">{s.label}</div>
                <div className={`sum-val ${s.up ? "sum-up" : s.dn ? "sum-dn" : ""}`}>{s.val}</div>
                <div className="sum-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="search-wrap">
            <HiOutlineSearch className="search-icon" size={16} />
            <input
              className="search-input"
              placeholder="Search stocks e.g. DANGCEM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category tabs */}
          <div className="cats-wrap">
            <div className="cats">
              {CATS.map((c) => (
                <button key={c} className={`cat-btn ${category === c ? "active" : ""}`} onClick={() => handleCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <div className="table-header">
              <span>Symbol</span>
              <span>Price</span>
              <span>Change</span>
              <span>7d</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {fetchError ? (
              <div className="error-msg">{fetchError}</div>
            ) : initialLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow key={i} surface={surfAlt} border={border} />
              ))
            ) : stocks.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: muted, fontSize: ".875rem" }}>
                No stocks found for &quot;{debouncedSearch}&quot;
              </div>
            ) : (
              stocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className={`table-row fade-in ${stock.category === "Suspended" ? "suspended-row" : ""}`}
                >
                  <div>
                    <div className="stock-sym">{cleanSymbol(stock.symbol)}</div>
                    <span className="stock-cat">{stock.category}</span>
                  </div>

                  <div className="stock-price">{fmtPrice(stock.price)}</div>

                  <div className="chg-cell">
                    {stock.change > 0
                      ? <span className="chg-badge badge-up"><HiTrendingUp size={11} />{stock.changePct.toFixed(2)}%</span>
                      : stock.change < 0
                      ? <span className="chg-badge badge-dn"><HiTrendingDown size={11} />{stock.changePct.toFixed(2)}%</span>
                      : <span className="chg-flat">—</span>
                    }
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    {stock.category !== "Suspended" && stock.change !== 0
                      ? <MiniSparkline symbol={stock.symbol} changePct={stock.changePct} />
                      : <span style={{ fontSize: ".6rem", color: muted }}>—</span>
                    }
                  </div>

                  <div className="actions">
                    <button className="btn-see" onClick={() => window.location.href = `/stocks/${cleanSymbol(stock.symbol)}`}>
                      View
                    </button>
                    <button
                      className="btn-cmp"
                      title="Compare this stock"
                      onClick={() => window.location.href = `/compare?a=${cleanSymbol(stock.symbol)}`}
                    >
                      <HiOutlineSwitchHorizontal size={11} />
                    </button>
                    <button
                      className="btn-buy"
                      disabled={stock.category === "Suspended"}
                      onClick={() => alert(`Buy ${stock.symbol}`)}
                    >
                      <RiEthLine size={11} />Buy
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Infinite scroll sentinel */}
            {!initialLoading && !fetchError && hasMore && (
              <div ref={loaderRef}>
                {loadingMore && <Spinner color={blue} />}
              </div>
            )}

            {/* End of list */}
            {!initialLoading && !fetchError && !hasMore && stocks.length > 0 && (
              <div className="end-msg">You&apos;ve seen all {filteredSource.length} stocks</div>
            )}
          </div>

        </div>
      </div>

      <BottomNav active="Stocks" />
    </div>
  );
}
