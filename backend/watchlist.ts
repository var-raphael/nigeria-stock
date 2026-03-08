// backend/watchlist.ts
//
// A watchlist entry = a symbol the user is watching + optional price alert thresholds.
// When real data is wired, only getWatchlistData() / addToWatchlist() / removeFromWatchlist()
// need to change — the page and API routes stay untouched.

import { getStockDetail, type StockDetail } from "@/backend/ticker";

export interface WatchlistEntry {
  symbol: string;
  addedAt: string;           // ISO date string
  alertAbove?: number;       // notify if price goes above this
  alertBelow?: number;       // notify if price goes below this
}

export interface WatchlistItem extends WatchlistEntry {
  stock: StockDetail;        // hydrated stock detail
}

export interface WatchlistData {
  items: WatchlistItem[];
}

// ── Mock persisted watchlist ───────────────────────────────────────────────
// Replace with db.watchlist.findMany({ where: { userId } }) when ready

const MOCK_WATCHLIST: WatchlistEntry[] = [
  { symbol: "MTNN",       addedAt: "2025-02-10T09:00:00Z", alertAbove: 800,  alertBelow: 700  },
  { symbol: "DANGCEM",    addedAt: "2025-02-12T10:30:00Z", alertAbove: 850                    },
  { symbol: "GTCO",       addedAt: "2025-02-15T11:00:00Z",                   alertBelow: 100  },
  { symbol: "BUAFOODS",   addedAt: "2025-02-18T09:45:00Z", alertAbove: 900,  alertBelow: 750  },
  { symbol: "ZENITHBANK", addedAt: "2025-02-20T10:00:00Z"                                     },
  { symbol: "ARADEL",     addedAt: "2025-02-22T14:00:00Z", alertAbove: 1200                   },
];

// ── Public API ─────────────────────────────────────────────────────────────

export async function getWatchlistData(): Promise<WatchlistData> {
  const items = await Promise.all(
    MOCK_WATCHLIST.map(async (entry) => ({
      ...entry,
      stock: await getStockDetail(entry.symbol),
    }))
  );
  return { items };
}

export async function addToWatchlist(symbol: string): Promise<void> {
  // TODO: await db.watchlist.create({ data: { userId, symbol, addedAt: new Date() } })
  const exists = MOCK_WATCHLIST.find((e) => e.symbol === symbol.toUpperCase());
  if (!exists) {
    MOCK_WATCHLIST.push({ symbol: symbol.toUpperCase(), addedAt: new Date().toISOString() });
  }
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  // TODO: await db.watchlist.delete({ where: { userId_symbol: { userId, symbol } } })
  const idx = MOCK_WATCHLIST.findIndex((e) => e.symbol === symbol.toUpperCase());
  if (idx !== -1) MOCK_WATCHLIST.splice(idx, 1);
}

export async function updateWatchlistAlert(
  symbol: string,
  alertAbove?: number,
  alertBelow?: number
): Promise<void> {
  // TODO: await db.watchlist.update({ where: { ... }, data: { alertAbove, alertBelow } })
  const entry = MOCK_WATCHLIST.find((e) => e.symbol === symbol.toUpperCase());
  if (entry) {
    entry.alertAbove = alertAbove;
    entry.alertBelow = alertBelow;
  }
}

export async function isOnWatchlist(symbol: string): Promise<boolean> {
  return MOCK_WATCHLIST.some((e) => e.symbol === symbol.toUpperCase());
}
