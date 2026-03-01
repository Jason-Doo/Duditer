import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

// Singleton — 브라우저 환경에서만 실제 클라이언트 생성
// SSR/빌드 시에는 stub 반환 (크래시 방지)
let _client: ReturnType<typeof createBrowserClient> | null = null;

function getClient() {
    if (typeof window === 'undefined') {
        // SSR 중에는 stub 반환 (실제 호출되면 안 됨)
        return {} as ReturnType<typeof createBrowserClient>;
    }
    if (!_client) _client = createClient();
    return _client;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
    get(_, prop: string | symbol) {
        const client = getClient();
        const value = (client as any)[prop];
        // 메서드인 경우 올바른 this 바인딩 유지
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});
