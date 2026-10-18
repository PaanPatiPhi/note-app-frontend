import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cloudflared tunnel for HMR
  allowedDevOrigins: ['widespread-distinction-guy-industry.trycloudflare.com'],
  // Use Turbopack with empty config (no webpack needed)
  turbopack: {},
  devIndicators: false,
};

export default nextConfig;
