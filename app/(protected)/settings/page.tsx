'use client';

import { motion } from 'framer-motion';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Configure your coach and preferences
                </p>
            </motion.div>

            {/* Permanent Memory */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 space-y-4"
            >
                <div>
                    <h2 className="text-lg font-semibold text-white">Permanent Memory</h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Things the AI should always know about you
                    </p>
                </div>
                <textarea
                    disabled
                    placeholder="About me: I'm building an e-commerce business...&#10;My goals: 3 hours of deep work daily, gym 4x/week...&#10;Communication style: Be direct, challenge me..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border bg-white/5 outline-none text-sm resize-none opacity-50"
                    style={{ borderColor: 'var(--bg-card-border)' }}
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Editable in Phase 2</p>
            </motion.div>

            {/* Coach Personality */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 space-y-4"
            >
                <div>
                    <h2 className="text-lg font-semibold text-white">Coach Personality</h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Customize the AI coach&apos;s system prompt
                    </p>
                </div>
                <textarea
                    disabled
                    placeholder="You are GSD Coach — a ruthless, no-BS accountability partner..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border bg-white/5 outline-none text-sm resize-none opacity-50"
                    style={{ borderColor: 'var(--bg-card-border)' }}
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Editable in Phase 2</p>
            </motion.div>

            {/* Schedules */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6 space-y-4"
            >
                <div>
                    <h2 className="text-lg font-semibold text-white">Scheduled Check-ins</h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Configure automated coach check-ins
                    </p>
                </div>
                <div className="text-center py-6 space-y-2">
                    <div className="text-3xl">⏰</div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Coming in Phase 5</p>
                </div>
            </motion.div>

            {/* Stored Memories */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6 space-y-4"
            >
                <div>
                    <h2 className="text-lg font-semibold text-white">Stored Memories</h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Things the AI has learned about you
                    </p>
                </div>
                <div className="text-center py-6 space-y-2">
                    <div className="text-3xl">🧠</div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Coming in Phase 2</p>
                </div>
            </motion.div>
        </div>
    );
}
