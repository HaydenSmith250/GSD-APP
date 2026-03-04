'use client';

import { motion } from 'framer-motion';

export default function TasksPage() {
    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">Tasks</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Track and verify your accountability
                    </p>
                </div>
                <button
                    disabled
                    className="px-4 py-2.5 rounded-xl font-medium text-sm text-white opacity-40"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                >
                    + New Task
                </button>
            </motion.div>

            {/* Filter Tabs Placeholder */}
            <div className="flex gap-2">
                {['All', 'Pending', 'In Progress', 'Verified', 'Failed'].map((tab) => (
                    <button
                        key={tab}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                            background: tab === 'All' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                            color: tab === 'All' ? 'var(--accent-blue)' : 'var(--text-muted)',
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Empty State */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-12"
            >
                <div className="text-center space-y-3">
                    <div className="text-5xl">🎯</div>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                        No tasks yet. Let&apos;s fix that.
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Task CRUD & photo verification coming in Phase 3
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
