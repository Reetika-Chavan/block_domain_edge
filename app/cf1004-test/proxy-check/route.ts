import { NextRequest, NextResponse } from "next/server";
import { computeHeaderSizeBreakdown } from "@/lib/header-size";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const breakdown = computeHeaderSizeBreakdown(request.headers);
  console.log(JSON.stringify({ checkpoint: "origin", route: "proxy-check", ...breakdown }));
  return NextResponse.json(breakdown);
}
