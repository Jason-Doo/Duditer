'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Save, ChevronRight, ChevronLeft, ChevronDown, Sparkles, Info } from 'lucide-react';
import styles from '../page.module.css';
import { DEFAULT_PROMPTS } from '@/lib/default_prompts';

// ─── Prompt Definitions ────────────────────────────────────────────
const PROMPTS: { key: string; label: string; defaultValue: string }[] = [
    { key: 'project_base_prompt', label: '프로젝트 기본 프롬프트', defaultValue: DEFAULT_PROMPTS.project_base_prompt },
    { key: 'character_create_prompt', label: '캐릭터 생성 프롬프트', defaultValue: DEFAULT_PROMPTS.character_create_prompt },
    { key: 'character_side_prompt', label: '캐릭터 측면 생성 프롬프트', defaultValue: DEFAULT_PROMPTS.character_side_prompt },
    { key: 'character_side_single_prompt', label: '캐릭터 측면 개별 생성 프롬프트', defaultValue: DEFAULT_PROMPTS.character_side_single_prompt },
    { key: 'fitting_system_prompt', label: '피팅 생성 프롬프트', defaultValue: DEFAULT_PROMPTS.fitting_system_prompt },
    { key: 'scenario_idea_prompt', label: '시나리오 아이디어 프롬프트', defaultValue: DEFAULT_PROMPTS.scenario_idea_prompt },
    { key: 'scenario_create_prompt', label: '시나리오 생성 프롬프트', defaultValue: DEFAULT_PROMPTS.scenario_create_prompt },
    { key: 'scene_create_prompt', label: '장면 생성 프롬프트', defaultValue: DEFAULT_PROMPTS.scene_create_prompt },
    { key: 'video_create_prompt', label: '영상 생성 프롬프트', defaultValue: DEFAULT_PROMPTS.video_create_prompt },
];

// ─── Accordion Item ─────────────────────────────────────────────────
function AccordionItem({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                }}
            >
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{label}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', color: 'var(--text-secondary)' }}>
                    <ChevronDown size={18} />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingBottom: '1rem' }}>
                            <textarea
                                value={value}
                                onChange={e => onChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem 1rem',
                                    borderRadius: '14px',
                                    border: '1.5px solid var(--border-color)',
                                    fontSize: '0.875rem',
                                    fontFamily: 'inherit',
                                    lineHeight: 1.65,
                                    resize: 'vertical',
                                    minHeight: '130px',
                                    outline: 'none',
                                    background: 'var(--bg-primary)',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── AI Settings Modal ──────────────────────────────────────────────
function AiSettingsModal({ onClose }: { onClose: () => void }) {
    const [prompts, setPrompts] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    // Body scroll lock
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
        async function load() {
            try {
                const { data } = await supabase.from('ai_settings').select('*').eq('id', 'default').single();
                const loaded: Record<string, string> = {};
                PROMPTS.forEach(p => { loaded[p.key] = data?.[p.key] ?? p.defaultValue; });
                setPrompts(loaded);
            } catch {
                const defaults: Record<string, string> = {};
                PROMPTS.forEach(p => { defaults[p.key] = p.defaultValue; });
                setPrompts(defaults);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleSave() {
        setSaving(true);
        try {
            await supabase.from('ai_settings').upsert({ id: 'default', ...prompts, updated_at: new Date().toISOString() });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose} style={{ touchAction: 'none', overscrollBehavior: 'none' } as any}>
            <motion.div
                className={styles.modalContent}
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{ width: 'var(--modal-width, 90%)', maxWidth: '640px', maxHeight: '85vh' }}
            >
                {/* Header */}
                <div className={styles.modalHeader} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ justifySelf: 'start' }}>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-primary)', padding: 0, transition: 'opacity 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.6')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                            <ChevronLeft size={28} />
                        </button>
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>AI 설정</h2>
                    <div style={{ justifySelf: 'end' }}>
                        <button className="gradient-btn" onClick={handleSave} disabled={saving}
                            style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {saved ? '✓ 저장됨' : saving ? '저장 중...' : <><Save size={18} /> 저장</>}
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className={styles.modalBody} style={{ padding: '0.5rem 1.8rem 1.5rem', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>불러오는 중...</div>
                    ) : (
                        PROMPTS.map(p => (
                            <AccordionItem
                                key={p.key}
                                label={p.label}
                                value={prompts[p.key] ?? p.defaultValue}
                                onChange={v => setPrompts(prev => ({ ...prev, [p.key]: v }))}
                            />
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// ─── Settings Menu Item ─────────────────────────────────────────────
function SettingMenuItem({ icon, iconBg, title, description, onClick }: { icon: React.ReactNode; iconBg: string; title: string; description: string; onClick: () => void }) {
    return (
        <button onClick={onClick}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', textAlign: 'left', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{description}</div>
            </div>
            <ChevronRight size={18} color="var(--text-secondary)" />
        </button>
    );
}

// ─── Page ───────────────────────────────────────────────────────────
export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState<'ai' | null>(null);

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <span className={styles.category}>Settings</span>
                    <h2>설정</h2>
                </div>
            </header>

            <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%', padding: '1rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.5rem 0.4rem', marginBottom: '0.3rem' }}>AI</p>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <SettingMenuItem
                        icon={<Sparkles size={20} />}
                        iconBg="linear-gradient(135deg, var(--accent-primary), #8e82ff)"
                        title="AI 설정"
                        description="프롬프트 7종 설정"
                        onClick={() => setActiveSection('ai')}
                    />
                </div>

                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1.2rem 0.4rem 0.3rem' }}>정보</p>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <SettingMenuItem
                        icon={<Info size={20} />}
                        iconBg="linear-gradient(135deg, #5e9bff, #4dd3f5)"
                        title="앱 정보"
                        description="Duditer AI v0.1"
                        onClick={() => { }}
                    />
                </div>
            </div>

            <AnimatePresence>
                {activeSection === 'ai' && <AiSettingsModal onClose={() => setActiveSection(null)} />}
            </AnimatePresence>
        </main>
    );
}
