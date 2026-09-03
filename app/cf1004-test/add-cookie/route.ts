import { NextRequest, NextResponse } from "next/server";

const COOKIE_PREFIX = "cf1004_";
const CHUNK_BYTES = 1000; // 1KB per cookie
const DEFAULT_TARGET_KB = 5.0;

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

  const requestedKB = Number(request.nextUrl.searchParams.get("kb"));
  const targetKB =
    Number.isFinite(requestedKB) && requestedKB > 0
      ? requestedKB
      : DEFAULT_TARGET_KB;
  const totalFillerBytes = Math.round(targetKB * 1000);

  const response = NextResponse.redirect(
    new URL("/cf1004-test", publicOrigin(request)),
  );
  for (const cookie of existing) {
    response.cookies.delete(cookie.name);
  }
  let remainingBytes = totalFillerBytes;
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
