import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = () => {
    // Vercel 배포 시 간혹 env가 늦게 주입되는 경우를 대비한 fallback
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || typeof window !== 'undefined' ? (window as any)?.__ENV?.NEXT_PUBLIC_SUPABASE_URL : '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || typeof window !== 'undefined' ? (window as any)?.__ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY : '';

    return createSupabaseClient(
        url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

let _client: ReturnType<typeof createSupabaseClient> | null = null;

function getClient() {
    if (typeof window === 'undefined') {
        return {} as ReturnType<typeof createSupabaseClient>;
    }
    if (!_client) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        console.log('[Supabase JS] init:', { hasUrl: !!url, hasKey: !!key });
        _client = createClient() as any;
    }
    return _client;
}

export const supabase = new Proxy({} as any, {
    get(_, prop: string | symbol) {
        const client = getClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') return value.bind(client);
        return value;
    },
});
