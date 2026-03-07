'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { calculateLevel } from '@/lib/level-utils';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        href: '/chat',
        label: 'Chat',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        href: '/tasks',
        label: 'Tasks',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
        ),
    },
    {
        href: '/stats',
        label: 'Stats',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch('/api/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.data); });

        const channel = supabase
            .channel('sidebar-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stats' }, (payload) => {
                if (payload.new) setStats(payload.new);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const levelInfo = stats ? calculateLevel(stats.total_xp) : null;

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    }

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r"
                style={{
                    width: 'var(--sidebar-width)',
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--bg-card-border)',
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--bg-card-border)' }}>
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                        style={{
                            background: 'linear-gradient(135deg, #3B82F6, #10B981)',
                            boxShadow: '0 0 16px rgba(59, 130, 246, 0.25)',
                        }}
                    >
                        GSD
                    </div>
                    <div>
                        <div className="font-semibold text-sm text-white">Get Shit Done</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>v1.0</div>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileHover={{ x: 2 }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative"
                                    style={{
                                        color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                        background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                                            style={{ background: 'var(--accent-blue)' }}
                                        />
                                    )}
                                    {item.icon}
                                    {item.label}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* XP bar */}
                <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--bg-card-border)' }}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>
                            {stats ? `Level ${stats.level}` : 'Level —'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                            {stats ? `${stats.total_xp.toLocaleString()} XP` : '...'}
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                            animate={{ width: levelInfo ? `${levelInfo.progress}%` : '0%' }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-blue))' }}
                        />
                    </div>
                </div>

                {/* Logout */}
                <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--bg-card-border)' }}>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-colors hover:bg-white/5"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t"
                style={{
                    height: 'var(--bottom-nav-height)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    background: 'rgba(10, 10, 15, 0.9)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderColor: 'var(--bg-card-border)',
                }}
            >
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className="flex flex-col items-center gap-1 py-1 px-3">
                                <div style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-medium" style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-active"
                                        className="absolute top-0 w-8 h-0.5 rounded-full"
                                        style={{ background: 'var(--accent-blue)' }}
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
