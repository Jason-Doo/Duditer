import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Skip middleware entirely if env vars are not available (e.g., during build or misconfiguration)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.next();
    }

    try {
        let response = NextResponse.next({
            request: { headers: request.headers },
        });

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urikflimxxkeorhyfoku.supabase.co';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaWtmbGlteHhrZW9yaHlmb2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzM2MzksImV4cCI6MjA4Nzg0OTYzOX0.twyolTg19YwW9k_8b2-PF7VVFc7LcQlxBEqSXAC5Jhg';

        const supabase = createServerClient(
            url,
            key,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({ name, value, ...options });
                        response = NextResponse.next({ request: { headers: request.headers } });
                        response.cookies.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({ name, value: '', ...options });
                        response = NextResponse.next({ request: { headers: request.headers } });
                        response.cookies.set({ name, value: '', ...options });
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth');

        if (!user && !isAuthPage) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (user && isAuthPage) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return response;
    } catch (error) {
        console.error('[Middleware] Error:', error);
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
