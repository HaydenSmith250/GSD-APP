'use client';

import { motion } from 'framer-motion';

export default function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm">
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl relative mb-4"
                style={{
                    background: 'linear-gradient(135deg, #3B82F6, #10B981)',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'
                }}
            >
                GSD
            </motion.div>
            <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-secondary)' }}>
                Loading...
            </p>
        </div>
    );
}
