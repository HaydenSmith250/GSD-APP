'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Goal, CheckCircle2, Zap } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import BadgeViewer from '@/components/BadgeViewer';
import { LEVEL_NAMES, LEVEL_THRESHOLDS } from '@/lib/level-utils';
import { useRouter } from 'next/navigation';

export default function StatsPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState<any>(null);
    const [weeklyView, setWeeklyView] = useState<'week' | 'month'>('week');

    useEffect(() => {
        Promise.all([
            fetch('/api/stats').then(r => r.json()),
            fetch('/api/tasks?status=active').then(r => r.json())
        ]).then(([statData, taskData]) => {
            if (statData.success) setStats(statData.data);
            if (taskData.success && taskData.data.length > 0) {
                // Focus on the first active task for the "Current Task" box
                setActiveTask(taskData.data[0]);
            }
            setLoading(false);
        });
    }, []);

    const userLevel = stats?.level || 1;
    const currentXp = stats?.total_xp || 0;
    const nextXp = LEVEL_THRESHOLDS[userLevel] || LEVEL_THRESHOLDS[19];
    const prevXp = LEVEL_THRESHOLDS[userLevel - 1] || 0;

    // progress in current level
    const progressPercent = Math.min(100, Math.max(0, ((currentXp - prevXp) / (nextXp - prevXp)) * 100)) || 0;
    const streak = Math.max(1, stats?.current_streak || 1);
    const badgesEarned = userLevel; // Mocking badged count based on level
    const tasksCompleted = stats?.tasks_completed || 0;
    const tasksUnfinished = stats?.tasks_unfinished || 0;

    // Calculate completion efficiency
    const totalAttempted = tasksCompleted + tasksUnfinished;
    const efficiency = totalAttempted > 0 ? Math.round((tasksCompleted / totalAttempted) * 100) : 100;

    // Mock weekly activity for chart
    const dailyData = [3, 5, 2, 7, 4, 8, 6];

    if (loading) {
        return (
            <div className="space-y-6 pt-12 px-6 pb-32">
                <div className="flex flex-col items-center pb-2">
                    <div className="w-full max-w-sm glass-card p-6 rounded-[2rem] border border-white/5 h-[300px] flex flex-col items-center justify-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse" />
                        <div className="w-3/4 h-8 bg-white/5 rounded-full animate-pulse mt-4" />
                        <div className="w-1/2 h-4 bg-white/5 rounded-full animate-pulse" />
                        <div className="w-full h-8 bg-white/5 rounded-full animate-pulse mt-6" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-3xl border border-white/5 h-[120px] bg-white/5 animate-pulse" />
                    <div className="glass-card p-4 rounded-3xl border border-white/5 h-[120px] bg-white/5 animate-pulse" />
                </div>

                <div className="glass-card p-5 rounded-3xl border border-white/5 h-[100px] bg-white/5 animate-pulse" />

                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-3xl border border-white/5 h-[90px] bg-white/5 animate-pulse" />
                    <div className="glass-card p-4 rounded-3xl border border-white/5 h-[90px] bg-white/5 animate-pulse" />
                </div>

                <div className="glass-card p-5 rounded-3xl border border-white/5 h-[200px] flex flex-col justify-end gap-2">
                    <div className="w-1/2 h-6 bg-white/5 rounded-full animate-pulse mb-4" />
                    <div className="flex justify-between items-end h-36 gap-2 w-full">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="flex-1 w-full bg-white/5 rounded-md animate-pulse" style={{ height: `${Math.random() * 60 + 20}%` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-12 px-6 pb-32">

            {/* LARGE LEVEL CARD */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pb-2">
                <div className="w-full max-w-sm glass-card p-6 rounded-[2rem] border border-white/5 relative overflow-hidden flex flex-col items-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon-green/10 rounded-full blur-[60px] pointer-events-none" />

                    <div className="mb-4 relative z-10 w-24 h-24">
                        <BadgeViewer level={userLevel} size="lg" />
                    </div>

                    <div className="text-center relative z-10 w-full mb-6">
                        <h2 className="text-xl font-heading font-black text-white uppercase tracking-wider italic flex items-center justify-center gap-2">
                            <Shield size={16} className="text-neon-green" />
                            LEVEL {userLevel}: {LEVEL_NAMES[userLevel - 1]}
                        </h2>
                        <p className="text-[10px] font-bold text-neon-green mt-1 uppercase tracking-widest">
                            Next Tier: {LEVEL_NAMES[userLevel] || 'MAX LEVEL'}
                        </p>
                    </div>

                    <div className="w-full relative z-10 glass-card bg-black/40 border border-white/5 p-4 rounded-3xl hover:bg-white/5 transition-colors cursor-pointer group shadow-inner" onClick={() => { triggerHaptic(); import('@/lib/sounds').then(s => s.playSound('button_press')); }}>
                        <div className="flex justify-between items-center w-full mb-3 px-1">
                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Progress</span>
                                <span className="text-[11px] font-bold text-white tracking-wide">{Math.round(progressPercent)}% to Lvl {userLevel + 1}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Exp. needed</span>
                                <span className="text-[11px] text-neon-green font-bold tracking-wide">{nextXp - currentXp} XP</span>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-black/80 rounded-full flex overflow-hidden border border-white/10 shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-neon-blue to-neon-green relative overflow-hidden shadow-[0_0_15px_rgba(57,255,20,0.6)] group-hover:brightness-125 transition-all"
                            >
                                <motion.div
                                    animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                    className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] bg-[length:200%_100%]"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* STREAK AND BADGES GRID */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neon-green uppercase tracking-widest mb-2">
                        <TrendingUp size={14} /> Streak
                    </div>
                    <div className="flex items-end gap-2 text-white">
                        <span className="text-4xl font-heading font-black">{streak}</span>
                        <span className="text-sm font-bold text-gray-500 pb-1">DAYS</span>
                    </div>
                    <div className="mt-3">
                        <span className="bg-neon-green text-black px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-fit gap-1 shadow-[0_0_10px_rgba(57,255,20,0.3)]">
                            <TrendingUp size={10} /> +2 Today
                        </span>
                    </div>
                </div>

                <div className="glass-card p-4 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="absolute right-[-10px] top-[-10px] opacity-10 blur-sm pointer-events-none">
                        <BadgeViewer level={userLevel} size="md" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neon-blue uppercase tracking-widest mb-2">
                        <Goal size={14} /> Badges
                    </div>
                    <div className="flex items-end gap-2 text-white">
                        <span className="text-4xl font-heading font-black">{badgesEarned}</span>
                        <span className="text-sm font-bold text-gray-500 pb-1">EARNED</span>
                    </div>
                    <div className="mt-3">
                        <span className="bg-neon-blue text-black px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-fit gap-1 shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                            <Zap size={10} /> +1 New
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* CURRENT MISSION */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="glass-card p-5 rounded-3xl border border-white/5 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-heading font-black text-white italic text-lg line-clamp-1">Current Task</h3>
                        {activeTask && (
                            <span className="text-[10px] font-bold text-neon-green uppercase tracking-widest bg-neon-green/10 px-2 py-1 rounded">
                                ACTIVE
                            </span>
                        )}
                    </div>

                    {activeTask ? (
                        <div
                            onClick={() => router.push(`/tasks/${activeTask.id}/active`)}
                            className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                        >
                            <div className="w-6 h-6 rounded-md bg-neon-blue/20 border-2 border-neon-blue flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 size={16} className="text-neon-blue" />
                            </div>
                            <p className="font-bold text-sm text-gray-300 line-clamp-2 leading-relaxed flex-1">
                                {activeTask.title}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4 opacity-50">
                            <p className="font-bold text-sm text-gray-500">No active task right now.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* SECONDARY STATS GRID */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Efficiency</p>
                    <p className="text-3xl font-black text-white">{efficiency}%</p>
                </div>
                <div className="glass-card p-4 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tasks Done</p>
                    <p className="text-3xl font-black text-white">{tasksCompleted}</p>
                </div>
                <div className="glass-card p-4 rounded-3xl border border-neon-red/10 col-span-2 bg-neon-red/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-neon-red uppercase tracking-widest mb-1">Unfinished / Failed</p>
                        <p className="text-2xl font-black text-white">{tasksUnfinished} <span className="text-gray-500 text-xs font-normal ml-1 tracking-wide">all time</span></p>
                    </div>
                </div>
            </motion.div>

            {/* WEEKLY ACTIVITY CHART */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-heading font-black text-white text-lg w-1/2 leading-tight">Weekly Activity Trends</h3>
                    <div className="flex bg-black/50 rounded-lg p-1">
                        <button
                            onClick={() => { triggerHaptic(); setWeeklyView('week') }}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${weeklyView === 'week' ? 'bg-neon-green text-black' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => { triggerHaptic(); setWeeklyView('month') }}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${weeklyView === 'month' ? 'bg-neon-green text-black' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Month
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-end h-36 gap-2 px-2 mt-4">
                    {dailyData.map((val, i) => {
                        const h = (val / Math.max(...dailyData)) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-3">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="w-full relative min-h-[4px] bg-white/20 rounded-md overflow-hidden"
                                />
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">
                                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

        </div>
    );
}
