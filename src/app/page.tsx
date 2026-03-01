'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import { Plus, LayoutGrid, Calendar, User, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed'>('in-progress');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  async function fetchProjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.category}>My Projects</span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            프로젝트 관리
          </motion.h2>
        </div>
        <Link href="/projects/new" className="gradient-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}>
          <Plus size={20} /> 새 프로젝트
        </Link>
      </header>

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabItem} ${activeTab === 'in-progress' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('in-progress')}
        >
          <Clock size={16} /> 진행 중
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === 'completed' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle2 size={16} /> 완성
        </button>
      </div>

      <div className={styles.projectContent}>
        {loading ? (
          <div className={styles.loadingPlaceholder}>프로젝트를 불러오는 중...</div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {activeTab === 'in-progress' ? '진행 중인 프로젝트가 없습니다.' : '완성된 프로젝트가 없습니다.'}
            </p>
            {activeTab === 'in-progress' && (
              <Link href="/projects/new" className={styles.outlineBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
                첫 번째 프로젝트 시작하기
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.projectGrid}>
            <AnimatePresence mode='popLayout'>
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`${styles.projectCard} card`}
                >
                  <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.projectThumbnail}>
                      {project.thumbnail_url ? (
                        <img src={project.thumbnail_url} alt={project.title} />
                      ) : (
                        <div className={styles.thumbnailPlaceholder}>
                          <LayoutGrid size={40} opacity={0.2} />
                        </div>
                      )}
                      <div className={styles.projectBadge}>
                        {project.aspect_ratio}
                      </div>
                    </div>
                    <div className={styles.projectInfo}>
                      <h3>{project.title}</h3>
                      <p>{project.subject || '주제 없음'}</p>
                      <div className={styles.projectMeta}>
                        <span><User size={12} /> {project.author_name || '사용자'}</span>
                        <span><Calendar size={12} /> {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
