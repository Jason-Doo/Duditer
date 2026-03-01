import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_PROMPTS, MODELS } from '@/lib/default_prompts';

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`이미지 다운로드 실패 (${url}): ${response.status}`);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { data: base64, mimeType: contentType.split(';')[0] };
}

function toMessage(err: unknown): string {
    if (!err) return '알 수 없는 오류';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null && 'message' in err) return String((err as { message: unknown }).message);
    try { return JSON.stringify(err); } catch { return String(err); }
}

/** 배열에서 최대 n개를 랜덤하게 뽑아 반환 */
function pickRandom<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

export async function POST(request: NextRequest) {
    try {
        const { gender, personality, attitude, animal, extraDescription } = await request.json() as {
            gender: string;
            personality: string[];
            attitude: string[];
            animal: string;
            extraDescription?: string;
        };

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('여기에')) {
            return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 1. 동일 성별 캐릭터 중 최대 2개 랜덤 선택
        const { data: chars } = await supabase
            .from('characters')
            .select('id, front_view_url')
            .eq('gender', gender)
            .not('front_view_url', 'is', null);

        const refs = pickRandom(chars ?? [], 2);

        // 2. 레퍼런스 이미지를 base64로 변환
        const refImages: Array<{ data: string; mimeType: string }> = [];
        for (const ch of refs) {
            try {
                if (ch.front_view_url) {
                    refImages.push(await fetchImageAsBase64(ch.front_view_url));
                }
            } catch (e) {
                console.warn('[generate-initial] 레퍼런스 이미지 로드 실패:', e);
            }
        }

        // 3. DB에서 프롬프트 템플릿 가져오기
        let promptTemplate = DEFAULT_PROMPTS.character_create_prompt;
        try {
            const { data: settingRow } = await supabase
                .from('ai_settings')
                .select('character_create_prompt')
                .eq('id', 'default')
                .maybeSingle();
            if (settingRow?.character_create_prompt) {
                promptTemplate = settingRow.character_create_prompt;
            }
        } catch {
            // ai_settings 없으면 기본값 사용
        }

        // 4. 프롬프트 파싱 (태그 치환)
        let prompt = promptTemplate
            .replace(/<성별>/g, gender)
            .replace(/<성격>/g, personality.join(', '))
            .replace(/<동물타입>/g, animal)
            .replace(/<태도>/g, attitude.join(', '));

        if (extraDescription?.trim()) {
            prompt += ` ${extraDescription.trim()}`;
        }

        console.log('[generate-initial] prompt:', prompt.slice(0, 300));
        console.log('[generate-initial] ref images:', refImages.length);

        // 5. Gemini 호출 (나노바나나2 = gemini-2.0-flash-preview-image-generation)
        const ai = new GoogleGenAI({ apiKey });

        const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
            { text: prompt },
        ];
        for (const img of refImages) {
            contentParts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        }

        const response = await ai.models.generateContent({
            model: MODELS.character_create,
            contents: contentParts,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        // 6. 응답에서 이미지 추출
        let imageData: { data: string; mimeType: string } | null = null;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if ((part as { inlineData?: { data: string; mimeType: string } }).inlineData) {
                const inlineData = (part as { inlineData: { data: string; mimeType: string } }).inlineData;
                imageData = { data: inlineData.data, mimeType: inlineData.mimeType || 'image/png' };
                break;
            }
        }

        if (!imageData) {
            return NextResponse.json({ error: '이미지 생성 실패: 응답에 이미지가 없습니다.' }, { status: 500 });
        }

        // 7. Supabase Storage에 업로드
        const ext = imageData.mimeType === 'image/png' ? 'png' : 'jpg';
        const storagePath = `temp/${Date.now()}_front.${ext}`;
        const imageBuffer = Buffer.from(imageData.data, 'base64');

        const { error: uploadError } = await supabase.storage
            .from('characters')
            .upload(storagePath, imageBuffer, { contentType: imageData.mimeType, upsert: true });

        let frontViewUrl: string;
        if (uploadError) {
            console.error('[generate-initial] Storage 업로드 실패:', uploadError);
            // fallback: base64 data URL 반환
            frontViewUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
        } else {
            const { data: { publicUrl } } = supabase.storage.from('characters').getPublicUrl(storagePath);
            frontViewUrl = publicUrl;
        }

        return NextResponse.json({ frontViewUrl });

    } catch (error: unknown) {
        const msg = toMessage(error);
        console.error('[generate-initial] Error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
