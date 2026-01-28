import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Fix for: Can't resolve 'fs' in ...
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
  // Ensure we can serve wasm files if they are in public or handled via CDN
};

export default nextConfig;
