import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Search used to live on the home route; keep old ?q= links working.
      {
        source: "/",
        has: [{ type: "query", key: "q" }],
        destination: "/search",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
