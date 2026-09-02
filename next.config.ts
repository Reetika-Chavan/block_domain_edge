import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "max-age=0, s-maxage=86400, stale-while-revalidate=60",
          },
        ],
      },
      {
        // Overrides the site-wide rule above for the CF1004 test flow: every hit
        // must reach origin fresh so at_edge_function/at_origin logs and the
        // real header-size result aren't masked by a cached response.
        source: "/cf1004-test/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
