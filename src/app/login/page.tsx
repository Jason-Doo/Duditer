'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Sparkles, Heart, Camera, Film, ArrowRight } from 'lucide-react';
import styles from '../page.module.css';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const handleGoogleLogin = async () => {
        setLoading(true);
        // Save persist preference in a cookie for the callback to read
        document.cookie = `sb-persist=${rememberMe}; path=/; max-age=${60 * 60 * 24 * 7}`;
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?refresh=1`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Login failed:', error);
            setLoading(false);
        }
    };

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'row',
            background: 'white',
            overflow: 'auto',
            flexWrap: 'wrap'
        }}>
            <style jsx global>{`
                @media (max-width: 968px) {
                    main { flex-direction: column !important; }
                    .visual-section { flex: none !important; min-height: 50vh !important; padding: 2rem !important; order: 1 !important; }
                    .login-section { flex: none !important; min-height: 60vh !important; padding: 3rem 1.5rem !important; order: 2 !important; }
                    h1 { font-size: 2.8rem !important; }
                    h2 { font-size: 1.8rem !important; }
                    .features-grid { grid-template-columns: 1fr !important; margin-top: 2rem !important; }
                }
            `}</style>
            {/* Visual Section - Left (Desktop) / Bottom (Mobile) */}
            <div className="visual-section" style={{
                flex: 1.2,
                position: 'relative',
                background: 'linear-gradient(135deg, #6d5dfc 0%, #3a328a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                minWidth: '320px'
            }}>
                {/* Decorative background patterns */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(244,91,126,0.3) 0%, rgba(244,91,126,0) 70%)',
                    filter: 'blur(60px)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-10%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(109,93,252,0.4) 0%, rgba(109,93,252,0) 70%)',
                    filter: 'blur(80px)',
                }} />

                <div style={{ position: 'relative', zIndex: 2, padding: '4rem', color: 'white' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            padding: '0.8rem 1.5rem',
                            borderRadius: '50px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            marginBottom: '2.5rem'
                        }}>
                            <Sparkles size={20} color="#ffde59" />
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em' }}>AI CONTENT STUDIO</span>
                        </div>

                        <h1 style={{
                            fontSize: '4.5rem',
                            fontWeight: 900,
                            lineHeight: 1.1,
                            letterSpacing: '-0.04em',
                            marginBottom: '2rem'
                        }}>
                            당신의 순간을<br />
                            <span style={{ color: '#ffde59' }}>AI</span>로 아름답게.
                        </h1>
                        <p style={{
                            fontSize: '1.25rem',
                            opacity: 0.8,
                            lineHeight: 1.7,
                            maxWidth: '540px',
                            fontWeight: 500
                        }}>
                            Duditer AI는 커플의 소중한 기억을 영화 같은 장면과 특별한 영상으로 만들어주는 창조적인 공간입니다. 오직 두 사람만을 위한 AI 스튜디오를 경험해보세요.
                        </p>
                    </motion.div>

                    <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '4rem' }}>
                        {[
                            { icon: <Film />, text: "시네마틱 영상 제작" },
                            { icon: <Heart />, text: "AI 커플 피팅룸" },
                            { icon: <Camera />, text: "고화질 장면 생성" },
                            { icon: <Sparkles />, text: "무한한 창의적 도구" }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'rgba(255,255,255,0.15)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {item.icon}
                                </div>
                                <span style={{ fontWeight: 600, opacity: 0.9 }}>{item.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Login Section - Right (Desktop) / Top (Mobile) */}
            <div className="login-section" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                position: 'relative',
                background: 'white',
                minWidth: '320px'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        width: '100%',
                        maxWidth: '420px',
                        textAlign: 'center'
                    }}
                >
                    {/* Logo for mobile or just as branding */}
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-pink))',
                        borderRadius: '20px',
                        margin: '0 auto 2.5rem',
                        boxShadow: '0 10px 30px rgba(109,93,252,0.2)'
                    }} />

                    <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.8rem' }}>반가워요!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '3.5rem', fontWeight: 500 }}>
                        Duditer AI 스튜디오에 로그인하여 시작하세요.
                    </p>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        style={{
                            width: '100%',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem',
                            background: 'white',
                            border: '1.5px solid #eee',
                            borderRadius: '20px',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            color: '#333',
                            marginBottom: '1.5rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '#eee';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {loading ? (
                            <div className="spin" style={{ width: '24px', height: '24px', border: '3px solid #eee', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
                        ) : (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.77l3.39-3.39C17.85 1.49 15.11 0 12 0 7.31 0 3.26 2.69 1.27 6.61l3.96 3.07C6.18 6.73 8.87 5.04 12 5.04z" />
                                    <path fill="#4285F4" d="M23.49 12.27c0-.86-.07-1.68-.21-2.47H12v4.69h6.44c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.61z" />
                                    <path fill="#FBBC05" d="M5.23 14.51c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.27 6.61C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l3.96-3.07z" />
                                    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.66-2.84c-1.01.68-2.31 1.08-3.95 1.08-3.05 0-5.63-2.06-6.55-4.83l-3.96 3.07C3.26 21.31 7.31 24 12 24z" />
                                </svg>
                                Google로 계속하기
                            </>
                        )}
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.8rem',
                        marginBottom: '1rem'
                    }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            userSelect: 'none'
                        }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: 'var(--accent-primary)',
                                    cursor: 'pointer'
                                }}
                            />
                            자동로그인
                        </label>
                    </div>

                    <div style={{ marginTop: '3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        계속 진행함으로써 Duditer의 <b>서비스 약관</b> 및 <b>개인정보 처리방침</b>에 동의하게 됩니다.
                    </div>
                </motion.div>

                {/* Footer Credits */}
                <div style={{
                    position: 'absolute',
                    bottom: '2rem',
                    fontSize: '0.8rem',
                    color: '#ccc',
                    fontWeight: 600
                }}>
                    © 2026 DUDITER AI STUDIO. ALL RIGHTS RESERVED.
                </div>
            </div>
        </main>
    );
}
