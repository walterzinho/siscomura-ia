import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // "standalone" se usa solo para despliegues con Docker/Bun.
  // Vercel maneja su propio formato de build, así que se omite.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
