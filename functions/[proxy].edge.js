const LAUNCH_HEADER_PREFIXES = ["x-launch-", "visitor-ip-"];

function isLaunchHeader(name) {
  const lower = name.toLowerCase();
  return LAUNCH_HEADER_PREFIXES.some((p) => lower.startsWith(p));
}

function measureHeaderSize(headers) {
  let launchHeaderBytes = 0;
  let applicationHeaderBytes = 0;

  for (const [name, value] of headers.entries()) {
    const bytes = name.length + value.length + 4; // "name: value\r\n"
    if (isLaunchHeader(name)) {
      launchHeaderBytes += bytes;
    } else {
      applicationHeaderBytes += bytes;
    }
  }

  return { launchHeaderBytes, applicationHeaderBytes };
}

const toKB = (bytes) => Math.round((bytes / 1024) * 100) / 100;

export default function handler(request, _context) {
  const { launchHeaderBytes, applicationHeaderBytes } = measureHeaderSize(request.headers);

  console.log(JSON.stringify({
    checkpoint: "edge",
    applicationHeaderKB: toKB(applicationHeaderBytes),
    launchHeaderKB: toKB(launchHeaderBytes),
  }));

  return fetch(request);
}
