import { NextRequest, NextResponse } from "next/server";

const COOKIE_PREFIX = "cf1004_";
const CHUNK_BYTES = 1000; // 1KB per cookie
const TARGET_KB = 5.0;
const TOTAL_FILLER_BYTES = Math.round(TARGET_KB * 1000);

// request.url reflects the origin's internal address behind Launch's proxy, not
// the public domain the browser used, so redirects must be built from the
// forwarded host instead.
function publicOrigin(request: NextRequest) {
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const existing = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith(COOKIE_PREFIX));

  const response = NextResponse.redirect(
    new URL("/cf1004-test", publicOrigin(request)),
  );
  for (const cookie of existing) {
    response.cookies.delete(cookie.name);
  }
  let remainingBytes = TOTAL_FILLER_BYTES;
  let i = 0;
  while (remainingBytes > 0) {
    const chunkBytes = Math.min(CHUNK_BYTES, remainingBytes);
    response.cookies.set(`${COOKIE_PREFIX}${i}`, "x".repeat(chunkBytes), {
      path: "/",
      sameSite: "lax",
    });
    remainingBytes -= chunkBytes;
    i++;
  }
  return response;
}
