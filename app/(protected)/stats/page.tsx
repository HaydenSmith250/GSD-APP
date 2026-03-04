'use client';

import { motion } from 'framer-motion';

export default function StatsPage() {
    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-white">Stats</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Your performance at a glance
                </p>
            </motion.div>

            {/* Level Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                        style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                        ⭐
                    </div>
                    <div className="flex-1">
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Current Level</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>Level 1 — Rookie</div>
                        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full" style={{ width: '0%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-blue))' }} />
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>0 / 100 XP to Level 2</div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: 'Total XP', value: '0', color: 'var(--accent-gold)' },
                    { label: 'Current Streak', value: '0 days', color: 'var(--accent-blue)' },
                    { label: 'Longest Streak', value: '0 days', color: 'var(--accent-green)' },
                    { label: 'Tasks Completed', value: '0', color: 'var(--text-primary)' },
                    { label: 'Tasks Verified', value: '0', color: 'var(--accent-green)' },
                    { label: 'Tasks Failed', value: '0', color: 'var(--accent-red)' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                        className="glass-card p-4"
                    >
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                        <div className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6"
            >
                <h2 className="text-lg font-semibold text-white mb-4">XP Over Time</h2>
                <div className="text-center py-12 space-y-3">
                    <div className="text-4xl">📊</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Charts will appear once you start earning XP</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Full stats dashboard coming in Phase 3</p>
                </div>
            </motion.div>

            {/* Achievements Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-6"
            >
                <h2 className="text-lg font-semibold text-white mb-4">Achievements</h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {['🏆', '🔥', '⚡', '💪', '🎯'].map((emoji, i) => (
                        <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-2xl opacity-20"
                            style={{ background: 'rgba(255,255,255,0.03)' }}>
                            {emoji}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
