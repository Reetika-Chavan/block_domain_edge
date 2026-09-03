import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The server has no way to observe what the browser actually received back
// in a response after it left this origin (nginx/Cloudflare could still
// strip or truncate headers on the way out) — so the browser posts what it
// saw here, purely to get that result into the same server log stream as
// the "proxy" and "origin" checkpoints instead of staying UI-only.
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log(JSON.stringify({ checkpoint: "response", ...body }));
  return NextResponse.json({ ok: true });
}
