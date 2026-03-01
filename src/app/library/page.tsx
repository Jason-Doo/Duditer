'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    Video,
    Image as ImageIcon,
    User,
    Shirt,
    Search,
    Calendar,
    Clock
} from 'lucide-react';
import { useModal } from '@/components/ModalProvider';
import LibraryDetail from './components/LibraryDetail';

type LibraryTab = 'all' | 'video' | 'scene' | 'character' | 'fitting';

interface LibraryItem {
    id: string;
    type: LibraryTab;
    url: string;
    thumbnail_url?: string;
    title: string;
    description?: string;
    created_at: string;
}

export default function LibraryPage() {
    const [activeTab, setActiveTab] = useState<LibraryTab>('all');
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

    useEffect(() => {
        fetchLibraryData();
    }, [activeTab]);

    async function fetchLibraryData() {
        try {
            setLoading(true);
            let allItems: LibraryItem[] = [];

            // 1. Fetch from 'library' table (Videos, Scenes)
            if (activeTab === 'all' || activeTab === 'video' || activeTab === 'scene') {
                let query = supabase.from('library').select('*');
                if (activeTab !== 'all') {
                    query = query.eq('type', activeTab);
                }
                const { data: libData } = await query.order('created_at', { ascending: false });
                if (libData) {
                    allItems = [...allItems, ...libData.map((item: any) => ({
                        id: item.id,
                        type: item.type as LibraryTab,
                        url: item.url,
                        thumbnail_url: item.thumbnail_url || item.url,
                        title: item.type === 'video' ? '생성된 영상' : '생성된 장면',
                        created_at: item.created_at
                    }))];
                }
            }

            // 2. Fetch from 'characters' table
            if (activeTab === 'all' || activeTab === 'character') {
                const { data: charData } = await supabase
                    .from('characters')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (charData) {
                    allItems = [...allItems, ...charData.map((item: any) => ({
                        id: item.id,
                        type: 'character' as LibraryTab,
                        url: item.front_view_url,
                        thumbnail_url: item.front_view_url,
                        title: item.name,
                        created_at: item.created_at
                    }))];
                }
            }

            // 3. Fetch from 'fittings' table
            if (activeTab === 'all' || activeTab === 'fitting') {
                const { data: fitData } = await supabase
                    .from('fittings')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (fitData) {
                    allItems = [...allItems, ...fitData.map((item: any) => ({
                        id: item.id,
                        type: 'fitting' as LibraryTab,
                        url: item.result_url || item.image_url,
                        thumbnail_url: item.result_url || item.image_url,
                        title: item.outfit_name || '피팅 결과',
                        description: item.description,
                        created_at: item.created_at
                    }))];
                }
            }

            // Sort all by created_at desc
            allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setItems(allItems);
        } catch (error) {
            console.error('Error fetching library data:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const tabs: { id: LibraryTab; label: string; icon: any }[] = [
        { id: 'all', label: '전체', icon: LayoutGrid },
        { id: 'video', label: '영상', icon: Video },
        { id: 'scene', label: '장면', icon: ImageIcon },
        { id: 'character', label: '캐릭터', icon: User },
        { id: 'fitting', label: '피팅', icon: Shirt },
    ];

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <span className={styles.category}>My Library</span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        라이브러리
                    </motion.h2>
                </div>

                <div style={{ position: 'relative', width: '300px' }} className={styles.desktopOnly}>
                    <Search
                        size={18}
                        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
                    />
                    <input
                        type="text"
                        placeholder="검색어를 입력하세요..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            borderRadius: '16px',
                            border: '1.5px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            fontSize: '0.9rem',
                            outline: 'none'
                        }}
                    />
                </div>
            </header>

            <div className={styles.tabContainer} style={{ marginBottom: '2rem' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={16} /> <span className={styles.tabLabel}>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className={styles.content} style={{ gridTemplateColumns: '1fr' }}>
                {loading ? (
                    <div className={styles.loadingPlaceholder}>
                        <Clock className="spin" size={32} style={{ marginBottom: '1rem' }} />
                        <p>라이브러리를 불러오는 중...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'transparent' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>검색 결과가 없습니다.</p>
                    </div>
                ) : (
                    <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                        <AnimatePresence mode='popLayout'>
                            {filteredItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`${styles.mediaCard} card`}
                                    style={{ overflow: 'hidden' }}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className={styles.mediaPlaceholder}>
                                        <img
                                            src={item.thumbnail_url || item.url}
                                            alt={item.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div
                                            className={styles.projectBadge}
                                            style={{
                                                position: 'absolute',
                                                top: '1rem',
                                                right: '1rem',
                                                background: 'rgba(255,255,255,0.9)',
                                                color: 'var(--text-primary)',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '8px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800
                                            }}
                                        >
                                            {tabs.find(t => t.id === item.type)?.label}
                                        </div>
                                        <div className={styles.mediaInfo} style={{ padding: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>{item.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', opacity: 0.6 }}>
                                                <Calendar size={12} />
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <LibraryDetail
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
