const LAUNCH_HEADER_PREFIXES = ["x-launch-", "visitor-ip-"];

function isLaunchHeader(name) {
  const lower = name.toLowerCase();
  return LAUNCH_HEADER_PREFIXES.some((p) => lower.startsWith(p));
}

function measureHeaderSize(headers) {
  let totalBytes = 0;
  let launchHeaderBytes = 0;
  let applicationHeaderBytes = 0;

  for (const [name, value] of headers.entries()) {
    const bytes = name.length + value.length + 4; // "name: value\r\n"
    totalBytes += bytes;
    if (isLaunchHeader(name)) {
      launchHeaderBytes += bytes;
    } else {
      applicationHeaderBytes += bytes;
    }
  }

  return { totalBytes, launchHeaderBytes, applicationHeaderBytes };
}

const toKB = (bytes) => Math.round((bytes / 1024) * 100) / 100;

export default function handler(request, _context) {
  const url = new URL(request.url);
  const { totalBytes, launchHeaderBytes, applicationHeaderBytes } = measureHeaderSize(request.headers);

  console.log(JSON.stringify({
    event: "cf1004_header_size",
    checkpoint: "at_edge_function",
    path: url.pathname,
    totalKB: toKB(totalBytes),
    launchHeaderKB: toKB(launchHeaderBytes),
    applicationHeaderKB: toKB(applicationHeaderBytes),
  }));

  return fetch(request);
}
