const LAUNCH_HEADER_PREFIXES = ["x-launch-", "visitor-ip-"];

function isLaunchHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return LAUNCH_HEADER_PREFIXES.some((p) => lower.startsWith(p));
}

export interface HeaderSizeBreakdown {
  totalKB: number;
  launchHeaderKB: number;
  applicationHeaderKB: number;
}

const toKB = (bytes: number) => Math.round((bytes / 1024) * 100) / 100;

// Mirrors the categorization in functions/[proxy].edge.js so the two checkpoints'
// numbers are directly comparable: same "name: value\r\n" byte accounting, same
// launch/application split.
export function computeHeaderSizeBreakdown(headers: Headers): HeaderSizeBreakdown {
  let totalBytes = 0;
  let launchHeaderBytes = 0;
  let applicationHeaderBytes = 0;

  headers.forEach((value, name) => {
    const bytes = name.length + value.length + 4; // "name: value\r\n"
    totalBytes += bytes;
    if (isLaunchHeader(name)) {
      launchHeaderBytes += bytes;
    } else {
      applicationHeaderBytes += bytes;
    }
  });

  return {
    totalKB: toKB(totalBytes),
    launchHeaderKB: toKB(launchHeaderBytes),
    applicationHeaderKB: toKB(applicationHeaderBytes),
  };
}
