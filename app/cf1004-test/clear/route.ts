import { NextRequest, NextResponse } from "next/server";

const COOKIE_PREFIX = "cf1004_";

export async function GET(request: NextRequest) {
  const existing = request.cookies.getAll().filter((c) => c.name.startsWith(COOKIE_PREFIX));
  const response = NextResponse.redirect(new URL("/cf1004-test", request.url));
  for (const cookie of existing) {
    response.cookies.delete(cookie.name);
  }
  return response;
}
