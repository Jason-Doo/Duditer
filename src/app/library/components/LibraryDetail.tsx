'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Download, Share2, Trash2, Calendar, Clock, RotateCcw, Maximize2 } from 'lucide-react';
import styles from '../../page.module.css';
import { useEffect, useState } from 'react';

interface LibraryDetailProps {
    item: any;
    onClose: () => void;
}

export default function LibraryDetail({ item, onClose }: LibraryDetailProps) {
    const [message, setMessage] = useState<string | null>(null);

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

    const downloadFile = async () => {
        try {
            const response = await fetch(item.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${item.title || 'duditer_content'}_${item.id.slice(0, 8)}.${item.type === 'video' ? 'mp4' : 'png'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setMessage('다운로드를 완료했습니다.');
            setTimeout(() => setMessage(null), 2000);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(item.url, '_blank');
        }
    };

    const shareFile = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title || 'Duditer AI Content',
                    text: item.description || 'Check out my AI created content!',
                    url: item.url,
                });
                setMessage('공유를 완료했습니다.');
                setTimeout(() => setMessage(null), 2000);
            } catch (error) {
                console.error('Sharing failed:', error);
            }
        } else {
            // Fallback: Copy link
            navigator.clipboard.writeText(item.url);
            setMessage('링크가 복사되었습니다!');
            setTimeout(() => setMessage(null), 2000);
        }
    };

    if (!item) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={styles.modalContent}
                style={{
                    maxWidth: '1200px',
                    width: '95%',
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header Area matching FittingRoom style */}
                <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-secondary)', borderBottom: '1.5px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '80px 1fr 80px', alignItems: 'center', height: '80px', padding: '0 1.5rem' }}>
                    <div style={{ justifySelf: 'start' }}>
                        <button
                            onClick={onClose}
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
                            {item.title}
                        </h2>
                    </div>

                    <div style={{ justifySelf: 'end' }}>
                        {/* Right side empty to match FittingRoom header spacing */}
                    </div>
                </div>

                <div className={styles.modalBody} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
                    {/* Main Media Display Area */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        width: '100%',
                        minHeight: '400px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {item.type === 'video' ? (
                                <video
                                    src={item.url}
                                    controls
                                    autoPlay
                                    loop
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                                    }}
                                />
                            ) : (
                                <img
                                    src={item.url}
                                    alt={item.title}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                                    }}
                                    onClick={() => window.open(item.url, '_blank')}
                                />
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div style={{
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    background: 'var(--bg-secondary)'
                }}>
                    <button
                        onClick={downloadFile}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.9rem 1.8rem',
                            borderRadius: '16px',
                            background: 'white',
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            border: '1.5px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(109, 93, 252, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Download size={20} color="var(--accent-primary)" strokeWidth={2.5} />
                        다운로드
                    </button>

                    <button
                        onClick={shareFile}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.9rem 1.8rem',
                            borderRadius: '16px',
                            background: 'white',
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            border: '1.5px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.borderColor = 'var(--accent-pink)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(244, 91, 126, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Share2 size={20} color="var(--accent-pink)" strokeWidth={2.5} />
                        공유하기
                    </button>
                </div>
            </motion.div>

            {/* Success Message Toast */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: 'fixed',
                            bottom: '120px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            padding: '1rem 2rem',
                            borderRadius: '50px',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            zIndex: 20000,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
