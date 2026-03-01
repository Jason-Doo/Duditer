'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
    openPreview: (config: PreviewConfig) => void;
    closeModal: () => void;
}

interface PreviewConfig {
    url: string;
    type: 'image' | 'video';
    title?: string;
    actions?: ReactNode; // Context-specific buttons
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<PreviewConfig | null>(null);

    const openPreview = (newConfig: PreviewConfig) => setConfig(newConfig);
    const closeModal = () => setConfig(null);

    return (
        <ModalContext.Provider value={{ openPreview, closeModal }}>
            {children}
            {config && <GlobalMediaModal config={config} onClose={closeModal} />}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
}

// Internal Modal Component
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Maximize2 } from 'lucide-react';
import styles from '../app/page.module.css';

function GlobalMediaModal({ config, onClose }: { config: PreviewConfig; onClose: () => void }) {
    return (
        <div className={styles.modalOverlay} style={{ padding: 0 }} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={styles.fullPreviewContainer}
                onClick={(e) => e.stopPropagation()}
            >
                <header className={styles.previewHeader}>
                    <div className={styles.previewTitle}>
                        <h3>{config.title || '미리보기'}</h3>
                    </div>
                    <div className={styles.previewActions}>
                        <button className={styles.previewBtn} title="다운로드"><Download size={20} /></button>
                        <button className={styles.previewBtn} title="공유"><Share2 size={20} /></button>
                        <button onClick={onClose} className={styles.previewClose}><X size={24} /></button>
                    </div>
                </header>

                <div className={styles.previewBody}>
                    {config.type === 'image' ? (
                        <img src={config.url} alt="Preview" className={styles.mainMedia} />
                    ) : (
                        <video src={config.url} controls autoPlay className={styles.mainMedia} />
                    )}
                </div>

                {config.actions && (
                    <footer className={styles.previewFooter}>
                        {config.actions}
                    </footer>
                )}
            </motion.div>
        </div>
    );
}
