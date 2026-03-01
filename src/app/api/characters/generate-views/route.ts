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

export async function POST(request: NextRequest) {
    try {
        const { frontViewUrl, requiredElements, characterId } = await request.json();

        if (!frontViewUrl) {
            return NextResponse.json({ error: '정면 이미지 URL이 없습니다.' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('여기에')) {
            return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
        }

        // Fetch prompt from DB — uses existing ai_settings table (id='default', col='character_side_prompt')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        let basePrompt = DEFAULT_PROMPTS.character_side_prompt;
        try {
            const { data: settingRow } = await supabase
                .from('ai_settings')
                .select('character_side_prompt')
                .eq('id', 'default')
                .maybeSingle();
            if (settingRow?.character_side_prompt) {
                basePrompt = settingRow.character_side_prompt;
            }
        } catch {
            // ai_settings row may not exist — use hardcoded default
        }

        // Build prompt — keep <이미지1> as-is (positional hint for the base64 inlineData below)
        let prompt = basePrompt;

        // Append required elements clause if provided
        if (requiredElements && requiredElements.trim()) {
            prompt += ` 모든 캐릭터 이미지에 ${requiredElements.trim()} 는 꼭 있어야해.`;
        }

        console.log('[characters/generate-views] prompt:', prompt.slice(0, 200));

        const ai = new GoogleGenAI({ apiKey });

        // Fetch front image as base64
        const frontImage = await fetchImageAsBase64(frontViewUrl);

        const response = await ai.models.generateContent({
            model: MODELS.character_side_views,
            contents: [
                { text: prompt },
                { inlineData: { mimeType: frontImage.mimeType, data: frontImage.data } },
            ],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: { aspectRatio: '1:1' },
            },
        });

        console.log('[characters/generate-views] Gemini response received');

        // Collect all images from response (expect 3: left, right, back)
        const images: Array<{ data: string; mimeType: string }> = [];
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if ((part as any).inlineData) {
                images.push({
                    data: (part as any).inlineData.data,
                    mimeType: (part as any).inlineData.mimeType || 'image/png',
                });
            }
        }

        if (images.length === 0) {
            console.error('[characters/generate-views] No images in response');
            return NextResponse.json({ error: '이미지 생성에 실패했습니다. 응답에 이미지가 없습니다.' }, { status: 500 });
        }

        // Upload each image to Supabase Storage (supabase client already defined above)
        const angles = ['left', 'right', 'back'] as const;
        const results: Record<string, string | null> = { left: null, right: null, back: null };

        for (let i = 0; i < Math.min(images.length, 3); i++) {
            const angle = angles[i];
            const img = images[i];
            const ext = img.mimeType === 'image/png' ? 'png' : 'jpg';
            const storagePath = characterId
                ? `${characterId}/${angle}_view.${ext}`
                : `temp/${Date.now()}_${angle}.${ext}`;

            const imageBuffer = Buffer.from(img.data, 'base64');
            const { error: uploadError } = await supabase.storage
                .from('characters')
                .upload(storagePath, imageBuffer, { contentType: img.mimeType, upsert: true });

            if (uploadError) {
                console.error(`[characters/generate-views] Storage upload error (${angle}):`, uploadError);
                // Return base64 as fallback
                results[angle] = `data:${img.mimeType};base64,${img.data}`;
                continue;
            }

            const { data: { publicUrl } } = supabase.storage.from('characters').getPublicUrl(storagePath);
            results[angle] = publicUrl;
        }

        return NextResponse.json({ sideViews: results, imageCount: images.length });

    } catch (error: any) {
        const msg = toMessage(error);
        console.error('[characters/generate-views] Error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
