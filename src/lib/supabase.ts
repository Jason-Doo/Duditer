import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

let _client: ReturnType<typeof createBrowserClient> | null = null;

function getClient() {
    if (typeof window === 'undefined') {
        return {} as ReturnType<typeof createBrowserClient>;
    }
    if (!_client) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        // 진단용 로그 — 배포 후 브라우저 콘솔에서 확인
        console.log('[Supabase] env check:', {
            hasUrl: !!url,
            hasKey: !!key,
            urlPrefix: url?.substring(0, 20) ?? '(없음)',
        });
        if (!url || !key) {
            console.error('[Supabase] NEXT_PUBLIC 환경변수가 번들에 포함되지 않았습니다!');
            return {} as ReturnType<typeof createBrowserClient>;
        }
        _client = createBrowserClient(url, key);
    }
    return _client;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
    get(_, prop: string | symbol) {
        const client = getClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') return value.bind(client);
        return value;
    },
});
