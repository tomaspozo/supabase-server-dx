import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: ["@supabase/edge-functions"],
};

export default nextConfig;
