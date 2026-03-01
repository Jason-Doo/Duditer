'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Sparkles, Image as ImageIcon, Check, ChevronRight, ChevronLeft, Palette, Wand2, Upload, Trash2, Search, RotateCcw, Download, Share2 } from 'lucide-react';
import styles from '../../page.module.css';
import { supabase } from '@/lib/supabase';

interface CharacterWizardProps {
    onClose: () => void;
    onComplete: () => void;
    isPage?: boolean;
}

const ANIMAL_TYPES = [
    // 기존 50종
    '고양이', '강아지', '여우', '늑대', '곰', '판다', '코알라', '코끼리', '기린', '얼룩말',
    '말', '소', '돼지', '양', '염소', '사슴', '고라니', '너구리', '오소리', '수달',
    '비버', '두더지', '쥐', '햄스터', '기니피그', '페럿', '토끼', '다람쥐', '호랑이', '사자',
    '치타', '표범', '재규어', '퓨마', '하이에나', '자칼', '미어캣', '원숭이', '고릴라', '침팬지',
    '악어', '거북이', '도마뱀', '카멜레온', '이구아나', '개구리', '두꺼비', '살쾡이', '삵', '스컹크',
    // 추가 50종
    '불곰', '북극곰', '레서판다', '오랑우탄', '긴팔원숭이',
    '라쿤', '낙타', '알파카', '라마', '캥거루',
    '왈라비', '고슴도치', '아르마딜로', '나무늘보', '개미핥기',
    '여우원숭이', '카피바라', '친칠라', '타피르', '카카포',
    '독수리', '매', '부엉이', '올빼미', '플라밍고',
    '공작', '펭귄', '물개', '바다사자', '돌고래',
    '범고래', '일각고래', '해달', '야크', '들소',
    '무스', '엘크', '순록', '비쿠냐', '쿼카',
    '왕도마뱀', '비단뱀', '코브라', '도롱뇽', '나무개구리',
    '장수풍뎅이', '사마귀', '금붕어', '임팔라', '코요테',
    // 추가 100종
    '서발', '오셀롯', '카라칼', '스라소니', '밥캣', '눈표범', '구름표범', '흰담비', '밍크', '족제비',
    '사향고양이', '몽구스', '오카피', '안경원숭이', '천산갑', '아드바크', '바비루사', '가젤', '영양', '오릭스',
    '쿠두', '누', '하마', '코뿔소', '바다코끼리', '매너티', '듀공', '혹등고래', '쇠돌고래', '황새',
    '두루미', '왜가리', '오리', '기러기', '백조', '펠리컨', '갈매기', '앵무새', '까마귀', '까치',
    '참새', '비둘기', '딱따구리', '물총새', '뻐꾸기', '꿩', '타조', '에뮤', '키위새', '투칸',
    '마코앵무', '코카투', '콘도르', '물수리', '황조롱이', '알바트로스', '웜뱃', '반디쿠트', '태즈매니아데빌', '나무타기캥거루',
    '포섬', '넘뱃', '과나코', '주머니쥐', '수리부엉이', '흰올빼미', '솔개', '송골매', '코뿔새', '군함조',
    '홍관조', '울새', '찌르레기', '도요새', '물닭', '부비새', '황제타마린', '금빛사자타마린', '다이아나원숭이', '대머리독수리',
    '문어', '오징어', '해파리', '상어', '가오리', '전갈', '거미', '소라게', '달팽이', '사슴벌레',
    '나비', '반딧불이', '잠자리', '무당벌레', '피라냐', '바닷가재', '불가사리', '도도새', '오록스', '피셔캣',
];

const LOADING_MESSAGES = [
    '배우 이력서 접수중', '면접 보는중', '배우 구인 작성중', '사람인 살펴보는중',
    '알바몬 뒤지는중', "'배우란?' 책 읽는중", 'GPT에게 물어보는 중', '소문내는 중',
    '제미나이와 상담하는 중', '연기 테스트중', '후보 선정중', '리허설 진행중',
];

const PERSONALITY_MAP: Record<string, string[]> = {
    '냉철 & 지적': ['침착한', '냉철한', '똑똑한', '분석적인'],
    '밝음 & 에너지': ['쾌활한', '장난기 있는', '자신감 있는', '다정한'],
    '신비 & 몽환': ['우울한', '몽환적인', '조용한', '신비로운'],
    '카리스마 & 거침': ['적극적인', '반항적인', '당당한', '거친'],
    '소심 & 귀여움': ['소심한', '어설픈', '귀여운', '내성적인']
};

const ATTITUDE_MAP: Record<string, string[]> = {
    '느릿 & 멍': ['나른한', '느릿한', '무기력한'],
    '백치미 & 어설픔': ['어색한', '순진한', '엉뚱한'],
    '순진 & 순수': ['순수한', '조심하는', '궁금한'],
    '예민 & 까다로움': ['긴장하는', '예민한', '까다로운'],
    '여유 & 우아': ['유연한', '위엄있는', '평온한'],
    '정신없는 & 대담': ['소란스러운', '대담한', '투박한']
};

const CORE_PROMPTS = "ultra-realistic 3D rendering, incredibly detailed fur texture, octane render, stylized proportional design, studio lighting. chibi-style cute character, Pixar-style animation style, adorable and friendly demeanor, large expressive big eyes, cinematic lighting. full-body shot, standing pose, centered, pure white solid background, high-resolution portrait.";

