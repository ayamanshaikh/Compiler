import type { NextConfig } from "next";

// Where the Spring Boot backend lives. Override in production with:
//   CODEVISTA_API_URL=https://compiler.example.com
// The frontend calls relative /api/* paths, which Next.js proxies here,
// avoiding CORS entirely in the common case.
const backendUrl =
  process.env.CODEVISTA_API_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;