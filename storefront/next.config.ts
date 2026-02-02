import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Bật chế độ Standalone để tối ưu cho Docker (Sửa lỗi copy file) */
  output: "standalone", 

  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/uploads/**",
      },
    ],
  },
  
  env: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  },
};

export default nextConfig;