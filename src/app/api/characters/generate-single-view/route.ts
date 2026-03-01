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

function toMessage(err: any): string {
    if (!err) return '알 수 없는 오류';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    try { return JSON.stringify(err); } catch { return String(err); }
}

const ANGLE_LABEL: Record<string, string> = {
    left: '완전한 좌측면',
    right: '완전한 우측면',
    back: '완전한 뒷모습',
};

export async function POST(request: NextRequest) {
    try {
        const { frontViewUrl, angle, requiredElements, characterId } = await request.json();

        if (!frontViewUrl) {
            return NextResponse.json({ error: '정면 이미지 URL이 없습니다.' }, { status: 400 });
        }
        if (!angle || !['left', 'right', 'back'].includes(angle)) {
            return NextResponse.json({ error: '유효하지 않은 각도입니다. (left|right|back)' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('여기에')) {
            return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Fetch single-view prompt from DB, fall back to default
        let basePrompt = DEFAULT_PROMPTS.character_side_single_prompt;
        try {
            const { data: settingRow } = await supabase
                .from('ai_settings')
                .select('character_side_single_prompt')
                .eq('id', 'default')
                .maybeSingle();
            if (settingRow?.character_side_single_prompt) {
                basePrompt = settingRow.character_side_single_prompt;
            }
        } catch {
            // ai_settings row may not exist — use hardcoded default
        }

        // Build prompt — replace <각도> with Korean label, keep <이미지1> as positional hint
        let prompt = basePrompt.replace('<각도>', ANGLE_LABEL[angle] || angle);

        // Append required elements clause if provided
        if (requiredElements && requiredElements.trim()) {
            prompt += ` 모든 캐릭터 이미지에 ${requiredElements.trim()} 는 꼭 있어야해.`;
        }

        console.log(`[characters/generate-single-view] angle=${angle}, prompt:`, prompt.slice(0, 200));

        const ai = new GoogleGenAI({ apiKey });
        const frontImage = await fetchImageAsBase64(frontViewUrl);

        const response = await ai.models.generateContent({
            model: MODELS.character_single_view,
            contents: [
                { text: prompt },
                { inlineData: { mimeType: frontImage.mimeType, data: frontImage.data } },
            ],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: { aspectRatio: '1:1' },
            },
        });

        console.log(`[characters/generate-single-view] Response received for angle=${angle}`);

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if ((part as any).inlineData) {
                const imageData = (part as any).inlineData.data;
                const mimeType = (part as any).inlineData.mimeType || 'image/png';

                const ext = mimeType === 'image/png' ? 'png' : 'jpg';
                const storagePath = characterId
                    ? `${characterId}/${angle}_view.${ext}`
                    : `temp/${Date.now()}_${angle}.${ext}`;

                const imageBuffer = Buffer.from(imageData, 'base64');
                const { error: uploadError } = await supabase.storage
                    .from('characters')
                    .upload(storagePath, imageBuffer, { contentType: mimeType, upsert: true });

                if (uploadError) {
                    console.error(`[characters/generate-single-view] Storage upload error:`, uploadError);
                    return NextResponse.json({ imageBase64: imageData, mimeType, publicUrl: null });
                }

                const { data: { publicUrl } } = supabase.storage.from('characters').getPublicUrl(storagePath);
                return NextResponse.json({ angle, publicUrl });
            }
        }

        return NextResponse.json({ error: '이미지 생성에 실패했습니다. 응답에 이미지가 없습니다.' }, { status: 500 });

    } catch (error: any) {
        const msg = toMessage(error);
        console.error('[characters/generate-single-view] Error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
