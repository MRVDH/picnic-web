import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Search is the landing page for now (the Ontdek home at /discover is still a TODO).
      // Query params such as ?q= are carried along, which keeps old search links working.
      { source: "/", destination: "/search", permanent: false },
    ];
  },
};

export default nextConfig;
