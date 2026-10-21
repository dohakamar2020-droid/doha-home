import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // التحقق من الشيفرة يتم عبر `npm run lint` و`npm run typecheck` في CI
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
