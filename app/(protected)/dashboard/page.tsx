'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { calculateLevel } from '@/lib/level-utils';
import { supabase } from '@/lib/supabase';

interface Stats {
    level: number;
    total_xp: number;
    current_streak: number;
    longest_streak: number;
    tasks_completed: number;
    tasks_verified: number;
    tasks_failed: number;
}

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    xp_reward: number;
    task_type: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeTasks, setActiveTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTasks = () =>
            fetch('/api/tasks?status=active').then(r => r.json()).then(d => { if (d.success) setActiveTasks(d.data); });

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
                if (payload.new) setStats(payload.new as Stats);
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

    const levelInfo = stats ? calculateLevel(stats.total_xp) : null;

    const statCards = stats ? [
        { label: 'Day Streak', value: `${stats.current_streak} ${stats.current_streak === 1 ? 'day' : 'days'}`, icon: stats.current_streak > 0 ? '🔥' : '🧊', color: 'var(--accent-gold)' },
        { label: 'Level', value: `${stats.level}`, icon: '⭐', color: 'var(--accent-blue)' },
        { label: 'Tasks Done', value: `${stats.tasks_completed}`, icon: '✅', color: 'var(--accent-green)' },
        { label: 'Total XP', value: stats.total_xp.toLocaleString(), icon: '💰', color: 'var(--accent-gold)' },
    ] : [];

    const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

    const topTask = activeTasks.length > 0
        ? [...activeTasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])[0]
        : null;

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'critical': return 'var(--accent-red)';
            case 'high': return 'var(--accent-gold)';
            case 'low': return 'var(--text-muted)';
            default: return 'var(--accent-blue)';
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Welcome back. Time to get shit done.
                </p>
            </motion.div>

            {/* Top Priority CTA */}
            {!loading && topTask && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="glass-card p-5 relative overflow-hidden"
                    style={{ borderColor: getPriorityColor(topTask.priority), borderWidth: 1 }}
                >
                    <div className="absolute inset-0 opacity-5" style={{ background: getPriorityColor(topTask.priority) }} />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: getPriorityColor(topTask.priority) }}>
                                {topTask.priority} priority · {topTask.task_type}
                            </p>
                            <h2 className="text-lg font-bold text-white truncate">{topTask.title}</h2>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {topTask.status === 'pending' ? 'Not started' : topTask.status.replace('_', ' ')} · +{topTask.xp_reward} XP
                            </p>
                        </div>
                        <Link
                            href={`/tasks/${topTask.id}/active`}
                            className="flex-shrink-0 px-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                            style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}
                        >
                            {topTask.status === 'pending' ? '▶ Start Now' : '▶ Resume'}
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-4 h-24 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="glass-card p-4 space-y-2"
                        >
                            <div className="text-lg">{stat.icon}</div>
                            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* XP Progress Bar */}
            {levelInfo && stats && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>Level {stats.level}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{stats.total_xp.toLocaleString()} XP</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${levelInfo.progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-blue))' }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        <span>Level {stats.level}</span>
                        <span>{levelInfo.progress.toFixed(0)}% to Level {stats.level + 1}</span>
                    </div>
                </motion.div>
            )}

            {/* Active Tasks */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Active Tasks</h2>
                    <Link href="/tasks" className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:text-white" style={{ color: 'var(--accent-blue)' }}>
                        View All →
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
                        ))}
                    </div>
                ) : activeTasks.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                        <div className="text-4xl">🎯</div>
                        <p style={{ color: 'var(--text-secondary)' }}>No active tasks.</p>
                        <Link href="/tasks" className="inline-block text-sm px-4 py-2 rounded-lg mt-2 text-white font-medium" style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)' }}>
                            Create a Task
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activeTasks.slice(0, 5).map(task => (
                            <Link key={task.id} href={`/tasks/${task.id}/active`}>
                                <div className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/5 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getPriorityColor(task.priority) }} />
                                        <div>
                                            <p className="text-sm font-medium text-white line-clamp-1">{task.title}</p>
                                            <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{task.status.replace('_', ' ')} · {task.task_type}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color: 'var(--accent-gold)' }}>+{task.xp_reward} XP</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Recent Activity placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6"
            >
                <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xl font-bold text-white">{stats?.tasks_completed ?? '—'}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Completed</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold" style={{ color: 'var(--accent-green)' }}>{stats?.tasks_verified ?? '—'}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Verified</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold" style={{ color: 'var(--accent-red)' }}>{stats?.tasks_failed ?? '—'}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Failed</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
