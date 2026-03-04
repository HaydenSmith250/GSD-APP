'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [memories, setMemories] = useState<Memory[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [loadingMemories, setLoadingMemories] = useState(true);

    // Load settings
    useEffect(() => {
        async function loadSettings() {
            try {
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
        setSaving(true);
        setSaved(false);
        try {
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
        goal: 'var(--accent-blue)',
        preference: 'var(--accent-green)',
        habit: 'var(--accent-gold)',
        struggle: 'var(--accent-red)',
        general: 'var(--text-secondary)',
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Configure your coach and preferences
                </p>
            </motion.div>

            {loadingSettings ? (
                <div className="glass-card p-8 flex items-center justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <>
                    {/* Permanent Memory */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 space-y-4"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-white">Permanent Memory</h2>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                Things the AI should always know about you. Injected into every conversation.
                            </p>
                        </div>
                        <textarea
                            value={permanentMemory}
                            onChange={(e) => setPermanentMemory(e.target.value)}
                            placeholder={"About me: I'm building an e-commerce business...\nMy goals: 3 hours of deep work daily, gym 4x/week...\nCommunication style: Be direct, challenge me..."}
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border bg-white/5 outline-none text-sm resize-none transition-colors focus:ring-1 focus:ring-blue-500/30"
                            style={{ borderColor: 'var(--bg-card-border)' }}
                        />
                    </motion.div>

                    {/* Coach Personality */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6 space-y-4"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-white">Coach Personality</h2>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                The system prompt that defines how the AI coach behaves and talks to you.
                            </p>
                        </div>
                        <textarea
                            value={coachPrompt}
                            onChange={(e) => setCoachPrompt(e.target.value)}
                            placeholder="You are GSD Coach — a ruthless, no-BS accountability partner..."
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl border bg-white/5 outline-none text-sm resize-none transition-colors focus:ring-1 focus:ring-blue-500/30"
                            style={{ borderColor: 'var(--bg-card-border)' }}
                        />
                    </motion.div>

                    {/* Save button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl font-medium text-sm text-white transition-all disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                boxShadow: '0 0 16px rgba(59, 130, 246, 0.2)',
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                        <AnimatePresence>
                            {saved && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm"
                                    style={{ color: 'var(--accent-green)' }}
                                >
                                    ✓ Saved
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}

            {/* Stored Memories (Layer 3) */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Stored Memories</h2>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            Things the AI has learned about you from conversations. Click × to remove incorrect ones.
                        </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                        {memories.length} memories
                    </span>
                </div>

                {loadingMemories ? (
                    <div className="py-6 flex justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : memories.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                        <div className="text-3xl">🧠</div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            No memories yet. Chat with your coach and memories will be extracted automatically.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {memories.map((memory) => (
                            <motion.div
                                key={memory.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/5"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white">{memory.content}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded"
                                            style={{
                                                color: categoryColors[memory.category] || categoryColors.general,
                                                background: `color-mix(in srgb, ${categoryColors[memory.category] || categoryColors.general} 15%, transparent)`,
                                            }}
                                        >
                                            {memory.category}
                                        </span>
                                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            importance: {memory.importance}/10
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteMemory(memory.id)}
                                    className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-red-500/10 flex-shrink-0"
                                    style={{ color: 'var(--text-muted)' }}
                                    title="Delete this memory"
                                >
                                    ×
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Schedules placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6 space-y-4"
            >
                <div>
                    <h2 className="text-lg font-semibold text-white">Scheduled Check-ins</h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Configure automated coach check-ins
                    </p>
                </div>
                <div className="text-center py-6 space-y-2">
                    <div className="text-3xl">⏰</div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Coming in Phase 5</p>
                </div>
            </motion.div>
        </div>
    );
}
