'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from '../app/page.module.css';

// Monochrome Rounded Icons as SVG components
const Icons = {
    Project: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
    ),
    Character: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Library: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 6 4 14M12 6v14M8 8v12M4 4v16" />
        </svg>
    ),
    Settings: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74V12a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
        </svg>
    )
};

const navItems = [
    { href: '/', icon: <Icons.Project />, label: '프로젝트' },
    { href: '/characters', icon: <Icons.Character />, label: '캐릭터' },
    { href: '/library', icon: <Icons.Library />, label: '라이브러리' },
];

const settingItem = { href: '/settings', icon: <Icons.Settings />, label: '설정' };

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check initial session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };
        checkSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    // Do not show navigation on login page OR if not logged in
    if (pathname === '/login' || pathname.startsWith('/auth/')) return null;
    if (!isLoggedIn) return null;

    return (
        <>
            {/* Sidebar (Desktop/Tablet) */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}></div>
                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.sideItem} ${pathname === item.href ? styles.sideActive : ''}`}
                            title={item.label}
                        >
                            {item.icon}
                        </Link>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <Link
                        href={settingItem.href}
                        className={`${styles.sideItem} ${pathname === settingItem.href ? styles.sideActive : ''}`}
                        title={settingItem.label}
                    >
                        {settingItem.icon}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className={styles.sideItem}
                        style={{ background: 'none', border: 'none' }}
                        title="로그아웃"
                    >
                        <LogOut size={24} />
                    </button>
                    <div className={styles.sidebarProfile}></div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className={styles.bottomNav}>
                {[...navItems, settingItem].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ''}`}
                    >
                        <div className={styles.navIcon}>{item.icon}</div>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
}
