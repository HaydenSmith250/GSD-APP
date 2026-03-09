'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { playSound } from '@/lib/sounds';
import { triggerHaptic } from '@/lib/haptics';
import { Camera, Check, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface GamifiedTask {
    id: string;
    title: string;
    status: string;
    priority: number | string;
    xp_reward: number;
    task_type: string;
    verification_required?: boolean;
    due_date?: string;
}

interface TaskCardProps {
    task: GamifiedTask;
    onComplete: (id: string) => Promise<void>;
    onSnooze: (id: string) => Promise<void>;
}

export default function TaskCard({ task, onComplete, onSnooze }: TaskCardProps) {
    const router = useRouter();
    const x = useMotionValue(0);
    const color = useTransform(x, [-100, 0, 100], ['var(--color-neon-amber)', 'transparent', 'var(--color-neon-green)']);
    const snoozeOpacity = useTransform(x, [-50, -10], [1, 0]);
    const doneOpacity = useTransform(x, [10, 50], [0, 1]);

    const handleDragEnd = async (event: any, info: any) => {
        if (info.offset.x > 100) {
            triggerHaptic();
            playSound('task_complete');
            await onComplete(task.id);
        } else if (info.offset.x < -100) {
            triggerHaptic();
            await onSnooze(task.id);
        }
    };

    const getPriorityColor = () => {
        // If priority is numeric vs string handle it
        const p = String(task.priority).toLowerCase();
        if (p === 'critical' || p === '30') return 'var(--color-neon-red)';
        if (p === 'high' || p === '20') return 'var(--color-neon-amber)';
        if (p === 'low' || p === '10') return 'var(--color-neon-blue)';
        return 'var(--color-neon-blue)';
    };

    return (
        <div className="relative w-full mb-3 rounded-2xl overflow-hidden glass-card glass-card-hover group">
            {/* Background hint colors for swipe actions */}
            <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none font-black text-sm uppercase tracking-widest">
                <motion.span style={{ opacity: snoozeOpacity }} className="text-neon-amber flex items-center gap-2 drop-shadow-md">
                    <Clock size={16} /> Snooze
                </motion.span>
                <motion.span style={{ opacity: doneOpacity }} className="text-neon-green flex items-center gap-2 drop-shadow-md">
                    Done <Check size={16} />
                </motion.span>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={handleDragEnd}
                className="relative z-10 w-full p-4 bg-gsd-surface flex items-center justify-between border-l-4"
                style={{ x, backgroundColor: color, borderLeftColor: getPriorityColor() }}
                onClick={() => {
                    triggerHaptic();
                    playSound('button_press');
                    // If we need to go to details or verification page
                    if (task.status === 'awaiting_verification') {
                        router.push(`/tasks/${task.id}/verify`);
                    }
                }}
            >
                <div className="flex-1 pr-4 pointer-events-none min-w-0">
                    <h3 className="font-bold text-white text-lg truncate">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 uppercase tracking-wider font-semibold flex-wrap line-clamp-1">
                        <span>{task.task_type}</span>
                        {(() => {
                            if (task.due_date && !task.due_date.endsWith('23:59:59Z')) {
                                const timeStr = new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                return <span className="text-neon-amber font-bold flex items-center gap-1">• {timeStr}</span>;
                            }
                            return null;
                        })()}
                        {task.verification_required && (
                            <span className="flex items-center gap-1 text-neon-blue"><Camera size={12} /> Verify</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end pointer-events-none">
                    <span className="text-neon-blue font-black tracking-wide">+ {task.xp_reward} XP</span>
                    {task.status === 'awaiting_verification' && (
                        <span className="text-[10px] text-neon-amber uppercase mt-1">Pending Proof</span>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
