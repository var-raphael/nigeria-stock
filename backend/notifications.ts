// backend/notifications.ts

export type NotifType = "price" | "trade" | "market" | "system" | "watchlist" | "dividend";

export interface Notif {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  symbol?: string;
  up?: boolean;
}

export interface NotificationsData {
  notifications: Notif[];
}

// ── Mock data ──────────────────────────────────────────────────────────────
// Covers every notification type a stockvel user would realistically receive:
//
//  price      — stock hit / crossed a price alert threshold
//  trade      — buy or sell order executed (ETH settlement)
//  market     — NGX open / close, trading halts, circuit breakers
//  system     — account, wallet, security, app events
//  watchlist  — significant moves on stocks the user is watching
//  dividend   — dividend announcements and payment confirmations
//
// Replace this array with a DB/API call inside getNotificationsData() when ready.

const MOCK_NOTIFICATIONS: Notif[] = [
  // ── Today ──────────────────────────────────────────────────────────────
  {
    id: 1,
    type: "market",
    title: "NGX Market Open",
    body: "The Nigerian Stock Exchange is now open for trading. 10:00 AM Nigeria time.",
    time: "Today, 10:00 AM",
    read: false,
  },
  {
    id: 2,
    type: "price",
    title: "MTNN hit your target",
    body: "MTN Nigeria crossed ₦780 — your alert target has been reached. The stock is up +4.0% today.",
    time: "Today, 9:52 AM",
    read: false,
    symbol: "MTNN",
    up: true,
  },
  {
    id: 3,
    type: "trade",
    title: "Buy Order Executed",
    body: "Bought 40 shares of MTNN at ₦740.00 · 0.0821 ETH. Settlement confirmed on-chain.",
    time: "Today, 9:31 AM",
    read: false,
    symbol: "MTNN",
    up: true,
  },
  {
    id: 4,
    type: "price",
    title: "AIRTELAFRI dropped",
    body: "Airtel Africa fell below ₦2,300 — currently trading at ₦2,270. High volume selloff detected.",
    time: "Today, 9:15 AM",
    read: false,
    symbol: "AIRTELAFRI",
    up: false,
  },
  {
    id: 5,
    type: "watchlist",
    title: "BUAFOODS surging",
    body: "BUA Foods is up +2.1% today on strong volume — one of your watchlist stocks. Now at ₦845.",
    time: "Today, 9:10 AM",
    read: false,
    symbol: "BUAFOODS",
    up: true,
  },

  // ── Yesterday / Feb 25 ─────────────────────────────────────────────────
  {
    id: 6,
    type: "trade",
    title: "Buy Order Executed",
    body: "Bought 200 shares of GTCO at ₦112.00 · 0.0490 ETH. Settlement confirmed on-chain.",
    time: "Feb 25, 9:44 AM",
    read: true,
    symbol: "GTCO",
    up: true,
  },
  {
    id: 7,
    type: "dividend",
    title: "GTCO Dividend Announced",
    body: "Guaranty Trust Holding declared an interim dividend of ₦1.50 per share. Record date: Mar 15.",
    time: "Feb 25, 8:00 AM",
    read: true,
    symbol: "GTCO",
    up: true,
  },
  {
    id: 8,
    type: "market",
    title: "NGX Market Closed",
    body: "The Nigerian Stock Exchange has closed for the day at 2:30 PM. ASI closed down -0.31%.",
    time: "Feb 25, 2:30 PM",
    read: true,
  },

  // ── Feb 24 ─────────────────────────────────────────────────────────────
  {
    id: 9,
    type: "system",
    title: "Wallet Connected",
    body: "Your MetaMask wallet 0x4f3a…e91b has been successfully linked to your account.",
    time: "Feb 24, 3:00 PM",
    read: true,
  },
  {
    id: 10,
    type: "watchlist",
    title: "DANGCEM unusual volume",
    body: "Dangote Cement is trading 3.2× its average daily volume. Price currently at ₦799.90.",
    time: "Feb 24, 11:45 AM",
    read: true,
    symbol: "DANGCEM",
    up: true,
  },
  {
    id: 11,
    type: "market",
    title: "Trading Halt — ACCESSCORP",
    body: "Access Holdings trading was temporarily halted by NGX pending a regulatory announcement. Now resumed.",
    time: "Feb 24, 10:30 AM",
    read: true,
    symbol: "ACCESSCORP",
    up: false,
  },

  // ── Feb 22 ─────────────────────────────────────────────────────────────
  {
    id: 12,
    type: "trade",
    title: "Sell Order Executed",
    body: "Sold 100 shares of ACCESSCORP at ₦26.10 · 0.0057 ETH. Net proceeds settled to wallet.",
    time: "Feb 22, 11:02 AM",
    read: true,
    symbol: "ACCESSCORP",
    up: false,
  },
  {
    id: 13,
    type: "price",
    title: "ZENITHBANK price alert",
    body: "Zenith Bank dropped below your ₦48.00 alert threshold — currently at ₦47.80.",
    time: "Feb 22, 10:05 AM",
    read: true,
    symbol: "ZENITHBANK",
    up: false,
  },

  // ── Feb 20 ─────────────────────────────────────────────────────────────
  {
    id: 14,
    type: "trade",
    title: "Buy Order Executed",
    body: "Bought 10 shares of DANGCEM at ₦758.00 · 0.0334 ETH. Settlement confirmed on-chain.",
    time: "Feb 20, 10:18 AM",
    read: true,
    symbol: "DANGCEM",
    up: true,
  },
  {
    id: 15,
    type: "dividend",
    title: "Dividend Payment Received",
    body: "₦9,600 dividend from MTNN (₦80/share × 120 shares) has been credited to your account.",
    time: "Feb 20, 9:00 AM",
    read: true,
    symbol: "MTNN",
    up: true,
  },

  // ── Feb 18 ─────────────────────────────────────────────────────────────
  {
    id: 16,
    type: "trade",
    title: "Buy Order Executed",
    body: "Bought 300 shares of ZENITHBANK at ₦41.50 · 0.0273 ETH. Settlement confirmed on-chain.",
    time: "Feb 18, 9:55 AM",
    read: true,
    symbol: "ZENITHBANK",
    up: true,
  },
  {
    id: 17,
    type: "system",
    title: "Security Reminder",
    body: "You haven't changed your password in 90 days. Consider updating it in Settings to keep your account secure.",
    time: "Feb 18, 8:00 AM",
    read: true,
  },

  // ── Feb 10 ─────────────────────────────────────────────────────────────
  {
    id: 18,
    type: "trade",
    title: "Buy Order Executed",
    body: "Bought 15 shares of AIRTELAFRI at ₦2,400.00 · 0.0800 ETH. Settlement confirmed on-chain.",
    time: "Feb 10, 10:42 AM",
    read: true,
    symbol: "AIRTELAFRI",
    up: true,
  },
  {
    id: 19,
    type: "system",
    title: "New Login Detected",
    body: "A new sign-in to your account was detected from Lagos, Nigeria. If this wasn't you, secure your account immediately.",
    time: "Feb 10, 8:15 AM",
    read: true,
  },
  {
    id: 20,
    type: "market",
    title: "Public Holiday — Market Closed",
    body: "NGX will be closed on Feb 12 for Democracy Day. Trading resumes Feb 13 at 10:00 AM.",
    time: "Feb 10, 7:00 AM",
    read: true,
  },
];

// ── Public API ─────────────────────────────────────────────────────────────
// Only this function changes when switching to real data.
// e.g. const notifs = await db.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })

export async function getNotificationsData(): Promise<NotificationsData> {
  return { notifications: MOCK_NOTIFICATIONS };
}

// Mark a single notification as read (stub — replace with DB update)
export async function markNotifRead(_id: number): Promise<void> {
  // await db.notification.update({ where: { id }, data: { read: true } })
}

// Mark all notifications as read (stub — replace with DB update)
export async function markAllRead(): Promise<void> {
  // await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
}
