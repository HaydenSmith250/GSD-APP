'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { useRouter } from 'next/navigation';

interface ChatSession {
    id: string;
    title: string;
    updated_at: string;
}

export default function CoachInboxPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/chat/sessions');
            const data = await res.json();
            if (data.success) {
                setSessions(data.data);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleCreateNewChat = async () => {
        triggerHaptic();
        try {
            const res = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Conversation' })
            });
            const data = await res.json();
            if (data.success && data.data) {
                router.push(`/coach/${data.data.id}`);
            }
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic();
        try {
            await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
            setSessions(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-gsd-bg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(80px+env(safe-area-inset-bottom))]">
            {/* Header */}
            <header className="py-4 md:py-6 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <span className="text-2xl">😎</span>
                    </div>
                    <div>
                        <h1 className="font-heading font-black text-white text-2xl leading-tight">Coach Dan</h1>
                        <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" /> Online
                        </p>
                    </div>
                </div>
            </header>

            {/* Create New Chat Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNewChat}
                className="w-full mb-8 glass-card bg-neon-blue/10 border border-neon-blue/30 rounded-2xl p-4 flex items-center justify-center gap-2 group hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all"
            >
                <div className="w-8 h-8 rounded-full bg-neon-blue text-black flex items-center justify-center">
                    <Plus size={20} strokeWidth={3} />
                </div>
                <span className="font-heading font-black tracking-wide text-neon-blue uppercase">Start New Briefing</span>
            </motion.button>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto safe-scrollbar space-y-3 pb-8">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-2">Past Briefings</h2>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card p-4 rounded-2xl border border-white/5 h-[72px] bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <MessageSquare size={32} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-sm font-bold text-gray-300">No briefings yet.</p>
                        <p className="text-xs text-gray-500 mt-1">Start a new chat to get your day moving.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {sessions.map((session) => (
                            <motion.div
                                key={session.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => {
                                    triggerHaptic();
                                    router.push(`/coach/${session.id}`);
                                }}
                                className="glass-card bg-black/40 border border-white/5 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer group transition-all"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <h3 className="text-[15px] font-bold text-white truncate">{session.title}</h3>
                                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                                            {new Date(session.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleDelete(session.id, e)}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
