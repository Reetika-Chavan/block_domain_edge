import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  console.log(JSON.stringify({ checkpoint: "proxy", attempted: testHeaders }));

  return response;
}

export const config = {
  matcher: "/cf1004-test/proxy-check",
};
