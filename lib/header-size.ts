const LAUNCH_HEADER_PREFIXES = ["x-launch-", "visitor-ip-"];

function isLaunchHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return LAUNCH_HEADER_PREFIXES.some((p) => lower.startsWith(p));
}

export interface HeaderSizeBreakdown {
  launchHeaderKB: number;
  applicationHeaderKB: number;
}

const toKB = (bytes: number) => Math.round((bytes / 1024) * 100) / 100;

// Mirrors the categorization in functions/[proxy].edge.js so both checkpoints'
// numbers are directly comparable: same "name: value\r\n" byte accounting, same
// launch/application split.
export function computeHeaderSizeBreakdown(headers: Headers): HeaderSizeBreakdown {
  let launchHeaderBytes = 0;
  let applicationHeaderBytes = 0;

  headers.forEach((value, name) => {
    const bytes = name.length + value.length + 4; // "name: value\r\n"
    if (isLaunchHeader(name)) {
      launchHeaderBytes += bytes;
    } else {
      applicationHeaderBytes += bytes;
    }
  });

  return {
    launchHeaderKB: toKB(launchHeaderBytes),
    applicationHeaderKB: toKB(applicationHeaderBytes),
  };
}
