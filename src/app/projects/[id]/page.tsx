'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../page.module.css';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clapperboard, ImageIcon, PlayCircle, Plus } from 'lucide-react';
import Link from 'next/link';

import SceneDetailModal from '../components/SceneDetailModal';

export default function ProjectEditLayout() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'scenario' | 'scenes' | 'video'>('scenario');
    const [project, setProject] = useState<any>(null);
    const [selectedScene, setSelectedScene] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                        {activeTab === 'scenario' && <ScenarioTab projectId={params.id as string} />}
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
            </AnimatePresence>
        </main>
    );
}

import { Sparkles, Dice5, Wand2 } from 'lucide-react';

function ScenarioTab({ projectId }: { projectId: string }) {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [sceneCount, setSceneCount] = useState<number>(10);
    const [scenes, setScenes] = useState<any[]>([]);
    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingScenes, setLoadingScenes] = useState(false);

    useEffect(() => {
        fetchScenario();
    }, [projectId]);

    async function fetchScenario() {
        const { data } = await supabase.from('scenarios').select('*').eq('project_id', projectId).single();
        if (data && data.content) {
            setScenes(data.content);
            // Optionally set subject/description if they were saved in the db separately
        }
    }

    const handleRandomSubject = () => {
        const subjects = [
            '우주 정거장에서의 평화로운 하루',
            '비밀의 숲에서 길을 잃은 여행객',
            '과거로 돌아간 회사원의 좌충우돌 적응기',
            '인공지능 로봇과의 우정',
            '마법 학교 입학 첫날의 소동'
        ];
        setSubject(subjects[Math.floor(Math.random() * subjects.length)]);
    };

    const handleAIWrite = async () => {
        if (!subject) return alert('주제를 먼저 입력해주세요.');
        setLoadingAI(true);
        // Mock AI writing
        setTimeout(() => {
            setDescription(`${subject}에 대한 시나리오입니다.\n도입: 평화로운 일상 속에 찾아온 작은 변화를 보여줍니다.\n전개: 주인공이 겪는 뜻밖의 만남과 갈등을 통해 긴장감을 높입니다.\n결말: 갈등이 해소되며 감동적인 여운을 남기고 마무리됩니다.`);
            setLoadingAI(false);
        }, 1500);
    };

    const handleGenerateScenes = async () => {
        if (!description) return alert('시나리오 설명을 먼저 작성해주세요.');
        setLoadingScenes(true);
        // Mock Scene Generation based on sceneCount
        setTimeout(() => {
            const newScenes = Array.from({ length: sceneCount }).map((_, idx) => ({
                id: Date.now() + idx,
                time: `${idx * 5}-${(idx + 1) * 5}초`,
                content: `장면 ${idx + 1}: ${subject} 관련 사건 전개...`
            }));
            setScenes(newScenes);
            setLoadingScenes(false);

            // Auto save to Supabase
            saveScenarioToDB(newScenes);
        }, 1500);
    };

    const saveScenarioToDB = async (contentToSave: any[]) => {
        await supabase
            .from('scenarios')
            .upsert({
                project_id: projectId,
                content: contentToSave,
                updated_at: new Date().toISOString()
            }, { onConflict: 'project_id' });
    };

    const updateSceneContent = (index: number, newContent: string) => {
        const updatedScenes = [...scenes];
        updatedScenes[index].content = newContent;
        setScenes(updatedScenes);
        saveScenarioToDB(updatedScenes);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* 1. 주제 입력 영역 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>주제</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="시나리오 주제를 입력하세요..."
                            className={styles.textInput}
                            style={{ flex: 1, padding: '0.9rem 1.25rem' }}
                        />
                        <button className={styles.outlineBtn} onClick={handleRandomSubject} style={{ whiteSpace: 'nowrap' }}>
                            <Dice5 size={18} /> 랜덤 주제 선정
                        </button>
                    </div>
                </div>

                {/* 2. 시나리오 설명 영역 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>시나리오 설명</label>
                        <button className="gradient-btn" onClick={handleAIWrite} disabled={loadingAI || !subject} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            {loadingAI ? '생성 중...' : 'AI 시나리오 작성'} <Sparkles size={14} />
                        </button>
                    </div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="시나리오에 대한 상세 설명을 작성해주세요..."
                        className={styles.textInput}
                        style={{ minHeight: '150px', resize: 'vertical' }}
                    />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

                {/* 3. 씬 자동생성 영역 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>생성할 씬 수</span>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={sceneCount}
                            onChange={(e) => setSceneCount(Number(e.target.value))}
                            className={styles.textInput}
                            style={{ width: '80px', padding: '0.5rem', textAlign: 'center' }}
                        />
                    </div>
                    <button className="gradient-btn" onClick={handleGenerateScenes} disabled={loadingScenes || !description} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {loadingScenes ? '씬 생성 중...' : '씬 자동생성'} <Wand2 size={16} />
                    </button>
                </div>
            </div>

            {/* 4. 생성된 씬 리스트 영역 */}
            {scenes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>생성된 씬 목록 ({scenes.length}개)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {scenes.map((scene, idx) => (
                            <div key={scene.id} className="card" style={{ display: 'flex', background: '#fff', border: '1px solid var(--border-color)', padding: 0, overflow: 'hidden' }}>
                                {/* 좌측 시간 영역 */}
                                <div style={{
                                    width: '100px',
                                    background: 'rgba(109, 93, 252, 0.04)',
                                    borderRight: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>SCENE {idx + 1}</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{scene.time}</div>
                                    </div>
                                </div>

                                {/* 우측 씬 내용 영역 */}
                                <div style={{ flex: 1, padding: '1rem' }}>
                                    <textarea
                                        className={styles.textInput}
                                        style={{
                                            width: '100%',
                                            minHeight: '80px',
                                            border: 'none',
                                            background: 'transparent',
                                            padding: '0.5rem',
                                            resize: 'vertical',
                                            boxShadow: 'none'
                                        }}
                                        value={scene.content}
                                        onChange={(e) => updateSceneContent(idx, e.target.value)}
                                        placeholder="이 씬에서 일어날 구체적인 내용을 작성해주세요..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
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
