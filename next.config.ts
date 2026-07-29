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
    ];
  },
};

export default nextConfig;
