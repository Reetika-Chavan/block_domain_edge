import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { computeHeaderSizeBreakdown } from "@/lib/header-size";

// Isolates the single-header-value limit (as opposed to the aggregate total
// header size the cookie and multi-header tests cover): each size in `?sizes=`
// becomes its own x-cf1004-proxy-N header, set on both the outgoing request
// (so /cf1004-test/proxy-check can report what origin actually received) and
// the response (so the browser can report what survived the round trip back
// out through nginx/Cloudflare).
const HEADER_PREFIX = "x-cf1004-proxy-";

function parseSizes(searchParams: URLSearchParams): number[] {
  const sizesParam = searchParams.get("sizes");
  if (!sizesParam) return [];
  return sizesParam
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function proxy(request: NextRequest) {
  // Runs on origin compute, after Launch's edge function (a separate
  // Cloudflare Worker deployment — see functions/[proxy].edge.js for that
  // "edge" checkpoint, which proxy has no way to reach into) and nginx have
  // already processed the request. This is the earliest point inside this
  // Next.js process itself, so it's the single place "origin" arrival gets
  // logged for every /cf1004-test/* request, instead of each route handler
  // logging it separately.
  console.log(JSON.stringify({
    checkpoint: "origin",
    stage: "pre-proxy",
    ...computeHeaderSizeBreakdown(request.headers),
  }));

  const sizes = parseSizes(request.nextUrl.searchParams);
  const testHeaders = sizes.map((bytes, i) => ({
    name: `${HEADER_PREFIX}${i}`,
    bytes,
  }));

  const requestHeaders = new Headers(request.headers);
  for (const { name, bytes } of testHeaders) {
    requestHeaders.set(name, "x".repeat(bytes));
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  for (const { name, bytes } of testHeaders) {
    response.headers.set(name, "x".repeat(bytes));
  }

  if (testHeaders.length > 0) {
    console.log(JSON.stringify({ checkpoint: "proxy", attempted: testHeaders }));
  }

  return response;
}

export const config = {
  matcher: ["/cf1004-test", "/cf1004-test/:path*"],
};
