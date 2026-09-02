const TEST_COOKIE_PREFIX = "cf1004_";
// Headers cf-worker itself injects before dispatching to this function (see
// injectGeoHeaders.ts / index.ts in contentfly-edge-service). This is the only
// "Launch-injected" overhead visible at this point — nginx's own IAM/signing
// headers (x-launch-customer-auth, x-launch-origin-auth, AWS SigV4 +
// x-amz-security-token, GCP identity JWT) are added on the hop from here to
// compute, *after* this function's fetch(request) call, so they never show up
// in this log.
const LAUNCH_HEADER_PREFIXES = ["x-launch-", "visitor-ip-"];
const CLOUDFLARE_HEADER_PREFIXES = ["cf-"];

function categorize(name) {
  const lower = name.toLowerCase();
  if (LAUNCH_HEADER_PREFIXES.some((p) => lower.startsWith(p))) return "launch";
  if (CLOUDFLARE_HEADER_PREFIXES.some((p) => lower.startsWith(p))) return "cloudflare";
  return "application";
}

const toKB = (bytes) => Math.round((bytes / 1024) * 100) / 100;

function computeHeaderSize(request) {
  let totalBytes = 0;
  const byCategory = { launch: 0, cloudflare: 0, application: 0 };
  const headerSizes = [];

  for (const [name, value] of request.headers.entries()) {
    const bytes = name.length + value.length + 4; // "name: value\r\n"
    totalBytes += bytes;
    const category = categorize(name);
    byCategory[category] += bytes;
    headerSizes.push({ name, bytes, category });
  }

  // The application's own Cookie header holds both real app cookies and our
  // synthetic cf1004_* filler; break it out so the filler (the thing being
  // sized to 7 KB for this test) is visible separately from genuine app data.
  const cookieHeader = request.headers.get("cookie") || "";
  let testCookieBytes = 0;
  let otherCookieBytes = 0;

  cookieHeader.split(";").forEach((pair, i) => {
    const trimmed = pair.trim();
    if (!trimmed) return;
    const bytes = trimmed.length + (i > 0 ? 2 : 0); // "; " separates pairs
    if (trimmed.startsWith(TEST_COOKIE_PREFIX)) {
      testCookieBytes += bytes;
    } else {
      otherCookieBytes += bytes;
    }
  });

  return {
    totalBytes,
    totalKB: toKB(totalBytes),
    launchHeaderBytes: byCategory.launch,
    launchHeaderKB: toKB(byCategory.launch),
    cloudflareHeaderBytes: byCategory.cloudflare,
    cloudflareHeaderKB: toKB(byCategory.cloudflare),
    applicationHeaderBytes: byCategory.application,
    applicationHeaderKB: toKB(byCategory.application),
    testCookieBytes,
    testCookieKB: toKB(testCookieBytes),
    otherCookieBytes,
    headerCount: headerSizes.length,
    headerSizes,
  };
}

export default function handler(request, _context) {
  const url = new URL(request.url);
  const size = computeHeaderSize(request);

  console.log(JSON.stringify({
    event: "cf1004_header_size",
    checkpoint: "before_edge_function",
    path: url.pathname,
    ...size,
  }));

  return fetch(request);
}