export default function CharacterWizard({ onClose, onComplete, isPage = false }: CharacterWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [nameChecked, setNameChecked] = useState(false);
    const [nameError, setNameError] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const uploadedPaths = useRef<string[]>([]); // Track uploaded file paths for cleanup
    const [creationMode, setCreationMode] = useState<'upload' | 'generate' | null>(null);
    const [activeView, setActiveView] = useState<'front' | 'left' | 'right' | 'back'>('front');
    const [existingCharacters, setExistingCharacters] = useState<any[]>([]);
    const [requiredElements, setRequiredElements] = useState('');

    const [genLoadingStates, setGenLoadingStates] = useState({
        left: false,
        right: false,
        back: false
    });

    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        gender: '여성' as '남성' | '여성',
        personality: [] as string[],
        attitude: [] as string[],
        animal: '',
        styleReferenceId: '',
        extraDescription: '',
        front_view_url: '',
        side_views: {
            left: '',
            right: '',
            back: ''
        }
    });

    const [loadingMsgIndex, setLoadingMsgIndex] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length));
    const [showPreview, setShowPreview] = useState(false);
    const [previewMsg, setPreviewMsg] = useState<string | null>(null);

    // Cycle loading messages every 3 seconds during AI generation
    useEffect(() => {
        if (!loading) return;
        const interval = setInterval(() => {
            setLoadingMsgIndex(() => Math.floor(Math.random() * LOADING_MESSAGES.length));
        }, 3000);
        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        if (step === 6 && creationMode === 'generate') {
            fetchExistingCharacters();
        }
    }, [step, creationMode]);

    const fetchExistingCharacters = async () => {
        const { data } = await supabase.from('characters').select('*').order('created_at', { ascending: false });
        if (data) setExistingCharacters(data);
    };

    const checkNameDuplicate = async () => {
        if (!formData.name) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('characters')
                .select('name')
                .eq('name', formData.name)
                .maybeSingle(); // maybeSingle instead of single to prevent error on no match
            if (data) {
                setNameError(true);
                nameInputRef.current?.focus();
            } else {
                setNameError(false);
                setNameChecked(true);
                setStep(3);
            }
        } catch (err) {
            console.error(err);
            setNameChecked(true);
            setStep(3);
        } finally {
            setLoading(false);
        }
    };

    const generateAnimal = () => {
        if (formData.animal) return;
        const animals = ['고양이', '강아지', '여우', '토끼', '사자', '호랑이', '판다', '곰', '햄스터', '다람쥐'];
        const random = animals[Math.floor(Math.random() * animals.length)];
        setFormData(f => ({ ...f, animal: random }));
    };

    const generateInitialAI = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/characters/generate-initial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gender: formData.gender,
                    personality: formData.personality,
                    attitude: formData.attitude,
                    animal: formData.animal,
                    extraDescription: formData.extraDescription || undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                alert('캐릭터 생성 중 오류가 발생했습니다: ' + (json.error || res.statusText));
                return;
            }
            setFormData(f => ({ ...f, front_view_url: json.frontViewUrl }));
            // step 5에 머물며 결과를 표시
        } catch (err) {
            console.error('[generateInitialAI] error:', err);
            alert('캐릭터 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const generateSideViews = async () => {
        if (!formData.front_view_url) return;
        setGenLoadingStates({ left: true, right: true, back: true });

        try {
            const res = await fetch('/api/characters/generate-views', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frontViewUrl: formData.front_view_url,
                    requiredElements: requiredElements.trim() || undefined,
                    // characterId will be assigned on final save; temp storage is okay for now
                }),
            });

            const json = await res.json();
            if (!res.ok || json.error) {
                alert('측면 이미지 생성 중 오류가 발생했습니다: ' + (json.error || res.statusText));
                return;
            }

            const { sideViews } = json as { sideViews: { left: string | null; right: string | null; back: string | null } };
            setFormData(f => ({
                ...f,
                side_views: {
                    left: sideViews.left || '',
                    right: sideViews.right || '',
                    back: sideViews.back || '',
                }
            }));
        } catch (err) {
            console.error('[generateSideViews] error:', err);
            alert('측면 이미지 생성 중 오류가 발생했습니다.');
        } finally {
            setGenLoadingStates({ left: false, right: false, back: false });
        }
    };

    const generateSingleView = async (angle: 'left' | 'right' | 'back') => {
        if (!formData.front_view_url) return;
        setGenLoadingStates(prev => ({ ...prev, [angle]: true }));

        try {
            const res = await fetch('/api/characters/generate-single-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frontViewUrl: formData.front_view_url,
                    angle,
                    requiredElements: requiredElements.trim() || undefined,
                }),
            });

            const json = await res.json();
            if (!res.ok || json.error) {
                alert('측면 이미지 생성 중 오류가 발생했습니다: ' + (json.error || res.statusText));
                return;
            }

            setFormData(f => ({
                ...f,
                side_views: { ...f.side_views, [angle]: json.publicUrl || '' }
            }));
        } catch (err) {
            console.error('[generateSingleView] error:', err);
            alert('측면 이미지 생성 중 오류가 발생했습니다.');
        } finally {
            setGenLoadingStates(prev => ({ ...prev, [angle]: false }));
        }
    };

    const removeSideView = (angle: 'left' | 'right' | 'back') => {
        setFormData(f => ({
            ...f,
            side_views: { ...f.side_views, [angle]: '' }
        }));
        // If this angle was being viewed, reset to front so the box fully reverts
        setActiveView(prev => prev === angle ? 'front' : prev);
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from('characters')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('characters')
                .getPublicUrl(filePath);

            setFormData(f => ({ ...f, front_view_url: publicUrl }));
            uploadedPaths.current.push(filePath); // Track for potential cleanup
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    // Deletes any uploaded-but-not-saved files from Supabase Storage
    const cleanupUploads = async () => {
        if (uploadedPaths.current.length === 0) return;
        try {
            await supabase.storage.from('characters').remove(uploadedPaths.current);
        } catch (e) {
            console.warn('Failed to cleanup uploaded files:', e);
        } finally {
            uploadedPaths.current = [];
        }
    };

    const resetForm = () => {
        setStep(1);
        setCreationMode(null);
        setNameChecked(false);
        setNameError(false);
        setFormData({
            name: '',
            gender: '여성',
            personality: [],
            attitude: [],
            animal: '',
            styleReferenceId: '',
            extraDescription: '',
            front_view_url: '',
            side_views: { left: '', right: '', back: '' }
        });
        setActiveView('front');
    };

    const handleFinish = () => {
        // On success, files are properly saved — clear tracking refs
        uploadedPaths.current = [];
        resetForm();
        onComplete();
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('characters').insert([{
                name: formData.name,
                gender: formData.gender,
                front_view_url: formData.front_view_url,
                side_views: formData.side_views,
                personality: formData.personality,
                attitude: formData.attitude,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }]);
            if (error) throw error;

            setStep(creationMode === 'upload' ? 4 : 8);
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /** '좋아요!' 버튼 → 이름+성별+이미지URL만 DB에 저장 후 쾜플리트 */
    const handleSaveAndComplete = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('characters').insert([{
                name: formData.name,
                gender: formData.gender,
                front_view_url: formData.front_view_url,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }]);
            if (error) throw error;
            uploadedPaths.current = [];
            resetForm();
            onComplete();
        } catch {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /** '별로예요' 버튼 → temp 이미지 스토리지 삭제 후 AI 재요청 */
    const retryGeneration = async () => {
        if (formData.front_view_url) {
            // Extract storage path: URL contains ".../public/characters/{path}"
            const match = formData.front_view_url.match(/\/storage\/v1\/object\/public\/characters\/(.+)$/);
            if (match) {
                await supabase.storage.from('characters').remove([match[1]]);
            }
            setFormData(f => ({ ...f, front_view_url: '' }));
        }
        generateInitialAI();
    };

    const content = (
        <motion.div
            initial={isPage ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={isPage ? styles.wizardPage : styles.modalContent}
            style={isPage ? { maxWidth: 'none', borderRadius: 0, background: 'white' } : { maxWidth: '800px', width: '90%' }}
        >
            <div className={styles.modalHeader} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                padding: isPage ? '1.2rem var(--page-padding)' : '1.2rem 2.5rem'
            }}>
                <div style={{ justifySelf: 'start', display: 'flex', alignItems: 'center' }}>
                    {!(step === 5 && !!formData.front_view_url) && <button
                        onClick={async () => {
                            if (step > 1) {
                                // Back from success step → discard unsaved uploads and return to start
                                if ((creationMode === 'upload' && step === 4) || (creationMode === 'generate' && step === 8)) {
                                    await cleanupUploads();
                                    resetForm();
                                } else {
                                    setStep(s => s - 1);
                                }
                            } else {
                                // Exit wizard from step 1 → discard any temp uploads
                                await cleanupUploads();
                                resetForm();
                                onClose();
                            }
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            padding: '0.5rem',
                            paddingLeft: 0,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        <ChevronLeft size={28} />
                    </button>}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>캐릭터 생성</h2>
                </div>

                <div style={{ justifySelf: 'end' }}>
                    {step === 1 ? (
                        <button
                            className="gradient-btn"
                            style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', height: 'auto', opacity: creationMode ? 1 : 0.4 }}
                            onClick={() => {
                                if (!creationMode) return;
                                if (creationMode === 'generate') {
                                    // Clear upload-only data
                                    setFormData(f => ({ ...f, front_view_url: '', side_views: { left: '', right: '', back: '' } }));
                                    setRequiredElements('');
                                    setActiveView('front');
                                    if (uploadedPaths.current.length > 0) {
                                        cleanupUploads();
                                    }
                                } else {
                                    // Clear generate-only data
                                    setFormData(f => ({ ...f, personality: [], attitude: [], animal: '', styleReferenceId: '' }));
                                }
                                setStep(2);
                            }}
                            disabled={!creationMode || loading}
                        >
                            다음 단계 <ChevronRight size={18} />
                        </button>
                    ) : step === 2 ? (
                        <button
                            className="gradient-btn"
                            style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', height: 'auto', opacity: (formData.name && !nameError && (creationMode !== 'generate' || !!formData.animal)) ? 1 : 0.4 }}
                            onClick={checkNameDuplicate}
                            disabled={!formData.name || loading || nameError || (creationMode === 'generate' && !formData.animal)}
                        >
                            {loading ? '검사 중...' : '다음 단계'} <ChevronRight size={18} />
                        </button>
                    ) : ((creationMode === 'upload' && step === 3) || (creationMode === 'generate' && step === 7)) ? (
                        <button
                            className="gradient-btn"
                            style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', height: 'auto', opacity: formData.front_view_url ? 1 : 0.4 }}
                            onClick={handleSave}
                            disabled={loading || !formData.front_view_url}
                        >
                            {loading ? '저장 중...' : '캐릭터 완성'}
                        </button>
                    ) : (step !== 5 && step !== 8) ? (
                        <button
                            className="gradient-btn"
                            style={{
                                padding: '0.8rem 1.5rem',
                                fontSize: '1rem',
                                height: 'auto',
                                opacity: (
                                    (step === 3 && creationMode === 'generate' && formData.personality.length === 0) ||
                                    (step === 4 && creationMode === 'generate' && formData.attitude.length === 0) ||
                                    (step === 6 && creationMode === 'generate' && !formData.styleReferenceId)
                                ) ? 0.4 : 1
                            }}
                            onClick={() => {
                                if (creationMode === 'generate' && step === 6) generateInitialAI();
                                else setStep(s => s + 1);
                            }}
                            disabled={
                                (step === 3 && creationMode === 'generate' && formData.personality.length === 0) ||
                                (step === 4 && creationMode === 'generate' && formData.attitude.length === 0) ||
                                (step === 6 && creationMode === 'generate' && !formData.styleReferenceId)
                            }
                        >
                            {creationMode === 'generate' && step === 6 ? '생성 시작' : '다음 단계'} <ChevronRight size={18} />
                        </button>
                    ) : null}
                </div>
            </div>

            <div className={styles.modalBody} style={{ padding: isPage ? '4rem var(--page-padding)' : '2.5rem', minHeight: '480px' }}>
                <AnimatePresence mode="wait">
                    {/* ... Existing steps code remains here ... */}
                    {/* STEP 1: Branch Choice */}
                    {step === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={styles.modalScroll} style={{ textAlign: 'center' }}>
                            <h3 className="text-anim">반가워요! 캐릭터를 어떻게 만들까요?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>등록과 신규생성 중 선택해주세요!</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className={`${styles.card} ${creationMode === 'upload' ? 'active-border' : ''}`} onClick={() => setCreationMode('upload')} style={{ padding: '2.5rem', cursor: 'pointer', border: creationMode === 'upload' ? '2px solid var(--accent-primary)' : '1.5px solid var(--border-color)' }}>
                                    <Upload size={48} color={creationMode === 'upload' ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ marginBottom: '1rem' }} />
                                    <h4 style={{ color: creationMode === 'upload' ? 'var(--accent-primary)' : 'inherit' }}>직접 이미지 등록</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>이미 소장 중인<br />이미지를 업로드</p>
                                </div>
                                <div className={`${styles.card} ${creationMode === 'generate' ? 'active-border' : ''}`} onClick={() => setCreationMode('generate')} style={{ padding: '2.5rem', cursor: 'pointer', border: creationMode === 'generate' ? '2px solid var(--accent-primary)' : '1.5px solid var(--border-color)' }}>
                                    <Wand2 size={48} color={creationMode === 'generate' ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ marginBottom: '1rem' }} />
                                    <h4 style={{ color: creationMode === 'generate' ? 'var(--accent-primary)' : 'inherit' }}>신규 AI 생성</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI를 통해 새로운<br />캐릭터 창조</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Name & Gender */}
                    {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={styles.modalScroll} style={{ textAlign: 'center' }}>
                            <h3 className="text-anim">
                                {creationMode === 'upload' ? '등록할 캐릭터의 이름과 성별을 알려주세요!' : '새로운 캐릭터는 이름이 어떻게 되나요?'}
                            </h3>
                            <div className={styles.inputGroup} style={{ marginTop: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                                    <label className={styles.inputLabel} style={{ margin: 0 }}>이름</label>
                                    {nameError && (
                                        <span style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '4px',
                                            fontWeight: 700
                                        }}>
                                            해당 이름은 이미 사용중입니다.
                                        </span>
                                    )}
                                </div>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    className={styles.textInput}
                                    placeholder="이름을 입력하세요"
                                    value={formData.name}
                                    onChange={e => {
                                        setFormData({ ...formData, name: e.target.value });
                                        setNameChecked(false);
                                        setNameError(false);
                                    }}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>성별</label>
                                <div className={styles.ratioGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                    {(['남성', '여성'] as const).map(g => (
                                        <div
                                            key={g}
                                            className={`${styles.ratioOption} ${formData.gender === g ? styles.ratioActive : ''}`}
                                            onClick={() => setFormData({ ...formData, gender: g })}
                                        >
                                            {g}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {creationMode === 'generate' && (
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>동물 타입</label>
                                    <input
                                        type="text"
                                        className={styles.textInput}
                                        placeholder="예: 고양이, 강아지, 토끼..."
                                        value={formData.animal}
                                        onChange={e => setFormData({ ...formData, animal: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="gradient-btn"
                                        onClick={() => {
                                            const random = ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)];
                                            setFormData({ ...formData, animal: random });
                                        }}
                                        style={{ marginTop: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '1rem', height: 'auto', width: '100%' }}
                                    >
                                        아몰랑 추천해줘!
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* [UPLOAD FLOW] STEP 3: Multi-view */}
                    {step === 3 && creationMode === 'upload' && (
                        <motion.div key="upload-s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                            <h3 className="text-anim" style={{ textAlign: 'center' }}>등록할 캐릭터의 정면 모습을 올려주세요!</h3>

                            <style>{`
                                @media (max-width: 640px) {
                                    .upload-view-grid { flex-direction: column !important; }
                                    .upload-image-box { width: 100% !important; max-width: 100% !important; }
                                    .upload-side-nav { flex-direction: row !important; justify-content: center !important; overflow-x: auto !important; padding: 0.5rem 0 !important; width: 100% !important; }
                                    .upload-side-nav button { flex: 1 1 0 !important; height: 72px !important; min-width: 0 !important; }
                                }
                            `}</style>

                            <div className="upload-view-grid" style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', marginTop: '2.5rem', alignItems: 'stretch' }}>
                                <div className="upload-image-box card" style={{ flex: '1 1 250px', aspectRatio: '1/1', maxHeight: 'min(600px, 60vh)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: 0, margin: '0 auto' }}>
                                    {activeView === 'front' && !formData.front_view_url ? (
                                        <div
                                            className={`${styles.uploadDropzone} ${isDragging ? styles.dragging : ''}`}
                                            onDragOver={onDragOver}
                                            onDrop={onDrop}
                                            onDragLeave={onDragLeave}
                                            onClick={() => document.getElementById('fileInput')?.click()}
                                            style={{ textAlign: 'center', width: '100%', height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed #ddd', borderRadius: '16px', transition: 'all 0.3s ease' }}
                                        >
                                            {uploading ? (
                                                <RotateCcw className="spin" size={40} color="var(--accent-primary)" />
                                            ) : (
                                                <>
                                                    <Upload size={40} color={isDragging ? 'var(--accent-primary)' : '#ddd'} />
                                                    <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                        {isDragging ? '여기에 놓으세요!' : '정면 이미지를 업로드하거나 드래그하세요'}
                                                    </p>
                                                    <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>클릭하여 파일 선택</p>
                                                </>
                                            )}
                                            <input
                                                id="fileInput"
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(file);
                                                }}
                                            />
                                        </div>
                                    ) : activeView === 'front' && formData.front_view_url ? (
                                        <img src={formData.front_view_url} style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', background: '#f8f9fa' }} onClick={() => window.open(formData.front_view_url)} alt="Character Front View" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {genLoadingStates[activeView as keyof typeof genLoadingStates] ? (
                                                <div style={{ textAlign: 'center' }}>
                                                    <RotateCcw className="spin" size={32} color="var(--accent-primary)" />
                                                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--accent-primary)' }}>생성 중...</p>
                                                </div>
                                            ) : (
                                                formData.side_views[activeView as keyof typeof formData.side_views] ?
                                                    <img src={formData.side_views[activeView as keyof typeof formData.side_views]} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8f9fa', cursor: 'pointer' }} onClick={() => window.open(formData.side_views[activeView as keyof typeof formData.side_views])} /> :
                                                    <div style={{ textAlign: 'center' }}>
                                                        <ImageIcon size={40} color="#eee" />
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>생성이 필요합니다</p>
                                                    </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="upload-side-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'stretch', overflow: 'hidden', width: '100px', flexShrink: 0 }}>
                                    {(['front', 'left', 'right', 'back'] as const).map(v => {
                                        const hasImg = v === 'front' ? !!formData.front_view_url : !!formData.side_views[v as keyof typeof formData.side_views];
                                        const imgUrl = v === 'front' ? formData.front_view_url : formData.side_views[v as keyof typeof formData.side_views];
                                        const isLoading = v !== 'front' && genLoadingStates[v as keyof typeof genLoadingStates];
                                        const label = v === 'front' ? '정면' : v === 'left' ? '좌측면' : v === 'right' ? '우측면' : '뒷면';

                                        return (
                                            <div key={v} style={{ flex: '1 1 0', minHeight: '60px', position: 'relative' }}>
                                                <button
                                                    className={`${styles.ratioOption} ${(activeView === v || hasImg) ? styles.ratioActive : ''}`}
                                                    style={{ width: '100%', height: '100%', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', overflow: 'hidden' }}
                                                    onClick={() => {
                                                        if (v === 'front' || hasImg) {
                                                            setActiveView(v);
                                                        } else if (!isLoading && formData.front_view_url) {
                                                            generateSingleView(v as 'left' | 'right' | 'back');
                                                        }
                                                    }}
                                                >
                                                    {isLoading ? (
                                                        <RotateCcw size={20} className="spin" />
                                                    ) : hasImg ? (
                                                        <img src={imgUrl} style={{ width: '100%', aspectRatio: '1/1', height: 'auto', borderRadius: '4px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <ImageIcon size={20} color={formData.front_view_url ? 'var(--accent-primary)' : '#ccc'} />
                                                    )}
                                                    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '0.7rem', textAlign: 'center' }}>{label}</span>
                                                        {hasImg && v !== 'front' && (
                                                            <span
                                                                role="button"
                                                                onClick={e => { e.stopPropagation(); removeSideView(v as 'left' | 'right' | 'back'); }}
                                                                style={{ position: 'absolute', right: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px' }}
                                                            >
                                                                <Trash2 size={14} color="white" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={styles.inputGroup} style={{ marginTop: '1.5rem' }}>
                                <label className={styles.inputLabel}>필수 요소</label>
                                <input
                                    type="text"
                                    value={requiredElements}
                                    onChange={e => setRequiredElements(e.target.value)}
                                    placeholder="꼭 있어야 하는 요소를 입력해주세요. (예:꼬리, 안경, 머리핀 등...)"
                                    className={styles.inputField}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <button
                                className="gradient-btn"
                                style={{ width: '100%', marginTop: '0.75rem', opacity: formData.front_view_url ? 1 : 0.5, pointerEvents: (genLoadingStates.left || genLoadingStates.right || genLoadingStates.back) ? 'none' : 'auto' }}
                                onClick={generateSideViews}
                                disabled={!formData.front_view_url}
                            >
                                <Sparkles size={16} />
                                {formData.front_view_url ? (
                                    genLoadingStates.left || genLoadingStates.right || genLoadingStates.back ? '생성 중...' : '측면 자동 생성'
                                ) : '정면을 업로드 해주세요.'}
                            </button>
                        </motion.div>
                    )}

                    {/* SUCCESS STEP (REUSED FOR BOTH) */}
                    {((step === 4 && creationMode === 'upload') || (step === 8 && creationMode === 'generate')) && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <div style={{ width: '80px', height: '80px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'white' }}>
                                <Check size={40} />
                            </div>
                            <h2 className="text-anim">
                                {creationMode === 'upload' ? '등록 완료!' : '탄생을 축하해요!'}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.1rem' }}>
                                {creationMode === 'upload' ? '이제 멋진 컨텐츠를 제작해보세요!' : `"${formData.name}"와(과) 함께 멋진 컨텐츠를 만들어보세요!`}
                            </p>
                            <div style={{ marginTop: '3rem' }}>
                                <button className="gradient-btn" onClick={handleFinish} style={{ padding: '1rem 4rem' }}>
                                    확인
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* [AI GENERATE] STEP 3: Personality */}
                    {step === 3 && creationMode === 'generate' && (
                        <motion.div key="gen-s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                            <h3 className="text-anim" style={{ textAlign: 'center' }}>캐릭터의 성격은 어떻게 되나요? (최대 3개)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
                                {Object.entries(PERSONALITY_MAP).map(([cat, tags]) => (
                                    <div key={cat}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>{cat}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {tags.map(t => (
                                                <button
                                                    key={t}
                                                    className={`${styles.tag} ${formData.personality.includes(t) ? styles.tagActive : ''}`}
                                                    style={{
                                                        opacity: (!formData.personality.includes(t) && formData.personality.length >= 3) ? 0.35 : 1,
                                                        cursor: (!formData.personality.includes(t) && formData.personality.length >= 3) ? 'not-allowed' : 'pointer',
                                                    }}
                                                    onClick={() => {
                                                        const exists = formData.personality.includes(t);
                                                        if (!exists && formData.personality.length >= 3) return;
                                                        setFormData(f => ({ ...f, personality: exists ? f.personality.filter(i => i !== t) : [...f.personality, t] }));
                                                    }}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* [AI GENERATE] STEP 4: Attitude */}
                    {step === 4 && creationMode === 'generate' && (
                        <motion.div key="gen-s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                            <h3 className="text-anim" style={{ textAlign: 'center' }}>캐릭터의 태도는 어떨까요? (최대 2개)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
                                {Object.entries(ATTITUDE_MAP).map(([cat, tags]) => (
                                    <div key={cat}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>{cat}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {tags.map(t => (
                                                <button
                                                    key={t}
                                                    className={`${styles.tag} ${formData.attitude.includes(t) ? styles.tagActive : ''}`}
                                                    style={{
                                                        opacity: (!formData.attitude.includes(t) && formData.attitude.length >= 2) ? 0.35 : 1,
                                                        cursor: (!formData.attitude.includes(t) && formData.attitude.length >= 2) ? 'not-allowed' : 'pointer',
                                                    }}
                                                    onClick={() => {
                                                        const exists = formData.attitude.includes(t);
                                                        if (!exists && formData.attitude.length >= 2) return;
                                                        setFormData(f => ({ ...f, attitude: exists ? f.attitude.filter(i => i !== t) : [...f.attitude, t] }));
                                                    }}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* [AI GENERATE] STEP 5: Confirmation Summary */}
                    {step === 5 && creationMode === 'generate' && (
                        <motion.div key="gen-s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                            <h3 className="text-anim" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                {formData.front_view_url ? '멋진 캐릭터를 찾았어요!' : '찾으시는 캐릭터가 맞나요?'}
                            </h3>

                            {/* 동그란 프로필 박스 */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '250px', height: '250px', borderRadius: '50%',
                                    background: 'var(--surface-secondary, rgba(255,255,255,0.1))',
                                    border: '2px solid var(--accent-primary)',
                                    boxShadow: '0 0 0 4px rgba(var(--accent-primary-rgb, 99,102,241), 0.18)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {formData.front_view_url ? (
                                        <img
                                            src={formData.front_view_url}
                                            alt="generated character"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', cursor: 'pointer' }}
                                            onClick={() => setShowPreview(true)}
                                            title="클릭하여 크게 보기"
                                        />
                                    ) : loading ? (
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={loadingMsgIndex}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.4 }}
                                                style={{ width: '85%', fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', color: 'var(--accent-primary)', lineHeight: 1.4 }}
                                            >
                                                {LOADING_MESSAGES[loadingMsgIndex]}
                                            </motion.span>
                                        </AnimatePresence>
                                    ) : (
                                        <svg width="48" height="74" viewBox="0 0 68 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8.59408 25.8137C10.614 20.0716 14.601 15.2296 19.8489 12.1454C25.0967 9.0612 31.2668 7.93379 37.2662 8.96285C43.2657 9.99192 48.7073 13.1111 52.6274 17.7678C56.5475 22.4246 58.693 28.3184 58.6839 34.4055C58.6839 51.5889 32.9087 60.1807 32.9087 60.1807M33.5974 94.5469H33.6833" stroke="var(--accent-primary)" strokeWidth="17.1835" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                    { label: '이름', value: formData.name },
                                    { label: '성별', value: formData.gender },
                                    { label: '동물 타입', value: formData.animal },
                                    { label: '성격', value: formData.personality.join(', ') || '-' },
                                    { label: '태도', value: formData.attitude.join(', ') || '-' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{
                                        display: 'flex', alignItems: 'stretch', borderRadius: '12px',
                                        overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
                                    }}>
                                        <div style={{
                                            background: 'var(--accent-primary)', color: 'white',
                                            fontWeight: 700, fontSize: '0.8rem', minWidth: '80px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '0.75rem 0.5rem', flexShrink: 0, textAlign: 'center'
                                        }}>
                                            {label}
                                        </div>
                                        <div style={{
                                            flex: 1, padding: '0.75rem 1rem',
                                            background: 'var(--surface-secondary, rgba(255,255,255,0.04))',
                                            fontSize: '0.95rem', display: 'flex', alignItems: 'center'
                                        }}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 추가 설명: 생성 전엔 textarea, 생성 후엔 텍스트 */}
                            <div className={styles.inputGroup} style={{ marginTop: '1.5rem' }}>
                                <label className={styles.inputLabel}>주가 설명</label>
                                {formData.front_view_url ? (
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0, minHeight: '1.2rem' }}>
                                        {formData.extraDescription || '(없음)'}
                                    </p>
                                ) : (
                                    <textarea
                                        className={styles.textInput}
                                        rows={3}
                                        placeholder="(선택) 추가 설명이 있다면 입력해주세요. (예: 양복을 입어, 불의 속성을 가짐...)"
                                        value={formData.extraDescription ?? ''}
                                        onChange={e => setFormData(f => ({ ...f, extraDescription: e.target.value }))}
                                        disabled={loading}
                                        style={{ resize: 'vertical', minHeight: '80px' }}
                                    />
                                )}
                            </div>

                            {/* 하단 버튼: 생성 전 → '맞아요!', 생성 후 → '별로예요' + '좋아요!' */}
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                {formData.front_view_url && (
                                    <button
                                        className={styles.outlineBtn}
                                        style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', height: 'auto', opacity: loading ? 0.5 : 1 }}
                                        onClick={retryGeneration}
                                        disabled={loading}
                                    >
                                        별로예요
                                    </button>
                                )}
                                <button
                                    className="gradient-btn"
                                    style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', height: 'auto', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => {
                                        if (formData.front_view_url) {
                                            handleSaveAndComplete();
                                        } else {
                                            if (!formData.styleReferenceId) setFormData(f => ({ ...f, styleReferenceId: 'none' }));
                                            generateInitialAI();
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><RotateCcw size={18} className="spin" /> 생성중...</>
                                    ) : formData.front_view_url ? (
                                        '좋아요!'
                                    ) : (
                                        '네! 맞아요!'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* [AI GENERATE] STEP 6: Style Reference (NEW) */}
                    {step === 6 && creationMode === 'generate' && (
                        <motion.div key="gen-s6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                            <h3 className="text-anim">마지막으로, 어떤 스타일로 만들까요?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>기존 캐릭터의 화풍과 스타일을 그대로 계승할 수 있습니다.</p>
                            <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {existingCharacters.map(char => (
                                    <div
                                        key={char.id}
                                        className={`${styles.mediaCard} ${formData.styleReferenceId === char.id ? 'active-border' : ''}`}
                                        onClick={() => setFormData({ ...formData, styleReferenceId: char.id })}
                                        style={{ height: '180px', cursor: 'pointer', border: formData.styleReferenceId === char.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                                    >
                                        <img src={char.front_view_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`${char.name} style`} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.7rem' }}>
                                            {char.name} 스타일
                                        </div>
                                    </div>
                                ))}
                                <div
                                    className={`${styles.mediaCard} ${formData.styleReferenceId === 'none' ? 'active-border' : ''}`}
                                    onClick={() => setFormData({ ...formData, styleReferenceId: 'none' })}
                                    style={{ height: '180px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: formData.styleReferenceId === 'none' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                                >
                                    <Sparkles size={24} color="var(--accent-primary)" />
                                    <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>완전한 신규 스타일</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* [AI GENERATE] STEP 7: AI Result & Multi-view */}
                    {step === 7 && creationMode === 'generate' && (
                        <motion.div key="gen-s7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                            <h3 className="text-anim" style={{ textAlign: 'center' }}>탄생을 축하해요! 이제 측면도 생성할 수 있어요!</h3>

                            <div className="upload-view-grid" style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', marginTop: '2.5rem', alignItems: 'start' }}>
                                <div className="upload-image-box card" style={{ flex: '1 1 250px', aspectRatio: '1/1', maxHeight: 'min(600px, 60vh)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0, margin: '0 auto' }}>
                                    {activeView === 'front' ? (
                                        <img src={formData.front_view_url} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8f9fa' }} alt="Generated Front View" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {genLoadingStates[activeView as keyof typeof genLoadingStates] ? (
                                                <RotateCcw className="spin" size={32} color="var(--accent-primary)" />
                                            ) : (
                                                formData.side_views[activeView as keyof typeof formData.side_views] ?
                                                    <img src={formData.side_views[activeView as keyof typeof formData.side_views]} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8f9fa' }} alt={`${activeView} View`} /> :
                                                    <p style={{ color: '#ccc', fontSize: '0.9rem' }}>이미지 없음</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="upload-side-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'stretch', overflow: 'hidden', width: '100px', flexShrink: 0 }}>
                                    {(['front', 'left', 'right', 'back'] as const).map(v => {
                                        const hasImg = v === 'front' ? !!formData.front_view_url : !!formData.side_views[v as keyof typeof formData.side_views];
                                        const imgUrl = v === 'front' ? formData.front_view_url : formData.side_views[v as keyof typeof formData.side_views];
                                        const isLoading = v !== 'front' && genLoadingStates[v as keyof typeof genLoadingStates];
                                        const label = v === 'front' ? '정면' : v === 'left' ? '좌측면' : v === 'right' ? '우측면' : '뒷면';

                                        return (
                                            <div key={v} style={{ flex: '1 1 0', minHeight: '60px', position: 'relative' }}>
                                                <button
                                                    className={`${styles.ratioOption} ${(activeView === v || hasImg) ? styles.ratioActive : ''}`}
                                                    style={{ width: '100%', height: '100%', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', overflow: 'hidden' }}
                                                    onClick={() => {
                                                        if (v === 'front' || hasImg) {
                                                            setActiveView(v);
                                                        } else if (!isLoading && formData.front_view_url) {
                                                            generateSingleView(v as 'left' | 'right' | 'back');
                                                        }
                                                    }}
                                                >
                                                    {isLoading ? (
                                                        <RotateCcw size={20} className="spin" />
                                                    ) : hasImg ? (
                                                        <img src={imgUrl} style={{ width: '100%', aspectRatio: '1/1', height: 'auto', borderRadius: '4px', objectFit: 'cover' }} alt={`${label} Thumbnail`} />
                                                    ) : (
                                                        <ImageIcon size={20} color={formData.front_view_url ? 'var(--accent-primary)' : '#ccc'} />
                                                    )}
                                                    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '0.7rem', textAlign: 'center' }}>{label}</span>
                                                        {hasImg && v !== 'front' && (
                                                            <span
                                                                role="button"
                                                                onClick={e => { e.stopPropagation(); removeSideView(v as 'left' | 'right' | 'back'); }}
                                                                style={{ position: 'absolute', right: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px' }}
                                                            >
                                                                <Trash2 size={14} color="white" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={styles.inputGroup} style={{ marginTop: '1.5rem' }}>
                                <label className={styles.inputLabel}>필수 요소</label>
                                <input
                                    type="text"
                                    value={requiredElements}
                                    onChange={e => setRequiredElements(e.target.value)}
                                    placeholder="꼭 있어야 하는 요소를 입력해주세요. (예:꼬리, 안경, 머리핀 등...)"
                                    className={styles.inputField}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <button
                                className="gradient-btn"
                                style={{ width: '100%', marginTop: '0.75rem', opacity: formData.front_view_url ? 1 : 0.5, pointerEvents: (genLoadingStates.left || genLoadingStates.right || genLoadingStates.back) ? 'none' : 'auto' }}
                                onClick={generateSideViews}
                                disabled={!formData.front_view_url}
                            >
                                <Sparkles size={16} />
                                {formData.front_view_url ? (
                                    genLoadingStates.left || genLoadingStates.right || genLoadingStates.back ? '생성 중...' : '측면 자동 생성'
                                ) : '정면을 업로드 해주세요.'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div >
    );

    return (
        <>
            {isPage ? content : <div className={styles.modalOverlay}>{content}</div>}

            {/* 생성된 캐릭터 미리보기 — LibraryDetail 동일 디자인 */}
            <AnimatePresence>
                {showPreview && formData.front_view_url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white', display: 'flex', flexDirection: 'column' }}
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', height: '100%' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 헤더: 돌아가기 버튼만 */}
                            <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-secondary)', borderBottom: '1.5px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '80px 1fr 80px', alignItems: 'center', height: '80px', padding: '0 1.5rem' }}>
                                <div style={{ justifySelf: 'start' }}>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', padding: '0.5rem', paddingLeft: 0, transition: 'opacity 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        <ChevronLeft size={28} />
                                    </button>
                                </div>
                                <div />
                                <div />
                            </div>

                            {/* 바디: 이미지 */}
                            <div className={styles.modalBody} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', minHeight: '400px' }}>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <img
                                            src={formData.front_view_url}
                                            alt="generated character"
                                            style={{ width: '100%', objectFit: 'contain' }}
                                        />
                                    </motion.div>
                                </div>
                            </div>

                            {/* 하단 액션 바 */}
                            <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'var(--bg-secondary)' }}>
                                <button
                                    onClick={() => {
                                        try {
                                            // URL에서 확장자 추출
                                            const urlPath = formData.front_view_url.split('?')[0];
                                            const rawExt = urlPath.split('.').pop() || 'png';
                                            const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
                                            const filename = `character_${Date.now()}.${ext}`;
                                            // 서버사이드 프록시로 다운로드 (CORS·파일명 문제 없음)
                                            const a = document.createElement('a');
                                            a.href = `/api/download?url=${encodeURIComponent(formData.front_view_url)}&filename=${encodeURIComponent(filename)}`;
                                            a.download = filename;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            setPreviewMsg('다운로드를 완료했습니다.');
                                        } catch { window.open(formData.front_view_url, '_blank'); }
                                        setTimeout(() => setPreviewMsg(null), 2000);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.8rem', borderRadius: '16px', background: 'white', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, border: '1.5px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(109,93,252,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <Download size={20} color="var(--accent-primary)" strokeWidth={2.5} />
                                    다운로드
                                </button>
                                <button
                                    onClick={async () => {
                                        if (navigator.share) {
                                            await navigator.share({ title: '내 캐릭터', url: formData.front_view_url });
                                        } else {
                                            navigator.clipboard.writeText(formData.front_view_url);
                                            setPreviewMsg('링크가 복사되었습니다!');
                                            setTimeout(() => setPreviewMsg(null), 2000);
                                        }
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.8rem', borderRadius: '16px', background: 'white', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, border: '1.5px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent-pink)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(244,91,126,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <Share2 size={20} color="var(--accent-pink)" strokeWidth={2.5} />
                                    공유하기
                                </button>
                            </div>
                        </motion.div>

                        {/* 토스트 메시지 */}
                        <AnimatePresence>
                            {previewMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    style={{ position: 'fixed', bottom: '120px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '1rem 2rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.95rem', zIndex: 20000, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    {previewMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
