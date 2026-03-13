import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storefront-prod.nl.picnicinternational.com",
        pathname: "/static/images/**",
      },
      {
        protocol: "https",
        hostname: "storefront-prod.de.picnicinternational.com",
        pathname: "/static/images/**",
      },
    ],
  },
};

export default nextConfig;
