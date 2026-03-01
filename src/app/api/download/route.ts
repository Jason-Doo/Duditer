import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    const filename = request.nextUrl.searchParams.get('filename') || 'download';

    if (!url) {
        return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });
    }

    // Supabase Storage URL만 허용 (보안)
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '');
    if (supabaseHost && !new URL(url).hostname.endsWith(supabaseHost)) {
        return NextResponse.json({ error: '허용되지 않은 URL입니다.' }, { status: 403 });
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`upstream ${res.status}`);

        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (err) {
        console.error('[api/download] error:', err);
        return NextResponse.json({ error: '다운로드 실패' }, { status: 500 });
    }
}
