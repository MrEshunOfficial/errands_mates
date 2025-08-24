import type { NextConfig } from "next";
// next.config.js
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  // API proxy for development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },

  // OR use this for environment-based configuration
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : process.env.NEXT_PUBLIC_BACKEND_URL,
  },
};

export default nextConfig;
