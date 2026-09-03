import { NextRequest, NextResponse } from "next/server";
import { computeHeaderSizeBreakdown } from "@/lib/header-size";

export const dynamic = "force-dynamic";

// Unlike other /cf1004-test/* routes, this one logs its own "origin" entry
// in addition to proxy.ts's — proxy.ts logs before injecting its test
// headers (stage: "pre-proxy"), this logs after (stage: "post-proxy"), so the
// two together show whether the injected headers survived proxy.ts's own
// NextResponse.next({ request: { headers } }) call intact.
export async function GET(request: NextRequest) {
  const breakdown = computeHeaderSizeBreakdown(request.headers);
  console.log(JSON.stringify({ checkpoint: "origin", stage: "post-proxy", ...breakdown }));
  return NextResponse.json(breakdown);
}
