import { NextRequest, NextResponse } from "next/server";

const COOKIE_PREFIX = "cf1004_";
const CHUNK_BYTES = 1000; // 1KB per cookie, so `kb` maps directly to cookie count

// request.url reflects the origin's internal address behind Launch's proxy, not
// the public domain the browser used, so redirects must be built from the
// forwarded host instead.
function publicOrigin(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const kb = Number(request.nextUrl.searchParams.get("kb") || "1");
  const existing = request.cookies.getAll().filter((c) => c.name.startsWith(COOKIE_PREFIX));

  const response = NextResponse.redirect(new URL("/cf1004-test", publicOrigin(request)));
  for (const cookie of existing) {
    response.cookies.delete(cookie.name);
  }
  const filler = "x".repeat(CHUNK_BYTES);
  for (let i = 0; i < kb; i++) {
    response.cookies.set(`${COOKIE_PREFIX}${i}`, filler, {
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
}
