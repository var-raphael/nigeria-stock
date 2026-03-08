// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardData } from "@/backend/dashboard";

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[dashboard] failed to load:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
