'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, MessageSquare, User, TrendingUp } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sounds';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Stats', href: '/stats', icon: TrendingUp },
    { name: 'Coach', href: '/coach', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: User },
];

export default function Navigation() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleInteraction = () => {
        triggerHaptic();
        playSound('tab_switch');
    };

    if (!mounted) {
        return null; // Prevent hydration mismatch
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gsd-surface/85 backdrop-blur-2xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-20 px-2 max-w-md mx-auto relative">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleInteraction}
                            className="relative flex flex-col items-center justify-center w-full h-full gap-1 group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-1 bg-white/5 rounded-2xl"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}

                            <Icon
                                className={`w-6 h-6 relative z-10 transition-colors duration-300 ${isActive
                                    ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                                    : 'text-gray-500 group-hover:text-gray-300'
                                    }`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            <span className={`text-[10px] uppercase font-bold tracking-widest relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'
                                }`}>
                                {item.name}
                            </span>

                            {/* Active Tab Top Glow */}
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-neon-blue rounded-full shadow-[0_0_12px_rgba(0,229,255,0.8)]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
