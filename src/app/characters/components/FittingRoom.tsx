'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, Image as ImageIcon, Shirt, Plus, Trash2 } from 'lucide-react';
import styles from '../../page.module.css';
import { supabase } from '@/lib/supabase';

interface FittingRoomProps {
    character: any;
    onClose: () => void;
    onDelete?: () => void;
}

// 피팅 생성 중 슬라이드되는 로딩 메시지
const FITTING_LOADING_MESSAGES = [
    '옷을 입어보는 중',
    '거울 보는 중',
    '사이즈가 맞지 않아 교체중',
    '실밥 제거중',
    '피팅룸 청소중',
    '사이즈 재측정 중',
    '피팅 후 사이즈 실측 중',
    '옷장에서 옷 찾는 중',
    '찢어진 부분 꿰매는 중',
    '기장 줄이는 중',
    '드라이크리닝 중',
    '입은 옷 정리 중',
];

export default function FittingRoom({ character, onClose, onDelete }: FittingRoomProps) {
    const [step, setStep] = useState(0); // 0: List, 1: Upload, 2: AI Gen, 3: New Result, 4: View
    const [selectedFitting, setSelectedFitting] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [outfitUrl, setOutfitUrl] = useState<string | null>(null);
    const [outfitPreview, setOutfitPreview] = useState<string | null>(null);
    const [outfitDescription, setOutfitDescription] = useState('');
    const [outfitExclusion, setOutfitExclusion] = useState('');
    const [outfitName, setOutfitName] = useState('');
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const canStartFitting = !!(outfitName.trim() && (outfitUrl || outfitDescription.trim()));

    const [loadingMsgIdx, setLoadingMsgIdx] = useState(() => Math.floor(Math.random() * FITTING_LOADING_MESSAGES.length));

    // Cycle loading messages every 3s while loading
    useEffect(() => {
        if (!loading) return;
        const interval = setInterval(() => {
            setLoadingMsgIdx(prev => {
                let next = Math.floor(Math.random() * FITTING_LOADING_MESSAGES.length);
                while (next === prev) next = Math.floor(Math.random() * FITTING_LOADING_MESSAGES.length);
                return next;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [loading]);

    // Body scroll lock (iOS-compatible)
    useEffect(() => {
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
        };
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [character.id]);

    useEffect(() => {
        console.log('FittingRoom State Change:', { step, selectedFittingId: selectedFitting?.id, hasResultUrl: !!resultUrl });
    }, [step, selectedFitting, resultUrl]);

    async function fetchHistory() {
        try {
            const { data, error } = await supabase
                .from('fittings')
                .select('*')
                .eq('character_id', character.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching fitting history:', error);
        }
    }

    const handleFileUpload = async (file: File) => {
        if (!file) return;
        // Show local preview immediately without uploading yet
        const previewUrl = URL.createObjectURL(file);
        setOutfitPreview(previewUrl);
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${character.id}_${Math.random()}.${fileExt}`;
            const filePath = `outfits/${fileName}`;

            const { data, error } = await supabase.storage
                .from('fittings')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('fittings')
                .getPublicUrl(filePath);

            setOutfitUrl(publicUrl);
            // Stay on step 1 — user must press '피팅하기' to proceed
        } catch (error) {
            console.error('Error uploading outfit:', error);
            alert('의상 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const startFitting = async () => {
        setLoading(true);
        try {
            // Get character's front image URL (DB column: front_view_url)
            const characterImageUrl = character.front_view_url ||
                character.image_url ||
                character.images?.find((img: any) => img.view === 'front')?.url ||
                character.images?.[0]?.url;

            if (!characterImageUrl) {
                throw new Error('캐릭터의 정면 이미지가 없습니다. 캐릭터 상세에서 이미지를 먼저 등록해주세요.');
            }

            // Fetch AI settings from DB
            let fittingPrompt = '업로드한 이미지들을 참조해서 <이미지1>의 복장을 <이미지2>의 패션(<복장설명>)으로 변경해줘. <제외옵션>';
            try {
                const { data } = await supabase
                    .from('ai_settings')
                    .select('fitting_system_prompt')
                    .eq('id', 'default')
                    .single();
                if (data?.fitting_system_prompt) fittingPrompt = data.fitting_system_prompt;
            } catch (e) { /* use defaults */ }

            // Parse placeholder tokens — <이미지1>, <이미지2> are positional hints for Gemini (keep as-is)
            const exclusionText = outfitExclusion.trim() ? `${outfitExclusion.trim()}은 제외` : '';
            const parsedFittingPrompt = fittingPrompt
                .replace('<복장설명>', outfitDescription.trim())
                .replace('<제외옵션>', exclusionText)
                .replace('<제외설명>', exclusionText); // Fallback for previous tag name

            // Call Gemini API Route with combined prompt + images
            const response = await fetch('/api/fitting/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterImageUrl,
                    outfitImageUrl: outfitUrl,
                    systemPrompt: parsedFittingPrompt,
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'AI 피팅 실패');

            // Upload generated image to Supabase storage
            const { imageBase64, mimeType } = result;
            const blob = await fetch(`data:${mimeType};base64,${imageBase64}`).then(r => r.blob());
            const ext = mimeType.includes('png') ? 'png' : 'jpg';
            const resultPath = `results/${character.id}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('fittings')
                .upload(resultPath, blob, { contentType: mimeType });
            if (uploadError) throw new Error('스토리지 업로드 실패: ' + (uploadError.message || JSON.stringify(uploadError)));

            const { data: { publicUrl: resultPublicUrl } } = supabase.storage
                .from('fittings')
                .getPublicUrl(resultPath);
            setResultUrl(resultPublicUrl);

            // Save to DB (image_url = generated result, outfit_url = uploaded outfit)
            const insertPayload = {
                character_id: character.id,
                image_url: resultPublicUrl,
                outfit_url: outfitUrl,
                result_url: resultPublicUrl,
                outfit_name: outfitName.trim(),
                description: outfitDescription || outfitName.trim() || 'AI 피팅 결과'
            };
            console.log('Inserting fitting to DB:', insertPayload);

            const { data: dbRows, error: dbError } = await supabase
                .from('fittings')
                .insert([insertPayload])
                .select();

            if (dbError) throw new Error('DB 저장 실패: ' + (dbError.message || JSON.stringify(dbError)));

            if (dbRows && dbRows.length > 0) {
                console.log('Successfully saved to DB, resulting row:', dbRows[0]);
                setSelectedFitting(dbRows[0]);
            } else {
                console.warn('DB insert succeeded but returned no rows. Using payload as fallback.');
                setSelectedFitting({ ...insertPayload, id: 'temp-' + Date.now() }); // Fallback
            }

            setStep(3);
            fetchHistory();
        } catch (error: any) {
            const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || '알 수 없는 오류';
            console.error('Error in AI fitting:', msg, error);
            alert('AI 피팅 중 오류가 발생했습니다:\n' + msg);
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    // Auto-trigger AI generation when entering step 2
    useEffect(() => {
        if (step === 2) {
            startFitting();
        }
    }, [step]);

    const [isDeleting, setIsDeleting] = useState(false);
    const [needsConfirm, setNeedsConfirm] = useState(false); // First click state
    const [isDeletingChar, setIsDeletingChar] = useState(false);
    const [needsConfirmChar, setNeedsConfirmChar] = useState(false);

    const deleteFitting = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isDeleting) return;

        if (!selectedFitting || !selectedFitting.id) {
            console.error('DEBUG: No selectedFitting to delete');
            alert('삭제할 정보를 선택해주세요.');
            setStep(0);
            return;
        }

        // --- Multi-click Confirmation Logic ---
        if (!needsConfirm) {
            console.log('DEBUG: First click, showing confirm state...');
            setNeedsConfirm(true);
            return;
        }

        // --- Actual Deletion (Second Click) ---
        console.log('DEBUG: Confirmed deletion button clicked! ID:', selectedFitting.id);
        setIsDeleting(true);
        setNeedsConfirm(false);

        try {
            // Give it 800ms to show the "Deleting..." loading animation
            await new Promise(resolve => setTimeout(resolve, 800));

            const { error } = await supabase
                .from('fittings')
                .delete()
                .eq('id', selectedFitting.id);

            if (error) {
                console.error('DEBUG: Supabase delete error:', error);
                throw error;
            }

            console.log('DEBUG: Delete successful');
            alert('성공적으로 삭제되었습니다.');

            // Success cleanup
            setStep(0);
            setSelectedFitting(null);
            setResultUrl(null);
            setOutfitUrl(null);
            setOutfitPreview(null);
            fetchHistory();
        } catch (err: any) {
            console.error('DEBUG: Catch error:', err);
            alert('삭제에 실패했습니다: ' + (err.message || '알 수 없는 오류'));
        } finally {
            setIsDeleting(false);
        }
    };

    const deleteCharacter = async () => {
        if (isDeletingChar) return;

        if (!needsConfirmChar) {
            console.log('DEBUG: First click for character deletion');
            setNeedsConfirmChar(true);
            return;
        }

        console.log('DEBUG: Confirmed character deletion! ID:', character.id);
        setIsDeletingChar(true);
        setNeedsConfirmChar(false);
        try {
            // DB Cascade: fitting is deleted automatically because of foreign key REFERENCES characters(id) ON DELETE CASCADE
            const { error } = await supabase
                .from('characters')
                .delete()
                .eq('id', character.id);

            if (error) {
                console.error('DEBUG: Supabase character delete error:', error);
                throw error;
            }

            console.log('DEBUG: Character delete successful');
            alert('캐릭터가 성공적으로 삭제되었습니다.');
            if (onDelete) onDelete();
            onClose(); // Exit fitting room as character no longer exists
        } catch (err: any) {
            console.error('DEBUG: Character delete catch error:', err);
            alert('캐릭터 삭제에 실패했습니다: ' + (err.message || '알 수 없는 오류'));
        } finally {
            setIsDeletingChar(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <motion.div
                className={styles.modalContent}
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{ width: 'var(--modal-width, 95%)', maxWidth: '1100px', height: 'var(--modal-height, 85vh)', maxHeight: '900px' }}
            >
                <div className={styles.modalHeader} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                    <div style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                            onClick={() => {
                                if (step !== 0) {
                                    setStep(0);
                                    setOutfitUrl(null);
                                    setOutfitPreview(null);
                                    setOutfitDescription('');
                                    setOutfitExclusion('');
                                    setOutfitName('');
                                    setSelectedFitting(null);
                                    setNeedsConfirm(false); // Reset confirm state on back
                                    setNeedsConfirmChar(false); // Reset char confirm on back
                                } else {
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
                        </button>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                            {(step === 3 || step === 4) && selectedFitting
                                ? (selectedFitting.outfit_name || '피팅 결과')
                                : '피팅룸'}
                        </h2>
                    </div>

                    <div style={{ justifySelf: 'end' }}>
                        {step === 1 ? (
                            <button
                                className="gradient-btn"
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    fontSize: '1rem',
                                    height: 'auto',
                                    opacity: canStartFitting ? 1 : 0.4,
                                    cursor: canStartFitting ? 'pointer' : 'default',
                                    pointerEvents: canStartFitting ? 'auto' : 'none'
                                }}
                                onClick={async () => {
                                    const name = outfitName.trim();
                                    // Duplicate name check
                                    const { data: existing } = await supabase
                                        .from('fittings')
                                        .select('id')
                                        .eq('character_id', character.id)
                                        .eq('outfit_name', name)
                                        .maybeSingle();
                                    if (existing) {
                                        alert(`'${name}' 이름의 옷이 이미 등록되어 있습니다. 다른 이름을 입력해주세요.`);
                                        return;
                                    }
                                    setStep(2);
                                }}
                                disabled={!canStartFitting}
                            >
                                <Sparkles size={18} /> 피팅하기
                            </button>
                        ) : step === 0 ? (
                            <button
                                type="button"
                                className="gradient-btn"
                                style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', height: 'auto' }}
                                onClick={() => setStep(1)}
                            >
                                <Plus size={20} /> 피팅 추가
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className={styles.modalBody} style={{ padding: '2.5rem', overflowY: 'auto' }}>
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>

                                    {/* History Cards */}
                                    {history.map(item => (
                                        <motion.div
                                            key={item.id}
                                            className={styles.mediaCard}
                                            onClick={() => {
                                                setSelectedFitting(item);
                                                setResultUrl(item.result_url || item.image_url);
                                                setStep(4);
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className={styles.mediaPlaceholder}>
                                                <img src={item.result_url} alt="Fitting" />
                                                <div className={styles.mediaInfo} style={{ padding: '0.6rem 1rem', bottom: 0, left: 0, right: 0, borderRadius: '0 0 16px 16px' }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.outfit_name || item.description || '피팅'}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                {history.length === 0 && (
                                    <div style={{ padding: '4rem', textAlign: 'center', color: '#ccc' }}>
                                        <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <p>아직 피팅 기록이 없습니다. 첫 피팅을 추가해보세요!</p>
                                    </div>
                                )}

                                {/* Delete Character Button at the bottom */}
                                <div style={{ marginTop: '3rem', paddingTop: '2.5rem', borderTop: '1.5px solid rgba(0,0,0,0.05)', textAlign: 'center', opacity: 0.8 }}>
                                    <button
                                        type="button"
                                        onClick={deleteCharacter}
                                        disabled={isDeletingChar}
                                        style={{
                                            padding: '0.8rem 1.6rem',
                                            borderRadius: '16px',
                                            border: needsConfirmChar ? 'none' : '1px solid #efefef',
                                            background: needsConfirmChar
                                                ? 'linear-gradient(135deg, #ff4757, #ff6b81)'
                                                : isDeletingChar ? '#f8f9fa' : 'none',
                                            color: needsConfirmChar ? 'white' : 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            cursor: isDeletingChar ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            margin: '0 auto',
                                            transform: needsConfirmChar ? 'scale(1.05)' : 'scale(1)',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }}
                                    >
                                        {isDeletingChar ? (
                                            <RotateCcw className="spin" size={16} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        {isDeletingChar ? '캐릭터 삭제 중...' : needsConfirmChar ? '정말 캐릭터를 삭제할까요?' : '캐릭터 삭제'}
                                    </button>
                                    {needsConfirmChar && (
                                        <p style={{ fontSize: '0.78rem', color: 'var(--accent-pink)', marginTop: '0.8rem', fontWeight: 600, animation: 'pulse 1.5s infinite ease-in-out' }}>
                                            * 피팅 히스토리 및 이미지가 모두 함께 삭제됩니다.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ maxWidth: '700px', margin: '0 auto' }}>
                                {/* 옷 이름 입력 (필수) - 업로드창 위 */}
                                <input
                                    type="text"
                                    value={outfitName}
                                    onChange={e => setOutfitName(e.target.value)}
                                    placeholder="복장 이름을 입력하세요."
                                    style={{
                                        width: '100%',
                                        marginBottom: '0.5rem',
                                        padding: '0.9rem 1.2rem',
                                        borderRadius: '16px',
                                        border: `1.5px solid ${outfitName.trim() ? 'var(--border-color)' : 'rgba(244,91,126,0.5)'}`,
                                        fontSize: '0.95rem',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        background: 'var(--bg-secondary)'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                                    onBlur={e => (e.target.style.borderColor = outfitName.trim() ? 'var(--border-color)' : 'rgba(244,91,126,0.5)')}
                                />
                                {!outfitName.trim() && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', marginBottom: '0.8rem', paddingLeft: '0.4rem' }}>옷 이름은 필수입니다.</p>
                                )}
                                <div
                                    className={`${styles.uploadDropzone} ${isDragging ? styles.dragging : ''}`}
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={onDrop}
                                    onClick={() => !outfitPreview && document.getElementById('outfitInput')?.click()}
                                    style={{ height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: outfitPreview ? 'default' : 'pointer', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
                                >
                                    {uploading ? (
                                        <RotateCcw className="spin" size={48} color="var(--accent-primary)" />
                                    ) : outfitPreview ? (
                                        <>
                                            <img src={outfitPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOutfitPreview(null); setOutfitUrl(null); document.getElementById('outfitInput')?.click(); }}
                                                style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '8px', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                            >교체</button>
                                        </>
                                    ) : (
                                        <>
                                            <Shirt size={64} color={isDragging ? 'var(--accent-primary)' : '#ddd'} />
                                            <p style={{ marginTop: '1.5rem', fontWeight: 700 }} className={styles.desktopOnly}>이미지를 드래그하거나 클릭하여 업로드</p>
                                            <p style={{ marginTop: '1.5rem', fontWeight: 700 }} className={styles.mobileOnly}>눌러서 이미지를 업로드</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>상의, 하의, 원피스 등 무엇이든 좋아요</p>
                                        </>
                                    )}
                                    <input id="outfitInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                                </div>
                                <textarea
                                    value={outfitDescription}
                                    onChange={e => setOutfitDescription(e.target.value)}
                                    placeholder="복장 설명을 입력하세요. (예: 흰색 린넨 셔츠에 베이지 슬랙스)"
                                    style={{
                                        width: '100%',
                                        marginTop: '1.2rem',
                                        padding: '1rem 1.2rem',
                                        borderRadius: '16px',
                                        border: '1.5px solid var(--border-color)',
                                        fontSize: '0.95rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        minHeight: '90px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        background: 'var(--bg-secondary)'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                />
                                <textarea
                                    value={outfitExclusion}
                                    onChange={e => setOutfitExclusion(e.target.value)}
                                    placeholder="이미지에서 제외해야 하는 요소를 입력하세요. (예: 신발, 가방, 마스크)"
                                    style={{
                                        width: '100%',
                                        marginTop: '1.2rem',
                                        padding: '1rem 1.2rem',
                                        borderRadius: '16px',
                                        border: '1.5px solid var(--border-color)',
                                        fontSize: '0.95rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        minHeight: '90px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        background: 'var(--bg-secondary)'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                />
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                                <div className="card" style={{ aspectRatio: '1/1', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', marginBottom: '1.5rem', borderRadius: '32px' }}>
                                    {loading ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', width: '100%' }}>
                                            <Sparkles className="spin" size={64} color="var(--accent-primary)" />
                                            <div style={{ marginTop: '1.5rem', minHeight: '2rem' }}>
                                                <AnimatePresence mode="wait">
                                                    <motion.p
                                                        key={loadingMsgIdx}
                                                        initial={{ y: 16, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ y: -16, opacity: 0 }}
                                                        transition={{ duration: 0.35 }}
                                                        style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}
                                                    >
                                                        {FITTING_LOADING_MESSAGES[loadingMsgIdx]}
                                                    </motion.p>
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    ) : resultUrl ? (
                                        <img src={resultUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Fitting Result" />
                                    ) : null}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>따끈따끈한 새 옷을 입었어요!</h3>
                                <div className="card" style={{ aspectRatio: '1/1', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '2rem', borderRadius: '32px' }}>
                                    <img src={resultUrl!} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Fitting Result" />
                                </div>

                                {/* New Delete Button below image for Step 3 */}
                                <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={(e) => deleteFitting(e)}
                                        disabled={isDeleting}
                                        style={{
                                            padding: '0.8rem 1.6rem',
                                            borderRadius: '16px',
                                            border: needsConfirm ? 'none' : '1px solid #efefef',
                                            background: needsConfirm
                                                ? 'linear-gradient(135deg, #ff4757, #ff6b81)'
                                                : isDeleting ? '#f8f9fa' : 'none',
                                            color: needsConfirm ? 'white' : 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            margin: '0 auto',
                                            transform: needsConfirm ? 'scale(1.05)' : 'scale(1)',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }}
                                    >
                                        {isDeleting ? (
                                            <RotateCcw className="spin" size={16} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        {isDeleting ? '삭제 중...' : needsConfirm ? '삭제할까요?' : '삭제'}
                                    </button>
                                    {needsConfirm && (
                                        <p style={{ fontSize: '0.78rem', color: 'var(--accent-pink)', marginTop: '0.8rem', fontWeight: 600, animation: 'pulse 1.5s infinite ease-in-out' }}>
                                            * 이 피팅 기록이 삭제됩니다.
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <button className={styles.outlineBtn} onClick={() => setStep(0)}>다른 기록 보기</button>
                                    <button className="gradient-btn" onClick={() => setStep(1)}>새 옷 더 입히기</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && selectedFitting && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    maxWidth: '600px',
                                    margin: '0 auto',
                                    textAlign: 'center',
                                    width: '100%'
                                }}
                            >
                                <div
                                    className={styles.mobileFullWidthImg} // Custom class for mobile full width
                                    style={{
                                        aspectRatio: '1/1',
                                        background: '#f8f9fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        borderRadius: '32px',
                                        width: '100%'
                                    }}
                                >
                                    <img src={resultUrl!} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt={selectedFitting.outfit_name} />
                                </div>

                                {/* New Delete Button below image for Step 4 */}
                                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={(e) => deleteFitting(e)}
                                        disabled={isDeleting}
                                        style={{
                                            padding: '0.8rem 1.6rem',
                                            borderRadius: '16px',
                                            border: needsConfirm ? 'none' : '1px solid #efefef',
                                            background: needsConfirm
                                                ? 'linear-gradient(135deg, #ff4757, #ff6b81)'
                                                : isDeleting ? '#f8f9fa' : 'none',
                                            color: needsConfirm ? 'white' : 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            margin: '0 auto',
                                            transform: needsConfirm ? 'scale(1.05)' : 'scale(1)',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }}
                                    >
                                        {isDeleting ? (
                                            <RotateCcw className="spin" size={16} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        {isDeleting ? '삭제 중...' : needsConfirm ? '삭제할까요?' : '삭제'}
                                    </button>
                                    {needsConfirm && (
                                        <p style={{ fontSize: '0.78rem', color: 'var(--accent-pink)', marginTop: '0.8rem', fontWeight: 600, animation: 'pulse 1.5s infinite ease-in-out' }}>
                                            * 이 피팅 기록이 삭제됩니다.
                                        </p>
                                    )}
                                </div>

                                <style jsx>{`
                                    @media (max-width: 768px) {
                                        div.${styles.mobileFullWidthImg} {
                                            border-radius: 0 !important;
                                            background: none !important;
                                            box-shadow: none !important;
                                            border: none !important;
                                            width: calc(100% + 5rem) !important; /* Offset parent's 2.5rem padding * 2 */
                                            margin-left: -2.5rem !important; /* Move left by parent's padding */
                                            height: auto !important;
                                            aspect-ratio: auto !important;
                                        }
                                        div.${styles.mobileFullWidthImg} img {
                                            width: 100% !important;
                                            height: auto !important;
                                            display: block !important;
                                        }
                                    }
                                `}</style>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
