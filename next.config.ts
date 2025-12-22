import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.stookboek.nl",
          },
        ],
        destination: "https://stookboek.nl/:path*",
        permanent: true, // 301 redirect
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "stook-boek.nl",
          },
        ],
        destination: "https://stookboek.nl/:path*",
        permanent: true, // 301 redirect
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.stook-boek.nl",
          },
        ],
        destination: "https://stookboek.nl/:path*",
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
