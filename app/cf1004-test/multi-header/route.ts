import { NextRequest, NextResponse } from "next/server";
import { computeHeaderSizeBreakdown } from "@/lib/header-size";

export const dynamic = "force-dynamic";

// The "origin" checkpoint for this route is logged by proxy.ts, which runs
// before this handler on every /cf1004-test/* request — see proxy.ts.
export async function GET(request: NextRequest) {
  const breakdown = computeHeaderSizeBreakdown(request.headers);
  return NextResponse.json(breakdown);
}
