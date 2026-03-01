import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
    // Vercel 환경에서 env 주입이 실패할 경우를 대비한 최후의 fallback 하드코딩
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urikflimxxkeorhyfoku.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaWtmbGlteHhrZW9yaHlmb2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzM2MzksImV4cCI6MjA4Nzg0OTYzOX0.twyolTg19YwW9k_8b2-PF7VVFc7LcQlxBEqSXAC5Jhg';

    return createBrowserClient(url, key);
}

let _client: ReturnType<typeof createBrowserClient> | null = null;

function getClient() {
    if (typeof window === 'undefined') {
        return {} as ReturnType<typeof createBrowserClient>;
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
