import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 uses native bindings — must not be bundled
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
