'use client';

import { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User as UserIcon, Smile, Move, Image as ImageIcon, Sparkles, MapPin, ChevronLeft } from 'lucide-react';

interface SceneDetailProps {
    scene: any;
    projectId: string;
    onClose: () => void;
    onSave: (data: any) => void;
}

export default function SceneDetailModal({ scene, projectId, onClose, onSave }: SceneDetailProps) {
    const [activeTab, setActiveTab] = useState<'prompt' | 'characters'>('prompt');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);
    const [characters, setCharacters] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        subject: scene.prompts?.subject || '',
        environment: scene.prompts?.environment || '',
        characterDetails: scene.prompts?.characterDetails || {} // { charId: { expression: '', action: '', ref: '' } }
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCharacters();
    }, []);

    async function fetchCharacters() {
        const { data } = await supabase.from('characters').select('*');
        if (data) setCharacters(data);
    }

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedPrompts = {
                subject: formData.subject,
                environment: formData.environment,
                characterDetails: formData.characterDetails
            };

            // Mock AI Summary (In real case, call AI API)
            const aiSummary = `${formData.subject.slice(0, 20)}... (${Object.keys(formData.characterDetails).length} characters)`;

            const { error } = await supabase
                .from('scenes')
                .update({
                    prompts: updatedPrompts,
                    ai_summary: aiSummary
                })
                .eq('id', scene.id);

            if (error) throw error;
            onSave({ ...scene, prompts: updatedPrompts, ai_summary: aiSummary });
            onClose();
        } catch (error) {
            console.error('Error saving scene:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
            >
                <header className={styles.modalHeader} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
                    <div style={{ justifySelf: 'start' }}>
                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}
                        >
                            <ChevronLeft size={28} />
                        </button>
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>장면 #{scene.order_index} 편집</h2>
                    <div style={{ justifySelf: 'end' }}>
                        {/* Empty for symmetry or add a Save button icon here if needed */}
                    </div>
                </header>

                <div className={styles.tabContainer} style={{ margin: '1rem 0' }}>
                    <button className={`${styles.tabItem} ${activeTab === 'prompt' ? styles.tabActive : ''}`} onClick={() => setActiveTab('prompt')}>프롬프트</button>
                    <button className={`${styles.tabItem} ${activeTab === 'characters' ? styles.tabActive : ''}`} onClick={() => setActiveTab('characters')}>등장인물 ({characters.length})</button>
                </div>

                <div className={styles.modalBody}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'prompt' ? (
                            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>
                                        <Sparkles size={14} className={styles.labelIcon} /> 주제 프롬프트
                                    </label>
                                    <textarea
                                        className={styles.textInput}
                                        style={{ minHeight: '80px' }}
                                        placeholder="이 장면의 핵심 주제를 입력하세요..."
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>
                                        <MapPin size={14} className={styles.labelIcon} /> 환경 프롬프트
                                    </label>
                                    <textarea
                                        className={styles.textInput}
                                        style={{ minHeight: '80px' }}
                                        placeholder="배경, 시간대, 날씨 등을 입력하세요..."
                                        value={formData.environment}
                                        onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="chars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                                {characters.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>등록된 캐릭터가 없습니다. 메뉴에서 캐릭터를 먼저 생성해 주세요.</p>
                                ) : (
                                    characters.map((char) => (
                                        <div key={char.id} className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{char.name[0]}</div>
                                                <h4 style={{ fontWeight: 800 }}>{char.name}</h4>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.inputLabel}><Smile size={14} /> 표정</label>
                                                    <input
                                                        type="text"
                                                        className={styles.textInput}
                                                        placeholder="(선택사항) 기쁨, 슬픔, 놀람 등"
                                                        value={formData.characterDetails[char.id]?.expression || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            characterDetails: {
                                                                ...formData.characterDetails,
                                                                [char.id]: { ...(formData.characterDetails[char.id] || {}), expression: e.target.value }
                                                            }
                                                        })}
                                                    />
                                                </div>
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.inputLabel}><Move size={14} /> 행동</label>
                                                    <input
                                                        type="text"
                                                        className={styles.textInput}
                                                        placeholder="(선택사항) 앉아있음, 달리는 중 등"
                                                        value={formData.characterDetails[char.id]?.action || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            characterDetails: {
                                                                ...formData.characterDetails,
                                                                [char.id]: { ...(formData.characterDetails[char.id] || {}), action: e.target.value }
                                                            }
                                                        })}
                                                    />
                                                </div>
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.inputLabel}><ImageIcon size={14} /> 참고</label>
                                                    <input
                                                        type="text"
                                                        className={styles.textInput}
                                                        placeholder="(선택사항) 참고할 스타일이나 특징"
                                                        value={formData.characterDetails[char.id]?.ref || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            characterDetails: {
                                                                ...formData.characterDetails,
                                                                [char.id]: { ...(formData.characterDetails[char.id] || {}), ref: e.target.value }
                                                            }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <footer className={styles.modalFooter}>
                    <button className="gradient-btn" style={{ width: '100%' }} onClick={handleSave} disabled={loading}>
                        <Save size={18} /> {loading ? '저장 중...' : '프롬프트 저장'}
                    </button>
                </footer>
            </motion.div >
        </div >
    );
}
