import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_PUBLIC_ 환경변수를 명시적으로 클라이언트 번들에 포함
  // Vercel에서 자동 감지가 안 될 때 이 방식으로 강제 포함
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};

export default nextConfig;
