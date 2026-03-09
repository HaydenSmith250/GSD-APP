'use client';

import { motion } from 'framer-motion';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji proxy for now
    isUnlocked: boolean;
    unlockedAt?: string;
}

interface BadgeGalleryProps {
    badges: Badge[];
}

export default function BadgeGallery({ badges }: BadgeGalleryProps) {
    // Container animation
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.8 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 sm:grid-cols-4 gap-4"
        >
            {badges.map((badge) => (
                <motion.div
                    key={badge.id}
                    variants={item}
                    className="flex flex-col items-center group cursor-pointer"
                >
                    <div className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-300 ${badge.isUnlocked
                            ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] group-hover:-translate-y-1'
                            : 'bg-black/40 border border-white/5 opacity-50 grayscale'
                        }`}>
                        <span className="text-3xl filter drop-shadow-md">
                            {badge.icon}
                        </span>

                        {/* Subtle reflection on the glass for unlocked badges */}
                        {badge.isUnlocked && (
                            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                        )}

                        {/* Lock overlay for locked badges */}
                        {!badge.isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2rem]">
                                <span className="text-xs">🔒</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 text-center">
                        <h4 className={`text-xs font-bold leading-tight ${badge.isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                            {badge.isUnlocked ? badge.name : '???'}
                        </h4>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
