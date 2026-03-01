import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';
    const origin = requestUrl.origin;

    if (code) {
        try {
            const cookieStore = await cookies();
            const persist = cookieStore.get('sb-persist')?.value !== 'false'; // Default to true if not set

            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!url || !key) {
                console.error('[Supabase SSR] Auth callback failed: Missing env vars');
                return NextResponse.redirect(`${origin}/login?error=env_missing`);
            }

            const supabase = createServerClient(
                url,
                key,
                {
                    cookies: {
                        get(name: string) {
                            return cookieStore.get(name)?.value;
                        },
                        set(name: string, value: string, options: CookieOptions) {
                            // If not persisting, make auth cookies session-only
                            if (!persist && name.startsWith('sb-')) {
                                const { maxAge: _maxAge, expires: _expires, ...rest } = options;
                                cookieStore.set({ name, value, ...rest });
                            } else {
                                cookieStore.set({ name, value, ...options });
                            }
                        },
                        remove(name: string, options: CookieOptions) {
                            cookieStore.set({ name, value: '', ...options });
                        },
                    },
                }
            );

            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error) {
                // Cleanup the persist cookie
                cookieStore.delete('sb-persist');
                return NextResponse.redirect(`${origin}${next}`);
            }

            console.error('Auth error:', error);
        } catch (err) {
            console.error('Callback error:', err);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
