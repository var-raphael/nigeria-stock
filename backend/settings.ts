// backend/settings.ts

export interface NotifPrefs {
  priceAlerts: boolean;
  tradeConfirmations: boolean;
  watchlistMoves: boolean;
  dividendAlerts: boolean;
  marketOpenClose: boolean;
  emailSummary: boolean;
}

export interface SecurityPrefs {
  twoFA: boolean;
  biometric: boolean;
  lastPasswordChange: string; // ISO date string
}

export interface UserProfile {
  name: string;
  email: string;
  walletAddress: string;  // full address — injected by wallet integration
  walletShort: string;    // truncated display e.g. 0x4f3a…e91b
  region: string;
  currency: string;
  timezone: string;
  regionFlag: string;
}

export interface SettingsData {
  profile: UserProfile;
  notifPrefs: NotifPrefs;
  securityPrefs: SecurityPrefs;
  appVersion: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────
// Replace inside getSettingsData() with DB/session lookups when ready.
// e.g. const user = await db.user.findUnique({ where: { id: session.userId } })

const MOCK_SETTINGS: SettingsData = {
  profile: {
    name:          "Adewale Okafor",
    email:         "adewale@gmail.com",
    walletAddress: "0x4f3a8c2d1b7e6f0a3c9d5e2b8f1a4c7e91b",
    walletShort:   "0x4f3a…e91b",
    region:        "Nigeria · NGN · WAT",
    currency:      "NGN",
    timezone:      "Africa/Lagos",
    regionFlag:    "🇳🇬",
  },
  notifPrefs: {
    priceAlerts:        true,
    tradeConfirmations: true,
    watchlistMoves:     true,
    dividendAlerts:     true,
    marketOpenClose:    false,
    emailSummary:       false,
  },
  securityPrefs: {
    twoFA:              false,
    biometric:          true,
    lastPasswordChange: "2024-11-10T00:00:00Z",
  },
  appVersion: "1.0.0",
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns how long ago the password was last changed as a human-readable string */
export function passwordAgeSummary(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
  if (days < 30)  return `Last changed ${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 365) return `Last changed ${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
  return `Last changed over a year ago`;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getSettingsData(): Promise<SettingsData> {
  return MOCK_SETTINGS;
}

// Stubs — replace with DB updates when ready
export async function updateNotifPrefs(_prefs: Partial<NotifPrefs>): Promise<void> {
  // await db.notifPrefs.update({ where: { userId }, data: prefs })
}

export async function updateSecurityPref(_key: keyof SecurityPrefs, _value: boolean): Promise<void> {
  // await db.securityPrefs.update({ where: { userId }, data: { [key]: value } })
}
