import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

nextConfig.turbopack = {
  root: process.cwd(),
};

export default nextConfig;
