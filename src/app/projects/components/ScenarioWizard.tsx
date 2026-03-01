'use client';

import { useState } from 'react';
import styles from '../../page.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, ArrowRight, Save, Sparkles, Plus, Type, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ScenarioWizardProps {
    projectId: string;
    onClose: () => void;
    onComplete: () => void;
}

export default function ScenarioWizard({ projectId, onClose, onComplete }: ScenarioWizardProps) {
    const [step, setStep] = useState(1);
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [storyboard, setStoryboard] = useState<any[]>([
        { id: 1, time: '0-5s', description: '', visual: '' },
        { id: 2, time: '5-10s', description: '', visual: '' },
        { id: 3, time: '10-15s', description: '', visual: '' },
    ]);

    const handleAISuggest = async () => {
        setLoading(true);
        // Mock AI call
        setTimeout(() => {
            setStoryboard([
                { id: 1, time: '0-5s', description: `${subject}의 도입부: 평화로운 시작`, visual: '햇살이 비치는 창가' },
                { id: 2, time: '5-10s', description: `${subject}의 중간: 뜻밖의 만남`, visual: '둘이 마주보고 웃는 모습' },
                { id: 3, time: '10-15s', description: `${subject}의 결말: 감동적인 마무리`, visual: '노을을 배경으로 한 뒷모습' },
            ]);
            setLoading(false);
            setStep(2);
        }, 1500);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('scenarios')
                .upsert({
                    project_id: projectId,
                    content: storyboard,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'project_id' });

            if (error) throw error;
            onComplete();
        } catch (error) {
            console.error('Error saving scenario:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={styles.modalContent}
                style={{ maxWidth: '700px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <header className={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Wand2 size={24} color="var(--accent-primary)" />
                        <h2 style={{ fontSize: '1.25rem' }}>시나리오 마법사</h2>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </header>

                <div className={styles.modalBody}>
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div key="wiz1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.modalScroll}>
                                <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                        <Type size={14} className={styles.labelIcon} /> 꿈꾸는 이야기를 들려주세요!
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>주제를 적어주시면 AI가 5초 단위 시나리오를 설계해 드립니다.</p>
                                </div>
                                <div className={styles.inputGroup}>
                                    <textarea
                                        className={styles.textInput}
                                        style={{ minHeight: '120px', fontSize: '1.1rem' }}
                                        placeholder="예: 우리 둘이 처음 만난 날의 떨림"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>
                                <button
                                    className="gradient-btn"
                                    style={{ width: '100%', marginTop: '1rem' }}
                                    onClick={handleAISuggest}
                                    disabled={!subject || loading}
                                >
                                    {loading ? 'AI가 시나리오를 짜는 중...' : 'AI 시나리오 생성하기'} <Sparkles size={16} />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="wiz2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.modalScroll}>
                                <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                        <MapPin size={24} className={styles.labelIcon} /> 시나리오를 확인하고 수정하세요!
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>AI가 제안한 시나리오를 바탕으로 세부 내용을 조정할 수 있습니다.</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {storyboard.map((item, idx) => (
                                        <div key={item.id} className="card" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem', background: '#fcfdfe' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-color)' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)' }}>SCENE #{idx + 1}</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.time}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <input
                                                    className={styles.textInput}
                                                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', border: 'none', background: 'transparent', fontWeight: 800 }}
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newWiz = [...storyboard];
                                                        newWiz[idx].description = e.target.value;
                                                        setStoryboard(newWiz);
                                                    }}
                                                />
                                                <input
                                                    className={styles.textInput}
                                                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                                                    placeholder="이미지/영상 초안 핵심 키워드"
                                                    value={item.visual}
                                                    onChange={(e) => {
                                                        const newWiz = [...storyboard];
                                                        newWiz[idx].visual = e.target.value;
                                                        setStoryboard(newWiz);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className={styles.outlineBtn} style={{ borderStyle: 'dashed' }} onClick={() => setStoryboard([...storyboard, { id: storyboard.length + 1, time: `${storyboard.length * 5}-${(storyboard.length + 1) * 5}s`, description: '', visual: '' }])}>
                                    <Plus size={16} /> 순서 추가
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <footer className={styles.modalFooter}>
                    {step === 2 && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className={styles.outlineBtn} style={{ flex: 1 }} onClick={() => setStep(1)}>뒤로</button>
                            <button className="gradient-btn" style={{ flex: 2 }} onClick={handleSave} disabled={loading}>
                                <Save size={16} /> {loading ? '저장 중...' : '시나리오 확정 및 저장'}
                            </button>
                        </div>
                    )}
                </footer>
            </motion.div >
        </div >
    );
}
