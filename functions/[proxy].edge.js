export default function handler(request, _context) {
  const { hostname, pathname } = new URL(request.url);

  if (
    hostname === "blockdomainedge.devcontentstackapps.com" &&
    pathname === "/contact"
  ) {
    return new Response("403 Forbidden - This page has been blocked.", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return fetch(request);
}
