'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Brain, MessageSquare, Save, Trash2, Clock, User } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

interface Memory {
    id: string;
    content: string;
    importance: number;
    category: string;
    created_at: string;
}

export default function SettingsPage() {
    const [permanentMemory, setPermanentMemory] = useState('');
    const [coachPrompt, setCoachPrompt] = useState('');
    const [userName, setUserName] = useState('');
    const [memories, setMemories] = useState<Memory[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [loadingMemories, setLoadingMemories] = useState(true);

    // Load settings
    useEffect(() => {
        async function loadSettings() {
            try {
                // Fetch name from auth
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata?.first_name) {
                    setUserName(user.user_metadata.first_name);
                }

                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success) {
                    setPermanentMemory(data.data.permanent_memory || '');
                    setCoachPrompt(data.data.coach_system_prompt || '');
                }
            } catch (err) {
                console.error('Failed to load settings:', err);
            } finally {
                setLoadingSettings(false);
            }
        }
        loadSettings();
    }, []);

    // Load memories
    useEffect(() => {
        async function loadMemories() {
            try {
                const res = await fetch('/api/memories');
                const data = await res.json();
                if (data.success) {
                    setMemories(data.data);
                }
            } catch (err) {
                console.error('Failed to load memories:', err);
            } finally {
                setLoadingMemories(false);
            }
        }
        loadMemories();
    }, []);

    // Save settings
    async function handleSave() {
        triggerHaptic();
        setSaving(true);
        setSaved(false);
        try {
            // Update auth metadata
            await supabase.auth.updateUser({
                data: { first_name: userName }
            });

            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    permanent_memory: permanentMemory,
                    coach_system_prompt: coachPrompt,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    }

    // Delete a memory
    async function deleteMemory(id: string) {
        triggerHaptic();
        try {
            const res = await fetch('/api/memories', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.success) {
                setMemories(prev => prev.filter(m => m.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete memory:', err);
        }
    }

    const categoryColors: Record<string, string> = {
        goal: 'var(--color-neon-blue)',
        preference: 'var(--color-neon-green)',
        habit: 'var(--color-neon-amber)',
        struggle: 'var(--color-neon-red)',
        general: '#9CA3AF',
    };

    return (
        <div className="space-y-6 pt-12 px-6 pb-32 max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Settings className="text-neon-blue" size={20} />
                </div>
                <div>
                    <h1 className="text-3xl font-heading font-black text-white">System Config</h1>
                    <p className="text-gray-400 font-semibold text-sm tracking-wide uppercase mt-1">
                        Neural Net Preferences
                    </p>
                </div>
            </motion.div>

            {loadingSettings ? (
                <div className="glass-card p-12 flex items-center justify-center rounded-[2rem]">
                    <div className="animate-spin w-8 h-8 mx-auto border-2 border-neon-blue border-t-transparent rounded-full" />
                </div>
            ) : (
                <>
                    {/* Operator Profile */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-lg relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none group-focus-within:bg-white/10 transition-colors" />
                        <div className="flex items-center gap-2 relative z-10">
                            <User size={18} className="text-white" />
                            <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider">Operator Profile</h2>
                        </div>
                        <p className="text-xs text-gray-400 font-medium relative z-10 mb-2">
                            What the system calls you.
                        </p>

                        <div className="relative z-10 w-full">
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="e.g., Hayden"
                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white outline-none text-sm transition-colors focus:border-white/50 focus:bg-white/5 shadow-inner"
                            />
                        </div>
                    </motion.div>

                    {/* Permanent Memory */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-lg relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-[40px] pointer-events-none group-focus-within:bg-neon-blue/10 transition-colors" />
                        <div className="flex items-center gap-2 relative z-10">
                            <Brain size={18} className="text-neon-blue" />
                            <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider">Core Intelligence</h2>
                        </div>
                        <p className="text-xs text-gray-400 font-medium relative z-10">
                            Foundational data the AI maintains across every session. Be explicit about your identity.
                        </p>

                        <textarea
                            value={permanentMemory}
                            onChange={(e) => setPermanentMemory(e.target.value)}
                            placeholder={"About me: I'm building an e-commerce business...\nMy goals: 3 hours of deep work daily, gym 4x/week...\nCommunication style: Be direct, challenge me..."}
                            rows={5}
                            className="w-full relative z-10 px-4 py-4 rounded-xl border border-white/10 bg-black/40 text-white outline-none text-sm resize-none transition-colors focus:border-neon-blue/50 focus:bg-white/5 shadow-inner"
                        />
                    </motion.div>

                    {/* Coach Personality */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-lg relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-amber/5 rounded-full blur-[40px] pointer-events-none group-focus-within:bg-neon-amber/10 transition-colors" />
                        <div className="flex items-center gap-2 relative z-10">
                            <MessageSquare size={18} className="text-neon-amber" />
                            <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider">Coach Persona</h2>
                        </div>
                        <p className="text-xs text-gray-400 font-medium relative z-10">
                            The system prompt determining how the accountability coach interacts with you.
                        </p>

                        <textarea
                            value={coachPrompt}
                            onChange={(e) => setCoachPrompt(e.target.value)}
                            placeholder="You are GSD Coach — a ruthless, no-BS accountability partner..."
                            rows={8}
                            className="w-full relative z-10 px-4 py-4 rounded-xl border border-white/10 bg-black/40 text-white outline-none text-sm resize-none transition-colors focus:border-neon-amber/50 focus:bg-white/5 shadow-inner"
                        />
                    </motion.div>

                    {/* Save Action */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="flex items-center gap-4 justify-end"
                    >
                        <AnimatePresence>
                            {saved && (
                                <motion.span
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="text-xs font-bold uppercase tracking-widest text-neon-green flex items-center gap-1"
                                >
                                    Sys Updated √
                                </motion.span>
                            )}
                        </AnimatePresence>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-3 rounded-xl font-bold text-sm text-black transition-all disabled:opacity-50 flex items-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-neon-blue), #00A6CE)',
                                boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
                            }}
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save size={16} />}
                            {saving ? 'Compiling...' : 'Deploy Changes'}
                        </motion.button>
                    </motion.div>
                </>
            )}

            {/* Stored Memories Database */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-lg pt-8 mt-4"
            >
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <div className="flex items-center gap-2 text-white mb-1">
                            <Brain size={18} className="text-neon-green" />
                            <h2 className="text-lg font-heading font-bold uppercase tracking-wider">Memory Log</h2>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Extracted conversational data.</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 uppercase tracking-widest">
                        {memories.length} Nodes
                    </span>
                </div>

                {loadingMemories ? (
                    <div className="py-8 flex justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full" />
                    </div>
                ) : memories.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-black/40 border border-white/5">
                        <Brain size={40} className="mx-auto text-white/10 mb-3" />
                        <p className="text-sm font-bold text-gray-500">Database Empty</p>
                        <p className="text-xs text-gray-600 mt-1">Memories will populate as you chat.</p>
                    </div>
                ) : (
                    <div className="space-y-3 pt-2">
                        {memories.map((memory) => (
                            <motion.div
                                key={memory.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-start justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5 hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium break-words leading-relaxed">{memory.content}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span
                                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                                            style={{
                                                color: categoryColors[memory.category] || categoryColors.general,
                                                background: `color-mix(in srgb, ${categoryColors[memory.category] || categoryColors.general} 10%, transparent)`,
                                                border: `1px solid color-mix(in srgb, ${categoryColors[memory.category] || categoryColors.general} 20%, transparent)`
                                            }}
                                        >
                                            {memory.category}
                                        </span>
                                        <span className="text-[10px] font-bold opacity-40 uppercase">
                                            WGT: {memory.importance}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteMemory(memory.id)}
                                    className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-neon-red hover:bg-neon-red/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Schedules Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-lg opacity-50 grayscale mt-4"
            >
                <div className="flex items-center gap-2">
                    <Clock size={18} className="text-gray-400" />
                    <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider">Automations & Cron</h2>
                </div>
                <div className="text-center py-6 px-4 bg-black/40 rounded-2xl border border-white/5">
                    <p className="text-xs font-bold tracking-widest uppercase text-gray-500">Locked — V2 Feature</p>
                </div>
            </motion.div>
        </div>
    );
}
