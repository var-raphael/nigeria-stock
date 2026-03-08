// app/api/compare/route.ts
//
// Usage: GET /api/compare?a=MTNN&b=DANGCEM
// Returns: { stockA: StockDetail, stockB: StockDetail, symbols: string[] }
//
// `symbols` is the full list of available tickers for the picker dropdown.

import { NextResponse } from "next/server";
import { getStockDetail, getCompareSymbols } from "@/backend/ticker";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const a = searchParams.get("a");
    const b = searchParams.get("b");

    const symbols = await getCompareSymbols();

    // If only symbols are needed (no a/b), return early
    if (!a && !b) {
      return NextResponse.json({ symbols });
    }

    const [stockA, stockB] = await Promise.all([
      a ? getStockDetail(a) : null,
      b ? getStockDetail(b) : null,
    ]);

    return NextResponse.json({ stockA, stockB, symbols });
  } catch (err) {
    console.error("[compare] failed to load:", err);
    return NextResponse.json(
      { error: "Failed to load compare data" },
      { status: 500 }
    );
  }
}
