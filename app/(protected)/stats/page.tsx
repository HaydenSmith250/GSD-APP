'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ALL_ACHIEVEMENTS = [
    { id: 'first_blood',   name: 'First Blood',   icon: '🩸', description: 'Complete your first task' },
    { id: 'proof_of_work', name: 'Proof of Work',  icon: '📸', description: 'First photo verification' },
    { id: 'on_a_roll',     name: 'On a Roll',      icon: '🔥', description: '3-day streak' },
    { id: 'week_warrior',  name: 'Week Warrior',   icon: '💪', description: '7-day streak' },
    { id: 'century_club',  name: 'Century Club',   icon: '💯', description: 'Earn 100 XP total' },
    { id: 'grinder',       name: 'Grinder',        icon: '⚙️', description: '10 tasks completed' },
    { id: 'no_excuses',    name: 'No Excuses',     icon: '🎯', description: '25 proofs submitted' },
    { id: 'unstoppable',   name: 'Unstoppable',    icon: '🚀', description: '30-day streak' },
    { id: 'xp_machine',    name: 'XP Machine',     icon: '⚡', description: 'Earn 1,000 XP total' },
];

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                if (data.success) setStats(data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    // Build last 14 days of XP data, filling gaps with 0
    const chartData = useMemo(() => {
        if (!stats) return [];
        const log: { date: string; xp: number }[] = Array.isArray(stats.daily_xp_log) ? stats.daily_xp_log : [];
        const today = new Date();
        return Array.from({ length: 14 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (13 - i));
            const dateStr = d.toISOString().split('T')[0];
            const entry = log.find(e => e.date === dateStr);
            const xp = entry?.xp ?? 0;
            return {
                day: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                xp,
                fill: xp > 0 ? '#FBBF24' : 'rgba(255,255,255,0.06)',
            };
        });
    }, [stats]);

    const unlockedIds = useMemo(() => {
        if (!stats?.achievements) return new Set<string>();
        return new Set<string>((stats.achievements as { id: string }[]).map(a => a.id));
    }, [stats]);

    if (loading) return (
        <div className="p-10 text-center">
            <div className="animate-spin w-8 h-8 mx-auto border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
    );

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
                    {stats.longest_streak > 0 && (
                        <p className="text-[10px] mt-1" style={{ color: 'var(--accent-gold)' }}>
                            Best: {stats.longest_streak} days
                        </p>
                    )}
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

            {/* XP Over Time Chart */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card p-5">
                <h2 className="text-sm font-semibold text-white mb-1">XP Earned — Last 14 Days</h2>
                <p className="text-xs text-white/40 mb-4">Daily XP activity</p>
                <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}>
                        <XAxis
                            dataKey="day"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            interval={1}
                        />
                        <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                            itemStyle={{ color: '#FBBF24' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={((value: any) => [`${value ?? 0} XP`, '']) as any}
                        />
                        <Bar dataKey="xp" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Achievements */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white">Achievements</h2>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {unlockedIds.size}/{ALL_ACHIEVEMENTS.length} unlocked
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {ALL_ACHIEVEMENTS.map(a => {
                        const unlocked = unlockedIds.has(a.id);
                        return (
                            <div
                                key={a.id}
                                className="flex flex-col items-center text-center p-3 rounded-xl transition-all"
                                style={{
                                    background: unlocked ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${unlocked ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                }}
                                title={a.description}
                            >
                                <span className={`text-2xl mb-1 ${unlocked ? '' : 'grayscale opacity-25'}`}>
                                    {a.icon}
                                </span>
                                <p className={`text-[10px] font-semibold leading-tight ${unlocked ? 'text-white' : 'text-white/25'}`}>
                                    {a.name}
                                </p>
                                {unlocked && (
                                    <p className="text-[9px] mt-0.5" style={{ color: 'var(--accent-gold)' }}>✓ Unlocked</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
