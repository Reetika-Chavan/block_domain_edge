const LAUNCH_HEADER_PREFIXES = ["x-launch-", "visitor-ip-"];

function isLaunchHeader(name) {
  const lower = name.toLowerCase();
  return LAUNCH_HEADER_PREFIXES.some((p) => lower.startsWith(p));
}

const toKB = (bytes) => Math.round((bytes / 1024) * 100) / 100;

// Mirrors lib/header-size.ts so both checkpoints' numbers are directly
// comparable: same "name: value\r\n" byte accounting, same launch/application
// split, same per-header ranking.
function computeHeaderSizeBreakdown(headers) {
  let launchHeaderBytes = 0;
  let applicationHeaderBytes = 0;
  const entries = [];

  for (const [name, value] of headers.entries()) {
    const bytes = name.length + value.length + 4; // "name: value\r\n"
    entries.push({ name, bytes });
    if (isLaunchHeader(name)) {
      launchHeaderBytes += bytes;
    } else {
      applicationHeaderBytes += bytes;
    }
  }

  entries.sort((a, b) => b.bytes - a.bytes);

  return {
    launchHeaderKB: toKB(launchHeaderBytes),
    applicationHeaderKB: toKB(applicationHeaderBytes),
    totalHeaderKB: toKB(launchHeaderBytes + applicationHeaderBytes),
    largestHeader: entries[0] ?? null,
    headers: entries,
  };
}

export default function handler(request, _context) {
  console.log(JSON.stringify({ checkpoint: "edge", ...computeHeaderSizeBreakdown(request.headers) }));

  return fetch(request);
}
