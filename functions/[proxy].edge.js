const BLOCKED_PATHS = [
  {
    hostname: "blockdomainedge.devcontentstackapps.com",
    pathname: "/contact",
  },
  {
    hostname: "blockdomainedge.devcontentstackapps.com",
    pathname: "/wp-content/uploads/2024/10/test-image-158x33.jpg",
  },
];

export default function handler(request, _context) {
  const { hostname, pathname } = new URL(request.url);

  const isBlocked = BLOCKED_PATHS.some(
    (rule) => rule.hostname === hostname && rule.pathname === pathname
  );

  if (isBlocked) {
    return new Response("403 Forbidden - This page has been blocked.", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return fetch(request);
}
