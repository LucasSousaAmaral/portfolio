import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',          // gera a pasta "out"
  images: { unoptimized: true }, // evita Image Optimization no server
  trailingSlash: false,      // opcional
};

export default nextConfig;
