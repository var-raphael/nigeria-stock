// app/api/settings/route.ts
//
// GET   /api/settings              → full settings data
// PATCH /api/settings              → update notif prefs or security prefs
//   body: { notifPrefs?: Partial<NotifPrefs> }
//   body: { securityKey?: keyof SecurityPrefs, securityValue?: boolean }

import { NextResponse } from "next/server";
import {
  getSettingsData,
  updateNotifPrefs,
  updateSecurityPref,
  type NotifPrefs,
  type SecurityPrefs,
} from "@/backend/settings";

export async function GET() {
  try {
    const data = await getSettingsData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[settings] GET failed:", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json() as {
      notifPrefs?: Partial<NotifPrefs>;
      securityKey?: keyof SecurityPrefs;
      securityValue?: boolean;
    };

    if (body.notifPrefs) {
      await updateNotifPrefs(body.notifPrefs);
    }
    if (body.securityKey !== undefined && body.securityValue !== undefined) {
      await updateSecurityPref(body.securityKey, body.securityValue);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[settings] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
