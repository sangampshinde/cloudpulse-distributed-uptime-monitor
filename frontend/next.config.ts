import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DevOps Optimization: Produces a standalone server bundle for minimal Docker image size (~80MB vs 1GB+)
  output: "standalone",
  async rewrites() {
    const raw = (
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      "http://localhost:4000"
    ).trim();

    let target = raw;
    if (target.startsWith("http://") || target.startsWith("https://")) {
      try {
        const parsed = new URL(target);
        if (!parsed.port && !parsed.hostname.includes(".")) {
          parsed.port = "4000";
          target = parsed.origin;
        }
      } catch {}
    } else {
      if (!target.includes(".") || target.endsWith(".internal")) {
        target = target.includes(":") ? `http://${target}` : `http://${target}:4000`;
      } else {
        target = `https://${target}`;
      }
    }

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
