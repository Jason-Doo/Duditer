'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Search, Venus, Mars } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterWizard from './components/CharacterWizard';
import FittingRoom from './components/FittingRoom';

export default function CharactersPage() {
    const [characters, setCharacters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);
    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        fetchCharacters();
    }, []);

    async function fetchCharacters() {
        try {
            setLoading(true);

            // Debug: Check if env markers are present
            console.log('Supabase Config Check:', {
                urlPresent: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                keyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            });

            const { data, error } = await supabase
                .from('characters')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase Query Error:', error);
                throw error;
            }
            setCharacters(data || []);
        } catch (error: any) {
            console.error('Final Error Catch:', error);
            if (typeof error === 'object') {
                try {
                    console.error('Error JSON:', JSON.stringify(error, null, 2));
                } catch (e) { }
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <span className={styles.category}>My Characters</span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        캐릭터 관리
                    </motion.h2>
                </div>
                <button
                    className="gradient-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
                    onClick={() => setShowWizard(true)}
                >
                    <Plus size={20} /> 캐릭터 추가
                </button>
            </header>

            <div className={styles.content} style={{ gridTemplateColumns: '1fr' }}>
                {loading ? (
                    <div className={styles.loadingPlaceholder}>데이터를 불러오는 중...</div>
                ) : characters.length === 0 ? (
                    <section className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>등록된 캐릭터가 없습니다.</p>
                        <button className={`${styles.outlineBtn}`} onClick={() => setShowWizard(true)}>첫 캐릭터 만들기</button>
                    </section>
                ) : (
                    <div className={styles.grid}>
                        {characters.map((char) => (
                            <motion.div
                                key={char.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={styles.mediaCard}
                                onClick={() => setSelectedCharacter(char)}
                            >
                                <div className={styles.mediaPlaceholder}>
                                    {char.front_view_url ? (
                                        <img src={char.front_view_url} alt={char.name} />
                                    ) : (
                                        <div className={styles.characterAvatar}>👤</div>
                                    )}
                                    <div className={styles.mediaInfo}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{char.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                {char.gender === '여성' ? (
                                                    <Venus size={16} color="#ff7675" strokeWidth={3} />
                                                ) : (
                                                    <Mars size={16} color="#74b9ff" strokeWidth={3} />
                                                )}
                                                <span>{char.gender}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showWizard && (
                    <div className={styles.modalOverlay}>
                        <CharacterWizard
                            onClose={() => setShowWizard(false)}
                            onComplete={() => {
                                setShowWizard(false);
                                fetchCharacters();
                            }}
                        />
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedCharacter && (
                    <FittingRoom
                        character={selectedCharacter}
                        onClose={() => setSelectedCharacter(null)}
                        onDelete={fetchCharacters}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}

