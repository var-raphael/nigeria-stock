// app/api/notifications/route.ts
//
// GET  /api/notifications          → full notifications list
// PATCH /api/notifications         → mark all as read
// PATCH /api/notifications?id=N   → mark single notification as read

import { NextResponse } from "next/server";
import { getNotificationsData, markNotifRead, markAllRead } from "@/backend/notifications";

export async function GET() {
  try {
    const data = await getNotificationsData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[notifications] GET failed:", err);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (idParam) {
      await markNotifRead(Number(idParam));
    } else {
      await markAllRead();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notifications] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
