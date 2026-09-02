const TEST_COOKIE_PREFIX = "cf1004_";

function computeHeaderSize(request) {
  let totalBytes = 0;
  const headerSizes = [];

  for (const [name, value] of request.headers.entries()) {
    const bytes = name.length + value.length + 4; // "name: value\r\n"
    totalBytes += bytes;
    headerSizes.push({ name, bytes });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  let testCookieBytes = 0;
  let otherCookieBytes = 0;

  cookieHeader.split(";").forEach((pair) => {
    const trimmed = pair.trim();
    if (!trimmed) return;
    const bytes = trimmed.length + 2; // "; " separator
    if (trimmed.startsWith(TEST_COOKIE_PREFIX)) {
      testCookieBytes += bytes;
    } else {
      otherCookieBytes += bytes;
    }
  });

  return {
    totalBytes,
    testCookieBytes,
    // Everything besides our own cf1004_* test cookies: other cookies, auth
    // headers, and whatever the platform's own layers (CDN, IAM, etc.) added
    // before the request reached this function. Anything injected *after*
    // this function's fetch(request) call (e.g. IAM headers added on the hop
    // to origin) is not visible here.
    platformBytes: totalBytes - testCookieBytes,
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
    path: url.pathname,
    ...size,
  }));

  return fetch(request);
}
