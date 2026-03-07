'use client';

import { useState, useEffect, useMemo } from 'react';
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
    verification_prompt?: string;
    category?: string;
    due_date?: string;
    recurring_pattern?: 'daily' | 'weekdays' | 'weekly' | null;
}

const CATEGORIES = ['Work', 'Health', 'Learning', 'Finance', 'Personal', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
    work: '#3B82F6',
    health: '#10B981',
    learning: '#8B5CF6',
    finance: '#FBBF24',
    personal: '#F472B6',
    other: 'var(--text-muted)',
    general: 'var(--text-muted)',
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'active' | 'completed' | 'failed'>('active');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isCreating, setIsCreating] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [taskType, setTaskType] = useState<'goal' | 'timed'>('goal');
    const [duration, setDuration] = useState('60');
    const [checkinInterval, setCheckinInterval] = useState('0');
    const [verificationPrompt, setVerificationPrompt] = useState('');
    const [category, setCategory] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [recurringPattern, setRecurringPattern] = useState('');
    const [generatingPrompt, setGeneratingPrompt] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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

    // Client-side category + overdue sort
    const displayedTasks = useMemo(() => {
        let list = categoryFilter === 'all'
            ? tasks
            : tasks.filter(t => (t.category || 'other').toLowerCase() === categoryFilter.toLowerCase());

        // Sort: overdue → by due_date → no due date
        const now = Date.now();
        return [...list].sort((a, b) => {
            const aOverdue = a.due_date && new Date(a.due_date).getTime() < now;
            const bOverdue = b.due_date && new Date(b.due_date).getTime() < now;
            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;
            if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            if (a.due_date) return -1;
            if (b.due_date) return 1;
            return 0;
        });
    }, [tasks, categoryFilter]);

    function openCreateModal() {
        setEditingTask(null);
        setTitle('');
        setDescription('');
        setPriority('medium');
        setTaskType('goal');
        setDuration('60');
        setCheckinInterval('0');
        setVerificationPrompt('');
        setCategory('');
        setDueDate('');
        setRecurringPattern('');
        setShowAdvanced(false);
        setIsCreating(true);
    }

    function openEditModal(task: Task) {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setTaskType(task.task_type);
        setDuration(String(task.duration_minutes || 60));
        setCheckinInterval(String(task.checkin_interval_minutes || 0));
        setVerificationPrompt(task.verification_prompt || '');
        setCategory(task.category && task.category !== 'general' ? task.category : '');
        setDueDate(task.due_date ? task.due_date.slice(0, 16) : '');
        setRecurringPattern(task.recurring_pattern || '');
        setShowAdvanced(true);
        setIsCreating(true);
    }

    function closeModal() {
        setIsCreating(false);
        setEditingTask(null);
    }

    async function generateVerificationPrompt() {
        if (!title.trim()) return;
        setGeneratingPrompt(true);
        try {
            const res = await fetch('/api/tasks/suggest-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });
            const data = await res.json();
            if (data.success) setVerificationPrompt(data.suggestion);
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingPrompt(false);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!title || submitting) return;
        setSubmitting(true);

        try {
            if (editingTask) {
                const res = await fetch(`/api/tasks/${editingTask.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        description,
                        priority,
                        verification_prompt: verificationPrompt,
                        category: category || 'general',
                        due_date: dueDate ? new Date(dueDate).toISOString() : null,
                        recurring_pattern: recurringPattern || null,
                        ...(editingTask.task_type === 'timed' && {
                            duration_minutes: parseInt(duration),
                            checkin_interval_minutes: checkinInterval === '0' ? null : parseInt(checkinInterval),
                        }),
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...data.data } : t));
                    closeModal();
                }
            } else {
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
                        verification_prompt: verificationPrompt || 'A clear photo showing the work is completed or in progress.',
                        category: category || 'general',
                        due_date: dueDate ? new Date(dueDate).toISOString() : null,
                        recurring_pattern: recurringPattern || null,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    closeModal();
                    if (filter === 'active') setTasks([data.data, ...tasks]);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
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

    const isOverdue = (task: Task) =>
        task.due_date && new Date(task.due_date).getTime() < Date.now() && filter === 'active';

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
                    onClick={openCreateModal}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)' }}
                >
                    + New Task
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 border-b" style={{ borderColor: 'var(--bg-card-border)' }}>
                {(['active', 'completed', 'failed'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setCategoryFilter('all'); }}
                        className="px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2"
                        style={{
                            borderColor: filter === f ? 'var(--accent-blue)' : 'transparent',
                            color: filter === f ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Category filter chips */}
            {!loading && tasks.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                            background: categoryFilter === 'all' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                            color: categoryFilter === 'all' ? 'var(--accent-blue)' : 'var(--text-muted)',
                            border: `1px solid ${categoryFilter === 'all' ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                    >
                        All
                    </button>
                    {CATEGORIES.filter(c => tasks.some(t => (t.category || 'other').toLowerCase() === c.toLowerCase())).map(c => (
                        <button
                            key={c}
                            onClick={() => setCategoryFilter(c)}
                            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                            style={{
                                background: categoryFilter === c ? `${CATEGORY_COLORS[c.toLowerCase()]}22` : 'rgba(255,255,255,0.05)',
                                color: categoryFilter === c ? CATEGORY_COLORS[c.toLowerCase()] : 'var(--text-muted)',
                                border: `1px solid ${categoryFilter === c ? `${CATEGORY_COLORS[c.toLowerCase()]}44` : 'rgba(255,255,255,0.08)'}`,
                            }}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-card p-6"
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">
                            {editingTask ? 'Edit Task' : 'Create New Task'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-white/70 block mb-1">Title</label>
                                <input
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                    placeholder="e.g. Deep work block"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-white/70 block mb-1">Description <span className="text-white/30">(optional)</span></label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                    rows={2}
                                    placeholder="Any extra context..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/70 block mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value as Task['priority'])}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                    >
                                        <option value="low" className="bg-[#111]">Low</option>
                                        <option value="medium" className="bg-[#111]">Medium</option>
                                        <option value="high" className="bg-[#111]">High</option>
                                        <option value="critical" className="bg-[#111]">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-white/70 block mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                    >
                                        <option value="" className="bg-[#111]">None</option>
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c.toLowerCase()} className="bg-[#111]">{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Advanced Options toggle */}
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(v => !v)}
                                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
                            >
                                <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                                Advanced Options
                            </button>

                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        {/* Due date */}
                                        <div>
                                            <label className="text-xs text-white/70 block mb-1">Due date <span className="text-white/30">(optional)</span></label>
                                            <input
                                                type="datetime-local"
                                                value={dueDate}
                                                onChange={e => setDueDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm [color-scheme:dark]"
                                            />
                                        </div>

                                        {/* Repeat */}
                                        <div>
                                            <label className="text-xs text-white/70 block mb-1">Repeat</label>
                                            <select
                                                value={recurringPattern}
                                                onChange={e => setRecurringPattern(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                            >
                                                <option value="" className="bg-[#111]">None</option>
                                                <option value="daily" className="bg-[#111]">Daily</option>
                                                <option value="weekdays" className="bg-[#111]">Weekdays (Mon–Fri)</option>
                                                <option value="weekly" className="bg-[#111]">Weekly</option>
                                            </select>
                                        </div>

                                        {/* Task type (only when creating) */}
                                        {!editingTask && (
                                            <div>
                                                <label className="text-xs text-white/70 block mb-1">Type</label>
                                                <select
                                                    value={taskType}
                                                    onChange={e => setTaskType(e.target.value as 'goal' | 'timed')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                                >
                                                    <option value="goal" className="bg-[#111]">Goal (Open-ended)</option>
                                                    <option value="timed" className="bg-[#111]">Timed (Countdown)</option>
                                                </select>
                                            </div>
                                        )}

                                        {(taskType === 'timed' || editingTask?.task_type === 'timed') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-white/70 block mb-1">Duration (minutes)</label>
                                                    <input
                                                        type="number"
                                                        value={duration}
                                                        onChange={e => setDuration(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                        min="1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/70 block mb-1">Check-in interval</label>
                                                    <select
                                                        value={checkinInterval}
                                                        onChange={e => setCheckinInterval(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                                    >
                                                        <option value="0" className="bg-[#111]">None (start/end only)</option>
                                                        <option value="15" className="bg-[#111]">Every 15 mins</option>
                                                        <option value="30" className="bg-[#111]">Every 30 mins</option>
                                                        <option value="60" className="bg-[#111]">Every 60 mins</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Verification prompt */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs text-white/70">Verification prompt</label>
                                                <button
                                                    type="button"
                                                    onClick={generateVerificationPrompt}
                                                    disabled={!title.trim() || generatingPrompt}
                                                    className="text-xs px-2 py-0.5 rounded-md transition-all disabled:opacity-40"
                                                    style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}
                                                >
                                                    {generatingPrompt ? '⏳ Generating...' : '✨ Generate'}
                                                </button>
                                            </div>
                                            <textarea
                                                value={verificationPrompt}
                                                onChange={e => setVerificationPrompt(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                rows={3}
                                                placeholder="How will you prove it? Click ✨ Generate to auto-fill based on your title."
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-white/60 hover:text-white">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
                                >
                                    {submitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-10 flex justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : displayedTasks.length === 0 ? (
                    <div className="text-center py-10 glass-card">
                        <div className="text-4xl mb-3">🎯</div>
                        <p className="text-white font-medium">
                            {categoryFilter !== 'all' ? `No ${categoryFilter} tasks` : `No ${filter} tasks`}
                        </p>
                        <p className="text-sm text-white/50 mt-1">
                            {filter === 'active' ? 'Create a task and get to work.' : 'Nothing here yet.'}
                        </p>
                        {filter === 'active' && categoryFilter === 'all' && (
                            <button
                                onClick={openCreateModal}
                                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                            >
                                + Create Task
                            </button>
                        )}
                    </div>
                ) : (
                    displayedTasks.map(task => {
                        const overdue = isOverdue(task);
                        const catKey = (task.category || 'other').toLowerCase();
                        const catColor = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.other;
                        const dueDateStr = task.due_date
                            ? new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : null;

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass-card p-4 flex flex-col md:flex-row gap-4 justify-between group ${overdue ? 'border border-red-500/30' : ''}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getPriorityColor(task.priority) }} />
                                        <h3 className="font-semibold text-white truncate">{task.title}</h3>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0" style={{ background: 'var(--bg-card-border)', color: 'var(--text-muted)' }}>
                                            {task.task_type}
                                        </span>
                                        {task.category && task.category !== 'general' && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 capitalize" style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}33` }}>
                                                {task.category}
                                            </span>
                                        )}
                                        {overdue && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' }}>
                                                OVERDUE
                                            </span>
                                        )}
                                    </div>
                                    {task.description && (
                                        <p className="text-sm text-white/60 line-clamp-1">{task.description}</p>
                                    )}

                                    <div className="flex gap-3 mt-3 text-xs font-medium flex-wrap items-center">
                                        <span style={{ color: 'var(--accent-gold)' }}>+{task.xp_reward} XP</span>
                                        {task.task_type === 'timed' && task.duration_minutes && (
                                            <span className="text-white/40">⏱ {task.duration_minutes}m</span>
                                        )}
                                        {task.checkin_interval_minutes && (
                                            <span className="text-white/40">🔔 Every {task.checkin_interval_minutes}m</span>
                                        )}
                                        {task.recurring_pattern && (
                                            <span className="text-white/40">🔄 {task.recurring_pattern === 'weekdays' ? 'Weekdays' : task.recurring_pattern.charAt(0).toUpperCase() + task.recurring_pattern.slice(1)}</span>
                                        )}
                                        {dueDateStr && (
                                            <span style={{ color: overdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                                                📅 {dueDateStr}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {filter === 'active' && (
                                        <>
                                            <Link
                                                href={`/chat?task=${encodeURIComponent(task.title)}`}
                                                className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                                                title="Discuss with coach"
                                            >
                                                💬
                                            </Link>
                                            <button
                                                onClick={() => openEditModal(task)}
                                                className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                                                title="Edit task"
                                            >
                                                ✏️
                                            </button>
                                            <Link
                                                href={`/tasks/${task.id}/active`}
                                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap"
                                            >
                                                {task.status === 'pending' ? 'Start Task' : 'Resume'}
                                            </Link>
                                        </>
                                    )}
                                    {filter !== 'active' && (
                                        <span className={`px-3 py-1 text-xs rounded-lg font-medium border ${filter === 'completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                            {filter === 'completed' ? 'Verified' : 'Failed'}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
