'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { calculateLevel } from '@/lib/gamification';

export default function XPBar() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                if (data.success && data.data) {
                    setStats(data.data);
                }
            } catch (err) {
                console.error(err);
            }
        }
        loadStats();

        // Refresh every 30s to keep in sync with task completions
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    const { level, progress } = calculateLevel(stats.total_xp);

    return (
        <div className="flex items-center gap-3 w-full max-w-sm ml-auto bg-black/40 border border-white/5 rounded-full px-3 py-1.5 backdrop-blur-md">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-500 font-bold text-xs ring-1 ring-yellow-500/50">
                {level}
            </div>
            <div className="flex-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                    <span>XP</span>
                    <span>{stats.total_xp.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full"
                    />
                </div>
            </div>
            <div className="text-lg" title={`${stats.current_streak} Day Streak`}>
                {stats.current_streak > 0 ? '🔥' : '🧊'}
            </div>
        </div>
    );
}
