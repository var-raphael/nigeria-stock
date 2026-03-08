"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Sidenav from "@/components/Sidenav";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import {
  HiOutlineBell, HiOutlineShieldCheck,
  HiOutlineLogout, HiOutlineChevronRight, HiOutlineCheck,
  HiOutlineMoon, HiOutlineSun, HiOutlineGlobe,
} from "react-icons/hi";
import { RiEthLine } from "react-icons/ri";
import type { SettingsData, NotifPrefs, SecurityPrefs } from "@/backend/settings";
import { passwordAgeSummary } from "@/backend/settings";

// ── Helpers ────────────────────────────────────────────────────────────────
function isNGXOpen(): boolean {
  const wat = new Date(Date.now() + 60 * 60 * 1000);
  const h = wat.getUTCHours(), m = wat.getUTCMinutes(), day = wat.getUTCDay();
  return day >= 1 && day <= 5 && (h > 10 || (h === 10 && m >= 0)) && (h < 14 || (h === 14 && m <= 30));
}

// ── Toggle component ───────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 42, height: 24, borderRadius: 12, cursor: "pointer",
        background: on ? "#2563eb" : "rgba(100,116,139,0.25)",
        position: "relative", transition: "background .2s ease", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "white",
        transition: "left .2s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [sideOpen, setSideOpen]     = useState(true);
  const [marketOpen, setMarketOpen] = useState(isNGXOpen());
  const [data, setData]             = useState<SettingsData | null>(null);
  const [loading, setLoading]       = useState(true);

  // Local controlled state — seeded from API, then updated optimistically
  const [notifPrefs, setNotifPrefs]     = useState<NotifPrefs>({
    priceAlerts: true, tradeConfirmations: true, watchlistMoves: true,
    dividendAlerts: true, marketOpenClose: false, emailSummary: false,
  });
  const [twoFA, setTwoFA]           = useState(false);
  const [biometric, setBiometric]   = useState(true);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isNGXOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch settings from API and seed local state
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json() as Promise<SettingsData>)
      .then((d) => {
        setData(d);
        setNotifPrefs(d.notifPrefs);
        setTwoFA(d.securityPrefs.twoFA);
        setBiometric(d.securityPrefs.biometric);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Persist notif pref change to API
  const toggleNotif = (key: keyof NotifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifPrefs: { [key]: updated[key] } }),
    }).catch(() => {});
  };

  // Persist security pref change to API
  const toggleSecurity = (key: keyof SecurityPrefs, value: boolean) => {
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityKey: key, securityValue: value }),
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
  const red     = "#dc2626";

  const profile  = data?.profile;
  const security = data?.securityPrefs;

  // ── Sub-components ───────────────────────────────────────────────────────
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", color: muted, marginBottom: 8, paddingLeft: 2 }}>
        {title}
      </div>
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 18, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );

  const Row = ({
    icon, label, sublabel, right, danger = false, onClick, last = false,
  }: {
    icon: React.ReactNode; label: string; sublabel?: string;
    right?: React.ReactNode; danger?: boolean; onClick?: () => void; last?: boolean;
  }) => (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
        borderBottom: last ? "none" : `1px solid ${border}`,
        cursor: onClick ? "pointer" : "default", transition: "background .15s",
      }}
      onMouseEnter={(e) => onClick && ((e.currentTarget as HTMLDivElement).style.background = isDark ? "rgba(59,130,246,.04)" : "rgba(59,130,246,.03)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: danger ? "rgba(220,38,38,.08)" : "rgba(59,130,246,.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: danger ? red : blue,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: ".84rem", fontWeight: 600, color: danger ? red : text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
        {sublabel && <div style={{ fontSize: ".68rem", color: muted, marginTop: 2 }}>{sublabel}</div>}
      </div>
      {right ?? (onClick && <HiOutlineChevronRight size={16} color={muted} />)}
    </div>
  );

  // Skeleton for loading state
  const Skel = ({ w, h }: { w: string; h: number }) => (
    <div style={{ width: w, height: h, borderRadius: 8, background: `linear-gradient(90deg,${surfAlt} 25%,rgba(59,130,246,0.06) 50%,${surfAlt} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
  );

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: bg, minHeight: "100vh", display: "flex", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 4px; }

        .set-main { flex:1; display:flex; flex-direction:column; min-height:100vh; min-width:0; max-width:100%; overflow-x:hidden; transition:margin-left .3s cubic-bezier(.16,1,.3,1); }
        .set-main.with-nav { margin-left:240px; }
        .set-main.no-nav   { margin-left:0; }
        .set-content { padding:20px; flex:1; width:100%; max-width:600px; }

        .wallet-chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; background:rgba(59,130,246,.08); border:1px solid rgba(59,130,246,.15); font-size:.72rem; font-weight:600; color:${blue}; font-family:'DM Sans',sans-serif; }

        .fade-in { animation:fadeIn .3s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        @media(min-width:769px) { .set-content { padding:24px 28px; } }
        @media(max-width:768px) {
          .set-main { margin-left:0 !important; }
          .set-content { padding:14px 14px 90px; max-width:100%; }
        }
      `}</style>

      <Sidenav active="Settings" isOpen={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={`set-main ${sideOpen ? "with-nav" : "no-nav"}`}>
        <Topbar title="Settings" marketOpen={marketOpen} sideOpen={sideOpen} onMenuClick={() => setSideOpen(true)} />

        <div className="set-content">
          <div className="fade-in">

            {/* Profile card */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 20, padding: "20px 18px", marginBottom: 20 }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skel w="40%" h={14} />
                  <Skel w="55%" h={11} />
                  <Skel w="35%" h={24} />
                </div>
              ) : profile ? (
                <>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1rem", fontWeight: 800, color: text, marginBottom: 3 }}>{profile.name}</div>
                  <div style={{ fontSize: ".75rem", color: muted, marginBottom: 10 }}>{profile.email}</div>
                  <div className="wallet-chip">
                    <RiEthLine size={13} />
                    {profile.walletShort}
                  </div>
                </>
              ) : null}
            </div>

            {/* Appearance */}
            <Section title="Appearance">
              <Row
                icon={isDark ? <HiOutlineMoon size={17} /> : <HiOutlineSun size={17} />}
                label="Theme"
                sublabel={isDark ? "Dark mode is on" : "Light mode is on"}
                onClick={toggleTheme}
                right={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: ".72rem", color: muted }}>{isDark ? "Dark" : "Light"}</span>
                    <Toggle on={isDark} onToggle={toggleTheme} />
                  </div>
                }
              />
              <Row
                icon={<HiOutlineGlobe size={17} />}
                label="Region"
                sublabel={profile?.region ?? "Nigeria · NGN · WAT"}
                last
                right={
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: ".72rem", color: muted }}>{profile?.regionFlag ?? "🇳🇬"}</span>
                    <HiOutlineChevronRight size={15} color={muted} />
                  </div>
                }
                onClick={() => {}}
              />
            </Section>

            {/* Notifications */}
            <Section title="Notifications">
              <Row icon={<HiOutlineBell size={17} />} label="Price Alerts"         sublabel="Notify when stocks hit your target price"      right={<Toggle on={notifPrefs.priceAlerts}        onToggle={() => toggleNotif("priceAlerts")}        />} />
              <Row icon={<HiOutlineBell size={17} />} label="Trade Confirmations"  sublabel="Notify when a buy or sell order is executed"   right={<Toggle on={notifPrefs.tradeConfirmations} onToggle={() => toggleNotif("tradeConfirmations")} />} />
              <Row icon={<HiOutlineBell size={17} />} label="Watchlist Moves"      sublabel="Significant moves on stocks you are watching"  right={<Toggle on={notifPrefs.watchlistMoves}     onToggle={() => toggleNotif("watchlistMoves")}     />} />
              <Row icon={<HiOutlineBell size={17} />} label="Dividend Alerts"      sublabel="Announcements and payment confirmations"        right={<Toggle on={notifPrefs.dividendAlerts}     onToggle={() => toggleNotif("dividendAlerts")}     />} />
              <Row icon={<HiOutlineBell size={17} />} label="Market Open / Close"  sublabel="Daily NGX open and close alerts"               right={<Toggle on={notifPrefs.marketOpenClose}    onToggle={() => toggleNotif("marketOpenClose")}    />} />
              <Row icon={<HiOutlineBell size={17} />} label="Email Summary"        sublabel="Weekly portfolio summary delivered by email"   last right={<Toggle on={notifPrefs.emailSummary}       onToggle={() => toggleNotif("emailSummary")}       />} />
            </Section>

            {/* Security */}
            <Section title="Security">
              <Row
                icon={<HiOutlineShieldCheck size={17} />}
                label="Two-Factor Authentication"
                sublabel={twoFA ? "2FA is enabled" : "Add an extra layer of security"}
                right={<Toggle on={twoFA} onToggle={() => { setTwoFA((p) => !p); toggleSecurity("twoFA", !twoFA); }} />}
              />
              <Row
                icon={<HiOutlineShieldCheck size={17} />}
                label="Biometric Login"
                sublabel="Use Face ID or fingerprint to sign in"
                right={<Toggle on={biometric} onToggle={() => { setBiometric((p) => !p); toggleSecurity("biometric", !biometric); }} />}
              />
              <Row
                icon={<HiOutlineShieldCheck size={17} />}
                label="Change Password"
                sublabel={security ? passwordAgeSummary(security.lastPasswordChange) : "Last changed 3 months ago"}
                last
                onClick={() => {}}
              />
            </Section>

            {/* Connected Wallet */}
            <Section title="Connected Wallet">
              <Row
                icon={<RiEthLine size={17} />}
                label="MetaMask"
                sublabel={`${profile?.walletShort ?? "0x4f3a…e91b"} · Connected`}
                right={
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <HiOutlineCheck size={14} color="#16a34a" />
                    <span style={{ fontSize: ".7rem", color: "#16a34a", fontWeight: 600 }}>Active</span>
                  </div>
                }
              />
              <Row
                icon={<RiEthLine size={17} />}
                label="Disconnect Wallet"
                sublabel="Remove this wallet from your account"
                last
                onClick={() => {}}
              />
            </Section>

            {/* Account */}
            <Section title="Account">
              <Row
                icon={<HiOutlineLogout size={17} />}
                label="Sign Out"
                sublabel="You'll need to sign in again"
                onClick={() => {}}
              />
              <Row
                icon={<HiOutlineLogout size={17} />}
                label="Delete Account"
                sublabel="Permanently remove all your data"
                danger last
                onClick={() => {}}
              />
            </Section>

            {/* Version footer */}
            <div style={{ textAlign: "center", fontSize: ".66rem", color: muted, paddingBottom: 8 }}>
              NaijaStocks v{data?.appVersion ?? "1.0.0"} · Built on NGX + Ethereum
            </div>

          </div>
        </div>
      </div>

      <BottomNav active="Settings" />
    </div>
  );
}
