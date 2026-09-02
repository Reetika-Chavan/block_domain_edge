import { NextRequest, NextResponse } from "next/server";

const COOKIE_PREFIX = "cf1004_";
const CHUNK_BYTES = 1000; // 1KB per cookie, so `kb` maps directly to cookie count

export async function GET(request: NextRequest) {
  const kb = Number(new URL(request.url).searchParams.get("kb") || "1");
  const existing = request.cookies.getAll().filter((c) => c.name.startsWith(COOKIE_PREFIX));

  const response = NextResponse.redirect(new URL("/cf1004-test", request.url));
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
