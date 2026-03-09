'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LEVEL_NAMES } from '@/lib/level-utils';
import BadgeViewer from '@/components/BadgeViewer';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';

interface LevelUpOverlayProps {
    oldLevel: number;
    newLevel: number;
    onClose: () => void;
}

export default function LevelUpOverlay({ oldLevel, newLevel, onClose }: LevelUpOverlayProps) {
    const [step, setStep] = useState(0); // 0: Enter, 1: Interaction prompt, 2: Reveal new badge

    useEffect(() => {
        playSound('level_up');
        triggerHaptic();

        const timer = setTimeout(() => {
            setStep(1);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleInteraction = () => {
        if (step !== 1) return;

        playSound('badge_unlock');
        triggerHaptic();
        setStep(2);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
                onClick={handleInteraction}
            >
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 180],
                            opacity: step === 2 ? 0.3 : 0.1
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] max-w-[800px] max-h-[800px] bg-[conic-gradient(var(--color-neon-blue),transparent,var(--color-neon-green),transparent,var(--color-neon-blue))] opacity-20 blur-[80px]"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">

                    {/* Step 0/1: Old Badge & Prompt */}
                    <AnimatePresence mode="wait">
                        {step < 2 ? (
                            <motion.div
                                key="old-badge"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0, filter: 'blur(10px)' }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col items-center"
                            >
                                <div className="grayscale opacity-50 blur-[2px] mb-8">
                                    <BadgeViewer level={oldLevel} size="xl" />
                                </div>
                                <h2 className="text-white font-heading font-black text-2xl uppercase tracking-widest mb-2">Level Complete</h2>

                                <AnimatePresence>
                                    {step === 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-12 group cursor-pointer"
                                        >
                                            <div className="relative px-8 py-4 bg-neon-blue/10 border border-neon-blue rounded-full overflow-hidden">
                                                <motion.div
                                                    animate={{ x: ['-100%', '100%'] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                                />
                                                <span className="relative z-10 text-neon-blue font-bold uppercase tracking-widest animate-pulse">Tap to Reveal Identity</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            /* Step 2: New Badge Reveal */
                            <motion.div
                                key="new-badge"
                                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                className="flex flex-col items-center text-center"
                            >
                                <motion.div
                                    className="relative mb-8"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                >
                                    <div className="absolute inset-0 bg-neon-green/30 blur-[60px] rounded-full scale-150 animate-pulse" />
                                    <BadgeViewer level={newLevel} size="xl" />
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                    className="text-[12px] text-neon-green font-bold uppercase tracking-widest mb-2"
                                >
                                    New Identity Acquired
                                </motion.h2>

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                    className="font-heading font-black text-4xl text-white mb-8 tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                >
                                    {LEVEL_NAMES[newLevel - 1]}
                                </motion.h1>

                                <motion.button
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                    }}
                                    className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full transition-transform hover:scale-105 active:scale-95"
                                >
                                    Continue
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
