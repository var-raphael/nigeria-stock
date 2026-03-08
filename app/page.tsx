"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";

export default function LandingPage() {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={isDark ? "dark" : ""} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #f0f4ff;
          transition: background 0.4s ease;
        }
        .dark .root { background: #070d1a; }

        /* Blobs */
        .mesh { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
        .blob {
          position: absolute; border-radius: 50%;
          filter: blur(90px); opacity: 0.3;
          animation: floatBlob 9s ease-in-out infinite alternate;
        }
        .dark .blob { opacity: 0.18; }
        .b1 { width: 520px; height: 520px; background: radial-gradient(circle, #3b82f6, #1d4ed8); top: -120px; left: -120px; animation-delay: 0s; }
        .b2 { width: 420px; height: 420px; background: radial-gradient(circle, #f59e0b, #d97706); bottom: -100px; right: -100px; animation-delay: 3s; }
        .b3 { width: 320px; height: 320px; background: radial-gradient(circle, #60a5fa, #2563eb); top: 35%; left: 55%; animation-delay: 6s; }

        @keyframes floatBlob {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(25px,-25px) scale(1.07); }
        }

        .grid {
          position: absolute; inset: 0; z-index: 1;
          background-image:
            linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px);
          background-size: 44px 44px;
        }

        /* Card */
        .card {
          position: relative; z-index: 10;
          width: 100%; max-width: 460px;
          margin: 1.5rem;
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 28px;
          padding: 52px 48px;
          box-shadow: 0 8px 40px rgba(37,99,235,0.09), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
          animation: slideUp 0.65s cubic-bezier(0.16,1,0.3,1) both;
        }
        .dark .card {
          background: rgba(8,18,42,0.85);
          border-color: rgba(59,130,246,0.14);
          box-shadow: 0 8px 56px rgba(0,0,0,0.45), inset 0 1px 0 rgba(59,130,246,0.1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(36px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 32px;
          animation: slideUp 0.6s 0.08s cubic-bezier(0.16,1,0.3,1) both;
        }
        .logo-box {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, #1d4ed8, #60a5fa);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(37,99,235,0.38);
        }
        .logo-box svg { width: 22px; height: 22px; color: white; }
        .logo-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem; font-weight: 800;
          color: #0f172a; letter-spacing: -0.02em;
        }
        .dark .logo-name { color: #e8f0ff; }
        .logo-name span { color: #2563eb; }

        /* Badge */
        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 8px;
          background: rgba(37,99,235,0.07);
          border: 1px solid rgba(37,99,235,0.14);
          font-size: 0.66rem; font-weight: 700;
          color: #2563eb; text-transform: uppercase;
          letter-spacing: 0.07em; margin-bottom: 12px;
          font-family: 'Syne', sans-serif;
        }
        .dark .badge { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.2); color: #60a5fa; }

        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #16a34a;
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(0.75); }
        }

        /* Heading */
        .hgroup {
          margin-bottom: 28px;
          animation: slideUp 0.6s 0.13s cubic-bezier(0.16,1,0.3,1) both;
        }
        .h1 {
          font-family: 'Syne', sans-serif;
          font-size: 1.9rem; font-weight: 800;
          color: #0b1628; letter-spacing: -0.03em;
          line-height: 1.18; margin-bottom: 10px;
        }
        .dark .h1 { color: #eef4ff; }
        .h1 .accent { color: #2563eb; }
        .sub {
          font-size: 0.88rem; color: #64748b;
          line-height: 1.6; font-weight: 400;
        }
        .dark .sub { color: #7a95c0; }

        /* Crypto pills */
        .crypto-row {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-bottom: 28px;
          animation: slideUp 0.6s 0.18s cubic-bezier(0.16,1,0.3,1) both;
        }
        .crypto-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 20px;
          background: rgba(245,158,11,0.07);
          border: 1px solid rgba(245,158,11,0.18);
          font-size: 0.72rem; font-weight: 600;
          color: #b45309;
          font-family: 'Syne', sans-serif;
        }
        .dark .crypto-pill { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2); color: #fbbf24; }
        .crypto-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* Stats */
        .stats {
          display: flex; gap: 0;
          margin-bottom: 28px;
          border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(59,130,246,0.11);
          animation: slideUp 0.6s 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
        .dark .stats { border-color: rgba(59,130,246,0.14); }
        .stat {
          flex: 1; padding: 13px 8px; text-align: center;
          background: rgba(59,130,246,0.03);
          border-right: 1px solid rgba(59,130,246,0.09);
        }
        .dark .stat { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.11); }
        .stat:last-child { border-right: none; }
        .stat-v {
          display: block;
          font-family: 'Syne', sans-serif;
          font-size: 1rem; font-weight: 800; color: #2563eb;
        }
        .stat-l {
          font-size: 0.63rem; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.07em; font-weight: 500;
        }

        /* Google btn */
        .gbtn {
          width: 100%; display: flex; align-items: center;
          justify-content: center; gap: 12px;
          padding: 15px 24px; border-radius: 16px;
          border: 1.5px solid rgba(59,130,246,0.18);
          background: white; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem; font-weight: 600; color: #1e3a8a;
          transition: all 0.22s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          animation: slideUp 0.6s 0.26s cubic-bezier(0.16,1,0.3,1) both;
        }
        .dark .gbtn {
          background: rgba(255,255,255,0.04);
          border-color: rgba(59,130,246,0.22); color: #c5d8ff;
        }
        .gbtn:hover {
          border-color: #2563eb; background: #eff6ff;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.16);
        }
        .dark .gbtn:hover { background: rgba(59,130,246,0.1); }
        .gbtn:active { transform: translateY(0); }
        .gicon { width: 20px; height: 20px; flex-shrink: 0; }

        /* Divider */
        .div-row {
          display: flex; align-items: center; gap: 12px;
          margin: 22px 0;
          animation: slideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        .div-line { flex:1; height:1px; background: rgba(59,130,246,0.1); }
        .dark .div-line { background: rgba(59,130,246,0.14); }
        .div-txt { font-size: 0.72rem; color: #94a3b8; white-space: nowrap; }

        /* Ticker */
        .ticker-wrap {
          overflow: hidden; border-radius: 12px;
          background: rgba(59,130,246,0.03);
          border: 1px solid rgba(59,130,246,0.09);
          padding: 11px 0;
          animation: slideUp 0.6s 0.34s cubic-bezier(0.16,1,0.3,1) both;
        }
        .dark .ticker-wrap { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.12); }
        .ticker-track {
          display: flex; gap: 28px;
          animation: scroll 22s linear infinite;
          width: max-content;
        }
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .tick { display: flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 0.72rem; font-weight: 500; }
        .tick-s { color: #2563eb; font-family: 'Syne', sans-serif; font-weight: 700; }
        .dark .tick-s { color: #60a5fa; }
        .tick-p { color: #475569; }
        .dark .tick-p { color: #7a95c0; }
        .tick-up { color: #16a34a; font-size: 0.65rem; }
        .tick-dn { color: #dc2626; font-size: 0.65rem; }

        /* Footer */
        .foot {
          margin-top: 18px; text-align: center;
          font-size: 0.71rem; color: #94a3b8; line-height: 1.55;
          animation: slideUp 0.6s 0.38s cubic-bezier(0.16,1,0.3,1) both;
        }
        .foot a { color: #2563eb; text-decoration: none; }
        .foot a:hover { text-decoration: underline; }

        /* Toggle fixed */
        .toggle-fixed {
          position: fixed; top: 20px; right: 20px; z-index: 100;
        }
      `}</style>

      <div className="toggle-fixed">
        <ThemeToggle />
      </div>

      <div className="root">
        <div className="mesh">
          <div className="blob b1" />
          <div className="blob b2" />
          <div className="blob b3" />
        </div>
        <div className="grid" />

        <div className="card">
          {/* Logo */}
          <div className="logo">
            <div className="logo-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <span className="logo-name">Naija<span>Stocks</span></span>
          </div>

          {/* Badge */}
          <div className="hgroup">
            <div className="badge"><span className="dot" /> NGX Live Market</div>
            <h1 className="h1">
              Buy Nigerian Stocks<br />
              with <span className="accent">Crypto</span>
            </h1>
            <p className="sub">
              Own real NGX-listed stocks, funded by crypto. No bank account needed.
              Access the Nigerian market from anywhere in the world.
            </p>
          </div>

          {/* Crypto accepted pill */}
          <div className="crypto-row">
            <div className="crypto-pill">
              <span className="crypto-dot" style={{ background: "#627eea" }} />
              Ethereum
            </div>
          </div>

          {/* Stats */}
          <div className="stats">
            {[
              { v: "200+", l: "Stocks" },
              { v: "NGX", l: "Exchange" },
              { v: "ETH", l: "Powered" },
              { v: "Live", l: "Prices" },
            ].map((s) => (
              <div className="stat" key={s.l}>
                <span className="stat-v">{s.v}</span>
                <span className="stat-l">{s.l}</span>
              </div>
            ))}
          </div>

          {/* Google Sign In */}
          <button className="gbtn" onClick={() => alert("Connect Supabase to enable Google Auth")}>
            <svg className="gicon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="div-row">
            <div className="div-line" />
            <span className="div-txt">live ngx market data</span>
            <div className="div-line" />
          </div>

          {/* Ticker */}
          <div className="ticker-wrap">
            <div className="ticker-track">
              {[
                { s: "DANGCEM", p: "₦799.90", c: "+0.16%", up: true },
                { s: "MTNN", p: "₦780.00", c: "+4.00%", up: true },
                { s: "GTCO", p: "₦118.00", c: "+1.20%", up: true },
                { s: "AIRTELAFRI", p: "₦2,270", c: "-0.50%", up: false },
                { s: "ACCESSCORP", p: "₦25.90", c: "+0.39%", up: true },
                { s: "BUAFOODS", p: "₦845.00", c: "+2.10%", up: true },
                { s: "ZENITHBANK", p: "₦48.50", c: "-0.20%", up: false },
                { s: "ARADEL", p: "₦1,094", c: "+1.50%", up: true },
                { s: "DANGCEM", p: "₦799.90", c: "+0.16%", up: true },
                { s: "MTNN", p: "₦780.00", c: "+4.00%", up: true },
                { s: "GTCO", p: "₦118.00", c: "+1.20%", up: true },
                { s: "AIRTELAFRI", p: "₦2,270", c: "-0.50%", up: false },
                { s: "ACCESSCORP", p: "₦25.90", c: "+0.39%", up: true },
                { s: "BUAFOODS", p: "₦845.00", c: "+2.10%", up: true },
                { s: "ZENITHBANK", p: "₦48.50", c: "-0.20%", up: false },
                { s: "ARADEL", p: "₦1,094", c: "+1.50%", up: true },
              ].map((t, i) => (
                <div className="tick" key={i}>
                  <span className="tick-s">{t.s}</span>
                  <span className="tick-p">{t.p}</span>
                  <span className={t.up ? "tick-up" : "tick-dn"}>{t.c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="foot">
            By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            <br />Market data by iTick · Stocks settled on NGX
          </p>
        </div>
      </div>
    </div>
  );
}
