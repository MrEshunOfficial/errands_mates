import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "images.pexels.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : process.env.NEXT_PUBLIC_BACKEND_URL,
  },
};

export default nextConfig;
