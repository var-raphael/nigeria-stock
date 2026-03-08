// app/api/stocks/[ticker]/route.ts
import { NextResponse } from "next/server";
import { getStockDetail } from "@/backend/ticker";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const data = await getStockDetail(ticker);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[ticker] failed to load:", err);
    return NextResponse.json(
      { error: "Failed to load stock data" },
      { status: 500 }
    );
  }
}
