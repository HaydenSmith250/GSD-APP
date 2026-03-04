'use client';

import { motion } from 'framer-motion';

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-48px)] flex flex-col">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 mb-4"
            >
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{
                        background: 'linear-gradient(135deg, #3B82F6, #10B981)',
                        boxShadow: '0 0 16px rgba(59, 130, 246, 0.2)',
                    }}
                >
                    GSD
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-white">GSD Coach</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your AI accountability partner</p>
                </div>
            </motion.div>

            {/* Chat Messages Area */}
            <div className="flex-1 glass-card p-4 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <div className="text-5xl">💬</div>
                        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Chat with your coach
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            AI chat integration coming in Phase 2
                        </p>
                    </div>
                </div>

                {/* Input Area Stub */}
                <div className="mt-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Message your coach..."
                        disabled
                        className="flex-1 px-4 py-3 rounded-xl border bg-white/5 outline-none text-sm"
                        style={{ borderColor: 'var(--bg-card-border)', color: 'var(--text-muted)' }}
                    />
                    <button
                        disabled
                        className="px-5 py-3 rounded-xl font-medium text-sm text-white opacity-40"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
