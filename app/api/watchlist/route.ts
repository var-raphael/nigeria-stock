// app/api/watchlist/route.ts
//
// GET    /api/watchlist              → full watchlist with hydrated stock data
// POST   /api/watchlist              → add symbol  { symbol: string }
// DELETE /api/watchlist?symbol=MTNN → remove symbol
// PATCH  /api/watchlist              → update alert thresholds { symbol, alertAbove?, alertBelow? }

import { NextResponse } from "next/server";
import {
  getWatchlistData,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistAlert,
} from "@/backend/watchlist";

export async function GET() {
  try {
    const data = await getWatchlistData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[watchlist] GET failed:", err);
    return NextResponse.json({ error: "Failed to load watchlist" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { symbol } = await req.json() as { symbol: string };
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
    await addToWatchlist(symbol);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[watchlist] POST failed:", err);
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
    await removeFromWatchlist(symbol);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[watchlist] DELETE failed:", err);
    return NextResponse.json({ error: "Failed to remove from watchlist" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { symbol, alertAbove, alertBelow } = await req.json() as {
      symbol: string;
      alertAbove?: number;
      alertBelow?: number;
    };
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });
    await updateWatchlistAlert(symbol, alertAbove, alertBelow);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[watchlist] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
