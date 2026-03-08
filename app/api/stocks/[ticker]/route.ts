// app/api/stocks/[ticker]/route.ts
import { NextResponse } from "next/server";
import { getStockDetail } from "@/backend/ticker";

export async function GET(
  _req: Request,
  { params }: { params: { ticker: string } }
) {
  try {
    const data = await getStockDetail(params.ticker);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[ticker] failed to load:", err);
    return NextResponse.json(
      { error: "Failed to load stock data" },
      { status: 500 }
    );
  }
}
