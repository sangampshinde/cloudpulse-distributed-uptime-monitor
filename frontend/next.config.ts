import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DevOps Optimization: Produces a standalone server bundle for minimal Docker image size (~80MB vs 1GB+)
  output: "standalone",
  async rewrites() {
    const rawBackend = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:4000";
    const target = rawBackend.startsWith("http") ? rawBackend : `https://${rawBackend}`;
    const cleanTarget = target.replace(/\/api\/v1\/?$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${cleanTarget}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
