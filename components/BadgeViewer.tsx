'use client';

import { motion } from 'framer-motion';
import { LEVEL_NAMES } from '@/lib/level-utils';
import Image from 'next/image';

interface BadgeViewerProps {
    level: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showTitle?: boolean;
    mainGlow?: boolean; // Toggles subtle bounce and highlight under the main badge
}

export default function BadgeViewer({ level, size = 'md', showTitle = false, mainGlow = false }: BadgeViewerProps) {
    const l = Math.max(1, Math.min(20, level));
    const title = LEVEL_NAMES[l - 1];

    // We have 19 SVG badges, map level 20 to 19 if it surpasses
    const svgIndex = l > 19 ? 19 : l;

    // Adjust sizes to make the SVGs look prominent
    let szClass = "w-16 h-16";
    if (size === 'sm') szClass = "w-14 h-14";
    else if (size === 'lg') szClass = "w-28 h-28";
    else if (size === 'xl') szClass = "w-40 h-40";

    return (
        <div className="flex flex-col items-center justify-center relative">
            {/* The subtle highlight underneath for hovering effect */}
            {mainGlow && (
                <div className="absolute -bottom-2 w-[80%] h-4 bg-neon-blue/40 blur-[15px] rounded-[100%] pointer-events-none mix-blend-screen" />
            )}

            <motion.div
                animate={{ y: mainGlow ? [-3, 3, -3] : 0 }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className={`${szClass} relative flex items-center justify-center`}
                style={{
                    filter: mainGlow ? 'drop-shadow(0 10px 15px rgba(0, 229, 255, 0.4))' : 'drop-shadow(0 5px 10px rgba(0,0,0,0.5))'
                }}
            >
                <Image
                    src={`/badges/${svgIndex}.svg`}
                    alt={`Level ${l} Badge`}
                    fill
                    className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                />
            </motion.div>

            {showTitle && (
                <div className="mt-4 text-center">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-neon-blue">Level {l}</div>
                    <div className="font-heading font-black text-white text-lg tracking-wide">{title}</div>
                </div>
            )}
        </div>
    );
}
