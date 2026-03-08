// app/api/compare/route.ts
//
// GET /api/compare               → symbols list + full stockMap (for picker)
// GET /api/compare?a=X&b=Y       → stockA, stockB, symbols

import { NextResponse } from "next/server";
import { getStockDetail, getCompareSymbols } from "@/backend/ticker";
import type { StockDetail } from "@/backend/ticker";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const a = searchParams.get("a");
    const b = searchParams.get("b");

    const symbols = await getCompareSymbols();

    // No params — return symbols + all stock details so the picker
    // can render names and change% immediately without a second round-trip.
    if (!a && !b) {
      const allStocks = await Promise.all(symbols.map((s) => getStockDetail(s)));
      const stockMap: Record<string, StockDetail> = Object.fromEntries(
        allStocks.map((s) => [s.symbol, s])
      );
      return NextResponse.json({ symbols, stockMap });
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
