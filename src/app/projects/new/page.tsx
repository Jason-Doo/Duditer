'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Clapperboard, Image as ImageIcon, Type, Sparkles, Layout, Save, Plus } from 'lucide-react';
import Link from 'next/link';

const ASPECT_RATIOS = [
    { id: '1:1', label: '1:1비율\n(정사각형)', width: 40, height: 40 },
    { id: '16:9', label: '16:9비율\n(유튜브)', width: 64, height: 36 },
    { id: '9:16', label: '9:16비율\n(숏폼)', width: 36, height: 64 },
    { id: '4:3', label: '4:3비율\n(클래식)', width: 48, height: 36 },
];

export default function NewProjectPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        aspectRatio: '16:9'
    });
    const [loading, setLoading] = useState(false);
    const [projectId, setProjectId] = useState<string | null>(null);

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const createProject = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .insert([
                    {
                        title: formData.title,
                        subject: formData.subject,
                        aspect_ratio: formData.aspectRatio,
                        status: 'in-progress'
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            setProjectId(data.id);
            setStep(3);
        } catch (error) {
            console.error('Error creating project:', error);
            alert('프로젝트 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.main}>
            <div className={styles.wizardContainer}>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={styles.wizardStep}
                        >
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className={styles.wizardTitle}
                            >
                                프로젝트명과 주제를 입력해주세요!
                            </motion.h1>

                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>
                                    <Type size={14} className={styles.labelIcon} /> 프로젝트 이름
                                </label>
                                <input
                                    type="text"
                                    className={styles.textInput}
                                    placeholder="예: 우리 둘만의 달나라 여행"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>
                                    <Sparkles size={14} className={styles.labelIcon} /> 주제
                                </label>
                                <input
                                    type="text"
                                    className={styles.textInput}
                                    placeholder="(선택사항) 무엇에 관한 이야기인가요?"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <button
                                className="gradient-btn"
                                style={{ marginTop: '1rem', width: '100%', opacity: formData.title ? 1 : 0.5 }}
                                disabled={!formData.title}
                                onClick={handleNext}
                            >
                                <ArrowRight size={16} /> 다음 단계로
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={styles.wizardStep}
                        >
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className={styles.wizardTitle}
                            >
                                결과물 기본 조건이 어떻게 되나요?
                            </motion.h1>

                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>
                                    <Layout size={14} className={styles.labelIcon} /> 영상 비율 설정
                                </label>
                                <div className={styles.ratioGrid}>
                                    {ASPECT_RATIOS.map((ratio) => (
                                        <div
                                            key={ratio.id}
                                            className={`${styles.ratioOption} ${formData.aspectRatio === ratio.id ? styles.ratioActive : ''}`}
                                            onClick={() => setFormData({ ...formData, aspectRatio: ratio.id })}
                                        >
                                            <div className={styles.ratioBox} style={{ width: ratio.width, height: ratio.height }}></div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'pre-wrap', textAlign: 'center' }}>{ratio.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className={styles.outlineBtn} style={{ flex: 1 }} onClick={handleBack}>
                                    이전으로
                                </button>
                                <button
                                    className="gradient-btn"
                                    style={{ flex: 2 }}
                                    onClick={createProject}
                                    disabled={loading}
                                >
                                    <Plus size={16} /> {loading ? '생성 중...' : '프로젝트 생성'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={styles.wizardStep}
                        >
                            <div style={{ color: '#00b894', marginBottom: '1rem' }}>
                                <CheckCircle2 size={64} />
                            </div>
                            <h1 className={styles.wizardTitle}>프로젝트가 생성되었습니다!</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                                이제 컨텐츠를 만들러 가볼까요?
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                                <Link href={`/projects/${projectId}/scenarios`} className={styles.ratioOption} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <Clapperboard size={32} color="var(--accent-primary)" />
                                    <span style={{ fontWeight: 800 }}>시나리오 만들기</span>
                                </Link>
                                <Link href={`/projects/${projectId}/scenes`} className={styles.ratioOption} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <ImageIcon size={32} color="var(--accent-pink)" />
                                    <span style={{ fontWeight: 800 }}>장면 만들기</span>
                                </Link>
                            </div>

                            <Link href="/" className={styles.outlineBtn} style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
                                나중에 하기
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
