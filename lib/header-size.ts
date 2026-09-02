export const TEST_COOKIE_PREFIX = "cf1004_";

const LAUNCH_HEADER_PREFIXES = ["x-launch-", "visitor-ip-"];
const CLOUDFLARE_HEADER_PREFIXES = ["cf-"];

type HeaderCategory = "launch" | "cloudflare" | "application";

function categorize(name: string): HeaderCategory {
  const lower = name.toLowerCase();
  if (LAUNCH_HEADER_PREFIXES.some((p) => lower.startsWith(p))) return "launch";
  if (CLOUDFLARE_HEADER_PREFIXES.some((p) => lower.startsWith(p))) return "cloudflare";
  return "application";
}

const toKB = (bytes: number) => Math.round((bytes / 1024) * 100) / 100;

export interface HeaderSizeBreakdown {
  totalBytes: number;
  totalKB: number;
  launchHeaderBytes: number;
  launchHeaderKB: number;
  cloudflareHeaderBytes: number;
  cloudflareHeaderKB: number;
  applicationHeaderBytes: number;
  applicationHeaderKB: number;
  testCookieBytes: number;
  testCookieKB: number;
  otherCookieBytes: number;
  headerCount: number;
}

// Mirrors the categorization in functions/[proxy].edge.js so the two checkpoints'
// numbers are directly comparable: same "name: value\r\n" byte accounting, same
// launch/cloudflare/application split, same cf1004_* filler-cookie isolation.
export function computeHeaderSizeBreakdown(headers: Headers): HeaderSizeBreakdown {
  let totalBytes = 0;
  const byCategory = { launch: 0, cloudflare: 0, application: 0 };
  let headerCount = 0;

  headers.forEach((value, name) => {
    const bytes = name.length + value.length + 4; // "name: value\r\n"
    totalBytes += bytes;
    byCategory[categorize(name)] += bytes;
    headerCount += 1;
  });

  const cookieHeader = headers.get("cookie") ?? "";
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
    headerCount,
  };
}
