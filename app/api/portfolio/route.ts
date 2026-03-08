// app/api/portfolio/route.ts
import { NextResponse } from "next/server";
import { getPortfolioData } from "@/backend/portfolio";

export async function GET() {
  try {
    const data = await getPortfolioData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[portfolio] failed to load:", err);
    return NextResponse.json(
      { error: "Failed to load portfolio data" },
      { status: 500 }
    );
  }
}
