'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../page.module.css';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clapperboard, ImageIcon, PlayCircle, Plus } from 'lucide-react';
import Link from 'next/link';

import SceneDetailModal from '../components/SceneDetailModal';
import ScenarioWizard from '../components/ScenarioWizard';

export default function ProjectEditLayout() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'scenario' | 'scenes' | 'video'>('scenes');
    const [project, setProject] = useState<any>(null);
    const [selectedScene, setSelectedScene] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchProject();
        }
    }, [params.id]);

    async function fetchProject() {
        const { data } = await supabase.from('projects').select('*').eq('id', params.id).single();
        if (data) setProject(data);
    }

    const handleOpenModal = (scene: any) => {
        setSelectedScene(scene);
        setIsModalOpen(true);
    };

    const tabs = [
        { id: 'scenario', label: '시나리오', icon: <Clapperboard size={18} /> },
        { id: 'scenes', label: '장면', icon: <ImageIcon size={18} /> },
        { id: 'video', label: '영상', icon: <PlayCircle size={18} /> },
    ];

    return (
        <main className={styles.main} style={{ gap: '1rem' }}>
            <header className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => router.push('/')} className={styles.sideItem} style={{ width: '40px', height: '40px' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className={styles.headerTitle}>
                        <span className={styles.category}>{project?.aspect_ratio} • {project?.status}</span>
                        <motion.h2
                            key={project?.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            style={{ fontSize: '1.5rem' }}
                        >
                            {project?.title}
                        </motion.h2>
                    </div>
                </div>
            </header>

            <div className={styles.tabContainer} style={{ marginBottom: '1.5rem' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.id as any)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.editContainer} style={{ position: 'relative', minHeight: '60vh' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{ width: '100%' }}
                    >
                        {activeTab === 'scenario' && <ScenarioTab projectId={params.id as string} onOpenWizard={() => setIsWizardOpen(true)} />}
                        {activeTab === 'scenes' && <ScenesTab projectId={params.id as string} onOpenScene={handleOpenModal} />}
                        {activeTab === 'video' && <VideoTab projectId={params.id as string} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Modals moved to top level for fixed positioning */}
            <AnimatePresence>
                {isModalOpen && selectedScene && (
                    <SceneDetailModal
                        key="scene-detail-modal"
                        scene={selectedScene}
                        projectId={params.id as string}
                        onClose={() => setIsModalOpen(false)}
                        onSave={() => {
                            // Refresh scenes
                            window.dispatchEvent(new CustomEvent('refresh-scenes'));
                        }}
                    />
                )}
                {isWizardOpen && (
                    <ScenarioWizard
                        key="scenario-wizard-modal"
                        projectId={params.id as string}
                        onClose={() => setIsWizardOpen(false)}
                        onComplete={() => {
                            setIsWizardOpen(false);
                            // Can trigger further notification
                        }}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}

// Sub-components
function ScenarioTab({ projectId, onOpenWizard }: { projectId: string; onOpenWizard: () => void }) {
    const [scenario, setScenario] = useState<any>(null);

    useEffect(() => {
        fetchScenario();
    }, [projectId]);

    async function fetchScenario() {
        const { data } = await supabase.from('scenarios').select('*').eq('project_id', projectId).single();
        if (data) setScenario(data);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {!scenario ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '1rem' }}>시나리오 마법사</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>주제를 선정하여 5초 단위 스토리보드를 구성해보세요.</p>
                    <button className="gradient-btn" onClick={onOpenWizard}>시나리오 마법사 시작</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>확정된 시나리오</h3>
                        <button className={styles.tag} onClick={onOpenWizard}>다시 작성하기</button>
                    </div>
                    {scenario.content.map((item: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: '1.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{item.time}</span>
                            <p style={{ fontWeight: 700, margin: '0.25rem 0' }}>{item.description}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>초안: {item.visual}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ScenesTab({ projectId, onOpenScene }: { projectId: string, onOpenScene: (scene: any) => void }) {
    const [scenes, setScenes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScenes();
        window.addEventListener('refresh-scenes', fetchScenes);
        return () => window.removeEventListener('refresh-scenes', fetchScenes);
    }, [projectId]);

    async function fetchScenes() {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('scenes')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index', { ascending: true });

            if (data && data.length > 0) {
                setScenes(data);
            } else {
                const initialScenes = [
                    { project_id: projectId, order_index: 1, title: '첫 번째 장면' },
                    { project_id: projectId, order_index: 2, title: '두 번째 장면' },
                    { project_id: projectId, order_index: 3, title: '세 번째 장면' },
                ];
                const { data: created } = await supabase.from('scenes').insert(initialScenes).select();
                if (created) setScenes(created);
            }
        } finally {
            setLoading(false);
        }
    }

    const addScene = async () => {
        const nextIndex = scenes.length + 1;
        const { data } = await supabase
            .from('scenes')
            .insert([{ project_id: projectId, order_index: nextIndex, title: `${nextIndex}번째 장면` }])
            .select()
            .single();
        if (data) setScenes([...scenes, data]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
                {scenes.map((scene) => (
                    <SceneCard key={scene.id} scene={scene} onClick={() => onOpenScene(scene)} />
                ))}
            </div>
            <button className={styles.outlineBtn} onClick={addScene} style={{ borderStyle: 'dashed', background: 'rgba(109, 93, 252, 0.02)' }}>
                <Plus size={20} /> 장면 추가
            </button>
        </div>
    );
}

import { useModal } from '@/components/ModalProvider';

function SceneCard({ scene, onClick }: { scene: any; onClick: () => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const { openPreview } = useModal();

    const handlePreviewGallery = (url: string) => {
        openPreview({
            url: url,
            type: 'image',
            title: `${scene.order_index}번 장면 생성 결과물`,
            actions: (
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="gradient-btn" onClick={() => {/* Update scene frame logic */ }}>첫 프레임으로 설정</button>
                    <button className={styles.outlineBtn} style={{ color: 'white', borderColor: 'white' }} onClick={() => {/* Update scene frame logic */ }}>마지막 프레임으로 설정</button>
                </div>
            )
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>#{scene.order_index}. <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{scene.title}</span></h4>
            </div>

            {/* Integrated Swipeable Container */}
            <div className={styles.swipeContainer}>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -340, right: 0 }}
                    dragElastic={0.05}
                    dragSnapToOrigin={false}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => {
                        setTimeout(() => setIsDragging(false), 50);
                    }}
                    whileTap={{ cursor: 'grabbing' }}
                    onTap={() => {
                        if (!isDragging) {
                            onClick();
                        }
                    }}
                    className={styles.swipeWrapper}
                >
                    {/* Main Card Item */}
                    <div className={styles.mainCard}>
                        <div style={{ background: '#f1f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-color)' }}>
                            {scene.first_frame_url ? (
                                <img src={scene.first_frame_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Scene" />
                            ) : (
                                <ImageIcon size={32} opacity={0.2} />
                            )}
                        </div>
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                            {scene.ai_summary ? (
                                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{scene.ai_summary}</p>
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    클릭해서 프롬프트 입력, 왼쪽으로 밀어서 결과 확인
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Attached Gallery (moves with card) */}
                    <div className={styles.galleryArea}>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="card"
                                style={{ width: 85, height: 85, padding: 0, flexShrink: 0, overflow: 'hidden', cursor: 'pointer', borderRadius: '16px', border: '1px solid var(--border-color)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewGallery('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800');
                                }}
                            >
                                <div style={{ width: '100%', height: '100%', background: '#dfe6e9', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
                                    <ImageIcon size={20} opacity={0.3} />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function VideoTab({ projectId }: { projectId: string }) {
    return (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <PlayCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>아직 생성된 영상이 없습니다.</p>
        </div>
    );
}
