'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLevel, LEVEL_NAMES, LEVEL_THRESHOLDS } from '@/lib/level-utils';
import { supabase } from '@/lib/supabase';
import TaskCreateSheet from '@/components/TaskCreateSheet';
import TaskCard, { GamifiedTask } from '@/components/TaskCard';
import { Plus, Flame, Hexagon, Crosshair, Lock, X } from 'lucide-react';
import BadgeViewer from '@/components/BadgeViewer';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';

interface Stats {
    level: number;
    total_xp: number;
    current_streak: number;
    longest_streak: number;
    tasks_completed: number;
    tasks_verified: number;
    tasks_failed: number;
}

const QUOTES = [
    "Every action is a vote for the person you wish to become.",
    "Do what you have to do, to do what you want to do.",
    "Discipline equals freedom.",
    "We suffer more often in imagination than in reality.",
    "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    "The amateur believes he must first overcome his fear; then he can do his work. The professional knows that fear can never be overcome."
];

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeTasks, setActiveTasks] = useState<GamifiedTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
    const [userName, setUserName] = useState<string>('Hayden');
    const [dayQuote, setDayQuote] = useState<string>('');
    const [selectedBadgeLevel, setSelectedBadgeLevel] = useState<number | null>(null);
    const [levelUpData, setLevelUpData] = useState<{ oldLevel: number, newLevel: number } | null>(null);

    const loadTasks = () =>
        fetch('/api/tasks?status=active').then(r => r.json()).then(d => { if (d.success) setActiveTasks(d.data); });

    useEffect(() => {
        // Pick random quote
        setDayQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

        // Fetch user info for greeting
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.user_metadata?.first_name) {
                setUserName(user.user_metadata.first_name);
            }
        });

        Promise.all([
            fetch('/api/stats').then(r => r.json()),
            fetch('/api/tasks?status=active').then(r => r.json()),
        ]).then(([statsData, tasksData]) => {
            if (statsData.success) setStats(statsData.data);
            if (tasksData.success) setActiveTasks(tasksData.data);
        }).finally(() => setLoading(false));

        const statsChannel = supabase
            .channel('dashboard-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stats' }, (payload) => {
                if (payload.new) {
                    const newStats = payload.new as Stats;
                    setStats(prev => {
                        if (prev && newStats.level > prev.level) {
                            setLevelUpData({ oldLevel: prev.level, newLevel: newStats.level });
                        }
                        return newStats;
                    });
                }
            })
            .subscribe();

        const tasksChannel = supabase
            .channel('dashboard-tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                loadTasks();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(statsChannel);
            supabase.removeChannel(tasksChannel);
        };
    }, []);

    const handleTaskComplete = async (taskId: string) => {
        const task = activeTasks.find(t => t.id === taskId);
        if (!task) return;

        // Remove locally immediately for snappy feel
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));

        await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: task.verification_required ? 'awaiting_verification' : 'completed' })
        });

        if (!task.verification_required && stats) {
            setStats({ ...stats, total_xp: stats.total_xp + task.xp_reward, tasks_completed: stats.tasks_completed + 1 });
        }
    };

    const handleTaskSnooze = async (taskId: string) => {
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
        await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'snoozed' })
        });
    };

    const levelInfo = stats ? calculateLevel(stats.total_xp) : null;
    const progressPercent = levelInfo?.progress || 0;

    return (
        <div className="space-y-8 p-6 pt-12 pb-32">

            {/* Greeting & Time HUD */}
            <header className="space-y-3 text-center pt-4 relative flex flex-col items-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-neon-blue/10 rounded-full blur-[60px] pointer-events-none" />
                <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-gray-500 font-bold uppercase tracking-widest text-xs relative z-10"
                >
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="text-4xl font-heading font-black text-white relative z-10 text-center px-4"
                >
                    Let's execute, <span className="bg-gradient-to-r from-neon-blue via-neon-green to-neon-blue bg-[length:200%_auto] bg-clip-text text-transparent break-words whitespace-pre-wrap animate-text-gradient">{userName}</span>.
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="text-sm italic text-gray-400 max-w-sm mx-auto mt-2 relative z-10 text-center px-4"
                >
                    "{dayQuote}"
                </motion.p>
            </header>

            {/* Giant Create Task Button - Centerpiece */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
                <button
                    onClick={() => setIsCreateSheetOpen(true)}
                    className="w-full flex flex-col items-center justify-center p-8 rounded-[2.5rem] relative overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5"
                    style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.8) 100%)' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-neon-blue/20 group-hover:text-neon-blue transition-colors group-hover:scale-110 duration-500 shadow-inner">
                        <Plus size={32} strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-heading font-black tracking-wide text-white group-hover:text-neon-blue transition-colors duration-500">
                        Create Task
                    </span>
                    <span className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-2">
                        Command The Day
                    </span>
                </button>
            </motion.div>

            {/* Level & Badge Spotlight (Centered Focal Point) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div className="glass-card p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col items-center shadow-2xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon-blue/15 rounded-full blur-[60px] pointer-events-none" />

                    <div className="relative z-10 mb-4 mt-2">
                        <BadgeViewer level={stats?.level || 1} size="xl" mainGlow={true} />
                    </div>

                    <div className="text-center relative z-10 w-full mb-6 flex flex-col items-center">
                        <h2 className="text-[10px] text-neon-blue font-bold uppercase tracking-widest mb-1">Current Identity</h2>
                        <p className="text-2xl font-black font-heading text-white flex items-center gap-2">
                            {LEVEL_NAMES[(stats?.level || 1) - 1]} <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-full tracking-widest">LVL {stats?.level || 1}</span>
                        </p>
                    </div>

                    <div className="w-full relative z-10 glass-card bg-black/40 border border-white/5 p-4 rounded-3xl hover:bg-white/5 transition-colors cursor-pointer group shadow-inner" onClick={() => { triggerHaptic(); playSound('button_press'); setSelectedBadgeLevel(stats?.level || 1); }}>
                        <div className="flex justify-between items-center w-full mb-3 px-1">
                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Progress</span>
                                <span className="text-[11px] font-bold text-white tracking-wide">{Math.round(progressPercent)}% to Lvl {(stats?.level || 1) + 1}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Exp. needed</span>
                                <span className="text-[11px] text-neon-green font-bold tracking-wide">{(LEVEL_THRESHOLDS[stats?.level || 1] || 0) - (stats?.total_xp || 0)} XP</span>
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

            {/* Active Tasks Feed */}
            <div className="space-y-4 pt-2">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex justify-between items-baseline px-2">
                    <div className="flex items-center gap-2">
                        <Crosshair size={18} className="text-gray-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Upcoming Tasks</h2>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        <Flame size={12} className="text-neon-amber" />
                        <span className="text-[10px] text-neon-amber font-bold tracking-widest">{stats?.current_streak || 0}x Streak</span>
                    </div>
                </motion.div>

                <div className="space-y-3">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-24 rounded-3xl animate-pulse bg-white/5 border border-white/5" />
                        ))
                    ) : activeTasks.length > 0 ? (
                        <AnimatePresence>
                            {activeTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.9 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <TaskCard task={task} onComplete={handleTaskComplete} onSnooze={handleTaskSnooze} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 px-4 rounded-[2rem] border border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                            <Hexagon size={48} className="mx-auto text-white/20 mb-4" strokeWidth={1} />
                            <p className="text-white/60 font-bold mb-1">Queue is empty</p>
                            <p className="text-gray-500 text-sm">Hit the massive button above to launch an op.</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* BADGE GALLERY */}
            <div className="pt-6 relative z-0">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-heading font-black text-white text-[22px]">Badges</h3>
                    <span className="text-neon-blue text-sm font-bold uppercase tracking-wide">{stats?.level || 1} / {LEVEL_NAMES.length} Unlocked</span>
                </div>

                <div className="flex gap-4 overflow-x-auto overflow-y-visible pb-12 pt-6 safe-scrollbar px-4 -mx-4">
                    {Array.from({ length: LEVEL_NAMES.length }, (_, i) => i + 1).map((lvl) => {
                        const isUnlocked = lvl <= (stats?.level || 1);
                        return (
                            <div
                                key={lvl}
                                onClick={() => { triggerHaptic(); setSelectedBadgeLevel(lvl); }}
                                className={`flex-shrink-0 w-56 h-72 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 transform hover:-translate-y-4 hover:scale-105 group cursor-pointer ${isUnlocked ? 'bg-gradient-to-b from-white/10 to-transparent shadow-lg hover:shadow-[0_15px_40px_rgba(0,229,255,0.2)]' : 'bg-black/60 shadow-inner hover:bg-black/40 hover:shadow-[0_15px_40px_rgba(0,229,255,0.05)]'}`}
                            >
                                <div className={`transition-all duration-500 scale-110 drop-shadow-md ${isUnlocked ? 'opacity-100 group-hover:scale-125' : 'opacity-20 grayscale blur-[2px] group-hover:blur-sm'}`}>
                                    <BadgeViewer level={lvl} size="xl" />
                                </div>
                                <div className="absolute bottom-6 text-center w-full px-2 z-10">
                                    <span className={`text-xs font-bold uppercase tracking-widest block truncate ${isUnlocked ? 'text-neon-blue' : 'text-gray-500'}`}>
                                        {LEVEL_NAMES[lvl - 1]}
                                    </span>
                                </div>
                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 group-hover:bg-black/20 transition-colors">
                                        <Lock size={36} className="text-white/30 group-hover:text-white/50 transition-colors" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BADGE MODAL OVERLAY */}
            <AnimatePresence>
                {selectedBadgeLevel !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
                        onClick={() => setSelectedBadgeLevel(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-gsd-surface border border-white/10 rounded-3xl p-6 max-w-sm w-full relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(10,10,10,0.95) 100%)' }}
                        >
                            <button
                                onClick={() => setSelectedBadgeLevel(null)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            {(() => {
                                const isUnlocked = selectedBadgeLevel <= (stats?.level || 1);
                                const requiredXp = LEVEL_THRESHOLDS[selectedBadgeLevel - 1] || 0;
                                const prevXp = selectedBadgeLevel > 1 ? LEVEL_THRESHOLDS[selectedBadgeLevel - 2] : 0;
                                const currentXp = stats?.total_xp || 0;

                                let progress = 0;
                                if (isUnlocked) {
                                    progress = 100;
                                } else {
                                    progress = Math.min(100, Math.max(0, ((currentXp - prevXp) / (requiredXp - prevXp)) * 100)) || 0;
                                }

                                return (
                                    <div className="flex flex-col items-center text-center pt-4">
                                        <div className="mb-6 relative w-40 h-40 flex items-center justify-center group">
                                            <div className={`absolute inset-0 bg-neon-blue/20 blur-[50px] rounded-full transition-all ${isUnlocked ? 'opacity-100 group-hover:scale-110' : 'opacity-0'}`} />
                                            <div className={`transition-all duration-500 ${isUnlocked ? 'scale-110 drop-shadow-2xl' : 'grayscale opacity-30 blur-[2px]'}`}>
                                                <BadgeViewer level={selectedBadgeLevel} size="xl" />
                                            </div>
                                            {!isUnlocked && (
                                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                                    <Lock size={32} className="text-white/50 drop-shadow-md" />
                                                </div>
                                            )}
                                        </div>

                                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-neon-blue mb-1">
                                            Level {selectedBadgeLevel} Identity
                                        </h2>
                                        <h3 className="font-heading font-black text-2xl text-white mb-3 tracking-wide">
                                            {LEVEL_NAMES[selectedBadgeLevel - 1]}
                                        </h3>

                                        <p className="text-sm text-gray-400 mb-8 px-2 font-medium leading-relaxed">
                                            {isUnlocked
                                                ? `You have unlocked the ${LEVEL_NAMES[selectedBadgeLevel - 1]} identity through relentless execution.`
                                                : `Requires raw execution and ${requiredXp.toLocaleString()} total XP to unlock this identity.`}
                                        </p>

                                        <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                    {isUnlocked ? 'Status' : 'Progress'}
                                                </span>
                                                <span className={`text-sm font-bold ${isUnlocked ? 'text-neon-green' : 'text-white'}`}>
                                                    {isUnlocked ? 'UNLOCKED' : `${Math.round(progress)}%`}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black/80 rounded-full flex overflow-hidden border border-white/5 shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                                    className={`h-full ${isUnlocked ? 'bg-gradient-to-r from-neon-green to-[var(--color-neon-blue)] shadow-[0_0_15px_rgba(57,255,20,0.6)]' : 'bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.5)]'}`}
                                                />
                                            </div>
                                            {!isUnlocked && (
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 flex justify-between">
                                                    <span>{currentXp.toLocaleString()}</span>
                                                    <span>{requiredXp.toLocaleString()} XP</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TaskCreateSheet
                isOpen={isCreateSheetOpen}
                onClose={() => setIsCreateSheetOpen(false)}
                onSuccess={loadTasks}
            />

            {levelUpData && (
                <LevelUpOverlay
                    oldLevel={levelUpData.oldLevel}
                    newLevel={levelUpData.newLevel}
                    onClose={() => setLevelUpData(null)}
                />
            )}
        </div>
    );
}
