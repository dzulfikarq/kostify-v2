import type { NextConfig } from "next";

const apiInternal = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Same-origin proxy: browser talks to /api/v1/* on this origin, Next
    // forwards to the Go API. No CORS, cookies stay first-party.
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiInternal}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
