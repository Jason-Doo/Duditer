import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { MODELS } from '@/lib/default_prompts';

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
        const { characterImageUrl, outfitImageUrl, systemPrompt } = await request.json();

        console.log('[fitting/generate] characterImageUrl:', characterImageUrl);
        console.log('[fitting/generate] outfitImageUrl:', outfitImageUrl);
        console.log('[fitting/generate] prompt:', systemPrompt?.slice(0, 100));

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('여기에')) {
            return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
        }

        if (!characterImageUrl) {
            return NextResponse.json({ error: '캐릭터 이미지 URL이 없습니다.' }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = systemPrompt || '이미지 1번 캐릭터에게 이미지 2번 의상을 입혀주세요.';

        // Fetch images as base64
        const characterImage = await fetchImageAsBase64(characterImageUrl);
        const contents: any[] = [
            { text: prompt },
            { inlineData: { mimeType: characterImage.mimeType, data: characterImage.data } }
        ];

        if (outfitImageUrl) {
            const outfitImage = await fetchImageAsBase64(outfitImageUrl);
            contents.push({ inlineData: { mimeType: outfitImage.mimeType, data: outfitImage.data } });
        }

        console.log('[fitting/generate] Calling Gemini API...');
        const response = await ai.models.generateContent({
            model: MODELS.fitting_generate,
            contents,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: { aspectRatio: '1:1' },
            },
        });
        console.log('[fitting/generate] Gemini response received');

        // Extract image from response
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if ((part as any).inlineData) {
                const imageData = (part as any).inlineData.data;
                const mimeType = (part as any).inlineData.mimeType || 'image/png';
                console.log('[fitting/generate] Image generated, mimeType:', mimeType);
                return NextResponse.json({ imageBase64: imageData, mimeType });
            }
        }

        // Log full response if no image found
        console.error('[fitting/generate] No image in response:', JSON.stringify(response.candidates?.[0]?.content?.parts?.map((p: any) => ({ text: p.text?.slice(0, 100) })) || []));
        return NextResponse.json({ error: '이미지 생성에 실패했습니다. 응답에 이미지가 없습니다.' }, { status: 500 });

    } catch (error: any) {
        const msg = toMessage(error);
        console.error('[fitting/generate] Error:', msg, error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
