// app/api/stocks/route.ts
import { NextResponse } from "next/server";
import { getStocksData } from "@/backend/stocks";

export async function GET() {
  try {
    const data = await getStocksData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[stocks] failed to load:", err);
    return NextResponse.json(
      { error: "Failed to load stocks data" },
      { status: 500 }
    );
  }
}
