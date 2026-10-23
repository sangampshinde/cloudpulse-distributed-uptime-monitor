import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DevOps Optimization: Produces a standalone server bundle for minimal Docker image size (~80MB vs 1GB+)
  output: "standalone",
};

export default nextConfig;
