'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    if (loading) return <div className="p-10 text-center"><div className="animate-spin w-8 h-8 mx-auto border-2 border-blue-500 border-t-transparent rounded-full" /></div>;

    if (!stats) return <div className="p-10 text-center text-white">Failed to load stats.</div>;

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-white">Stats & Progress</h1>
                <p className="text-sm text-white/60 mt-1">Numbers don't lie.</p>
            </div>

            {/* Level Card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative overflow-hidden rounded-2xl p-6 shadow-2xl" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <div className="text-9xl">🏆</div>
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-yellow-500 bg-black/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                        <span className="text-3xl font-black text-white">{stats.level}</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-widest text-yellow-500 uppercase">Current Level</h2>
                        <p className="text-3xl font-black text-white tracking-tight mt-1">{stats.total_xp.toLocaleString()} XP</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-5 flex flex-col items-center text-center">
                    <div className="text-3xl mb-2">🔥</div>
                    <p className="text-2xl font-bold text-white">{stats.current_streak}</p>
                    <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Day Streak</p>
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5 flex flex-col items-center text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-2xl font-bold text-white">{stats.tasks_completed}</p>
                    <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Tasks Done</p>
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-5 flex flex-col items-center text-center">
                    <div className="text-3xl mb-2">📸</div>
                    <p className="text-2xl font-bold text-white">{stats.tasks_verified}</p>
                    <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Verified Proofs</p>
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card p-5 flex flex-col items-center text-center">
                    <div className="text-3xl mb-2 grayscale opacity-50">💀</div>
                    <p className="text-2xl font-bold text-red-500">{stats.tasks_failed}</p>
                    <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Tasks Failed</p>
                </motion.div>
            </div>
        </div>
    );
}
