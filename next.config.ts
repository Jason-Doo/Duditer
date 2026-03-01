import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 강제 캐시 무효화를 위해 빌드마다 고유한 ID 생성
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
