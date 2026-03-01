// ─── Default Prompts ────────────────────────────────────────────────────────
// Single source of truth for all AI prompt default/reset values.
// These are used in:
//   - settings/page.tsx  → shown as default value in the settings UI
//   - API routes         → server-side fallback when DB has no saved value

export const DEFAULT_PROMPTS = {
    project_base_prompt: "You are a professional creative director and storyteller. When generating any content for this project, maintain a consistent tone, visual style, and narrative voice throughout all scenes and materials. Consider the project's overall theme and character relationships.",

    character_create_prompt: '첨부한 이미지들을 참고해서 옷을 입고있는 <성별>의 <성격> 성격을 갖고있는 <동물타입> 치비스타일 3D 애니메이션 캐릭터를 만들어줘. 표정과 외형에 표현되어야 하는 태도는 <태도> 이야. 정면 전신샷으로 만들고, 배경은 흰색으로 처리해줘.',

    character_side_prompt: '<이미지1>의 요소를 그대로 유지하면서, 각각 별개의 파일로 3가지 고해상도 이미지를 생성해줘. 완전한 좌측면 전신만 있는 흰색배경 처리된 이미지 파일 1개, 완전한 우측면 전신만 있는 흰색배경 처리된 이미지 파일 1개, 완전한 뒷모습 전신만 있는 흰색배경 처리된 이미지 파일 1개 총 3개의 이미지를 생성해야해.',

    character_side_single_prompt: '<이미지1>의 요소를 그대로 유지하면서, <각도> 전신 고해상도 이미지 1개를 생성해줘. 배경은 흰색으로 처리해줘.',

    fitting_system_prompt: '업로드한 이미지들을 참조해서 <이미지1>의 복장을 <이미지2>의 패션(<복장설명>)으로 변경해줘. 배경은 흰색으로 처리해줘. <제외옵션>',

    scenario_idea_prompt: "You are a creative story consultant. Given the user's genre and theme, generate 3 distinct, compelling story ideas with a one-line title and a 2-sentence synopsis each. Be concise and inspiring.",

    scenario_create_prompt: 'You are a professional screenwriter. Based on the provided story idea and characters, write a structured 3-act scenario with clear setup, conflict, and resolution. Include scene descriptions and key dialogue moments.',

    scene_create_prompt: 'Generate a cinematic, high-quality scene image based on the following description. The image should reflect the mood, lighting, and setting described. Aspect ratio 16:9.',

    video_create_prompt: 'Generate a smooth, cinematic video clip based on the scene description. The motion should be natural, the camera movement subtle (slight pan or zoom). Duration: 4-6 seconds. Maintain consistent art style throughout.',
} as const;

export type PromptKey = keyof typeof DEFAULT_PROMPTS;

// ─── Gemini Models ────────────────────────────────────────────────────────────
// 동작별 호출 모델을 한 곳에서 관리합니다.
export const MODELS = {
    /** 캐릭터 정면 이미지 최초 생성 */
    character_create: 'gemini-3.1-flash-image-preview',
    /** 캐릭터 측면 3장 일괄 생성 */
    character_side_views: 'gemini-3.1-flash-image-preview',
    /** 캐릭터 단일 측면 생성 */
    character_single_view: 'gemini-3.1-flash-image-preview',
    /** 피팅룸 의상 합성 */
    fitting_generate: 'gemini-3.1-flash-image-preview',
} as const;

export type ModelKey = keyof typeof MODELS;
