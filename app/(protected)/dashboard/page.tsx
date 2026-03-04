'use client';

import { motion } from 'framer-motion';

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Welcome back. Time to get shit done.
                </p>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Current Streak', value: '0 days', icon: '🔥', color: 'var(--accent-gold)' },
                    { label: 'Level', value: '1 — Rookie', icon: '⭐', color: 'var(--accent-blue)' },
                    { label: 'Tasks Today', value: '0 / 0', icon: '✅', color: 'var(--accent-green)' },
                    { label: 'Total XP', value: '0', icon: '💰', color: 'var(--accent-gold)' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="glass-card p-4 space-y-2"
                    >
                        <div className="text-lg">{stat.icon}</div>
                        <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Today's Tasks Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6"
            >
                <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Tasks</h2>
                <div className="text-center py-12 space-y-3">
                    <div className="text-4xl">📋</div>
                    <p style={{ color: 'var(--text-secondary)' }}>No tasks yet. Let&apos;s fix that.</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Task management coming in Phase 3</p>
                </div>
            </motion.div>

            {/* Recent Activity Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6"
            >
                <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
                <div className="text-center py-8 space-y-3">
                    <div className="text-4xl">⚡</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Your activity feed will appear here.</p>
                </div>
            </motion.div>
        </div>
    );
}
