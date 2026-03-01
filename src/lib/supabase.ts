import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

// Lazy singleton — 모듈 import 시 즉시 실행하지 않고 첫 접근 시 클라이언트 생성
// Vercel SSG 빌드 중 환경변수 없음 오류 방지
let _client: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
    get(_, prop: string | symbol) {
        if (!_client) _client = createClient();
        return Reflect.get(_client, prop, _client);
    },
});
