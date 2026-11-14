import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { applyBostaState } from "@/lib/shipping/bosta-sync";

export const dynamic = "force-dynamic";

function authorised(request: NextRequest) {
  const secret = process.env.BOSTA_WEBHOOK_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? request.nextUrl.searchParams.get("secret") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

type BostaWebhook = {
  _id?: string;
  trackingNumber?: string | number;
  state?: number | { code?: number; value?: string };
  businessReference?: string;
  cod?: number;
};

export async function POST(request: NextRequest) {
  if (!process.env.BOSTA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as BostaWebhook | null;
  const code = typeof body?.state === "number" ? body.state : body?.state?.code;
  if (!body?.businessReference || typeof code !== "number") {
    return NextResponse.json({ error: "Missing businessReference or state" }, { status: 400 });
  }

  const result = await applyBostaState(
    body.businessReference,
    {
      code,
      value: typeof body.state === "object" ? body.state.value : undefined,
      trackingNumber: body.trackingNumber !== undefined ? String(body.trackingNumber) : undefined,
      cod: body.cod,
    },
    "webhook",
  );
  // Bosta retries on non-2xx; unknown orders are acknowledged so they are not resent forever.
  return NextResponse.json(result);
}
