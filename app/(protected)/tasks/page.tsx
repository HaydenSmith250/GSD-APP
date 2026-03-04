'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Task {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: string;
    task_type: 'goal' | 'timed';
    duration_minutes?: number;
    checkin_interval_minutes?: number;
    xp_reward: number;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'active' | 'completed' | 'failed'>('active');
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [taskType, setTaskType] = useState<'goal' | 'timed'>('goal');
    const [duration, setDuration] = useState('60');
    const [checkinInterval, setCheckinInterval] = useState('0');
    const [verificationPrompt, setVerificationPrompt] = useState('A clear photo showing the work is completed or in progress.');

    useEffect(() => {
        loadTasks();
    }, [filter]);

    async function loadTasks() {
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks?status=${filter}`);
            const data = await res.json();
            if (data.success) setTasks(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateTask(e: React.FormEvent) {
        e.preventDefault();
        if (!title) return;

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    priority,
                    task_type: taskType,
                    duration_minutes: taskType === 'timed' ? parseInt(duration) : null,
                    checkin_interval_minutes: checkinInterval === '0' ? null : parseInt(checkinInterval),
                    verification_prompt: verificationPrompt,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreating(false);
                if (filter === 'active') setTasks([data.data, ...tasks]);
                setTitle('');
                setDescription('');
            }
        } catch (err) {
            console.error(err);
        }
    }

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'critical': return 'var(--accent-red)';
            case 'high': return 'var(--accent-gold)';
            case 'low': return 'var(--text-muted)';
            default: return 'var(--accent-blue)';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tasks</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Set your goals. Prove you did them.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)' }}
                >
                    + New Task
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b" style={{ borderColor: 'var(--bg-card-border)' }}>
                {(['active', 'completed', 'failed'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2`}
                        style={{
                            borderColor: filter === f ? 'var(--accent-blue)' : 'transparent',
                            color: filter === f ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-card p-6"
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">Create New Task</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="text-xs text-white/70 block mb-1">Title</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="e.g. Deep work block" />
                            </div>
                            <div>
                                <label className="text-xs text-white/70 block mb-1">Description (Optional)</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" rows={2} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/70 block mb-1">Type</label>
                                    <select value={taskType} onChange={e => setTaskType(e.target.value as 'goal' | 'timed')} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none">
                                        <option value="goal" className="bg-[#111]">Goal (Open-ended)</option>
                                        <option value="timed" className="bg-[#111]">Timed (Countdown)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-white/70 block mb-1">Priority</label>
                                    <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none">
                                        <option value="low" className="bg-[#111]">Low</option>
                                        <option value="medium" className="bg-[#111]">Medium</option>
                                        <option value="high" className="bg-[#111]">High</option>
                                        <option value="critical" className="bg-[#111]">Critical</option>
                                    </select>
                                </div>
                            </div>

                            {taskType === 'timed' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-white/70 block mb-1">Duration (Minutes)</label>
                                        <input type="number" required value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/70 block mb-1">Check-in Interval (Mins)</label>
                                        <select value={checkinInterval} onChange={e => setCheckinInterval(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none">
                                            <option value="0" className="bg-[#111]">None (Start/End only)</option>
                                            <option value="15" className="bg-[#111]">Every 15 mins</option>
                                            <option value="30" className="bg-[#111]">Every 30 mins</option>
                                            <option value="60" className="bg-[#111]">Every 60 mins</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-white/70 block mb-1">Verification Method (Prompt to AI)</label>
                                <textarea value={verificationPrompt} onChange={e => setVerificationPrompt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" rows={2} placeholder="How will you prove it? e.g. A photo of my IDE with code written" />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500">Create Task</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-10 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-10 glass-card">
                        <div className="text-4xl mb-3">🎯</div>
                        <p className="text-white font-medium">No {filter} tasks</p>
                        <p className="text-sm text-white/50 mt-1">Time to set some goals.</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex flex-col md:flex-row gap-4 justify-between group">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ background: getPriorityColor(task.priority) }} />
                                    <h3 className="font-semibold text-white">{task.title}</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: 'var(--bg-card-border)', color: 'var(--text-muted)' }}>
                                        {task.task_type}
                                    </span>
                                </div>
                                {task.description && <p className="text-sm text-white/60 line-clamp-1">{task.description}</p>}

                                <div className="flex gap-3 mt-3 text-xs font-medium">
                                    <span style={{ color: 'var(--accent-gold)' }}>+{task.xp_reward} XP</span>
                                    {task.task_type === 'timed' && task.duration_minutes && (
                                        <span className="text-white/40">⏱ {task.duration_minutes}m</span>
                                    )}
                                    {task.checkin_interval_minutes && (
                                        <span className="text-white/40">🔔 Every {task.checkin_interval_minutes}m</span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                {filter === 'active' && (
                                    <Link href={`/tasks/${task.id}/active`} className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 transition-colors w-full md:w-auto text-center">
                                        {task.status === 'pending' ? 'Start Task' : 'Resume'}
                                    </Link>
                                )}
                                {filter !== 'active' && (
                                    <span className={`px-3 py-1 text-xs rounded-lg font-medium border ${filter === 'completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                        {filter === 'completed' ? 'Verified' : 'Failed'}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
