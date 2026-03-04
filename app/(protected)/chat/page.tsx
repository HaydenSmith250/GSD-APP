'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    source?: string;
    created_at: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load chat history on mount
    useEffect(() => {
        async function loadMessages() {
            try {
                const res = await fetch('/api/chat');
                const data = await res.json();
                if (data.success) {
                    setMessages(data.data);
                }
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                setInitialLoading(false);
            }
        }
        loadMessages();
    }, []);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Send message
    async function handleSend() {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        setError('');

        // Optimistically add user message
        const tempUserMsg: Message = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: text,
            source: 'web',
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMsg]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, data.data]);
            } else {
                setError(data.error || 'Failed to get response');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    // Handle Enter key (Shift+Enter for newline)
    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // Auto-resize textarea
    function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setInput(e.target.value);
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    return (
        <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-48px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{
                        background: 'linear-gradient(135deg, #3B82F6, #10B981)',
                        boxShadow: '0 0 16px rgba(59, 130, 246, 0.2)',
                    }}
                >
                    GSD
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-white">GSD Coach</h1>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Online</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 glass-card overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {initialLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-3">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading messages...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4 max-w-sm">
                                <div className="text-5xl">💪</div>
                                <p className="text-lg font-medium text-white">Ready to get shit done?</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Send a message to start talking to your AI accountability coach. No excuses.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: i === messages.length - 1 ? 0.1 : 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                                ? 'rounded-br-md'
                                                : 'rounded-bl-md'
                                            }`}
                                        style={{
                                            background: msg.role === 'user'
                                                ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                                                : 'var(--bg-card)',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                            border: msg.role === 'user' ? 'none' : '1px solid var(--bg-card-border)',
                                        }}
                                    >
                                        {msg.content}
                                        <div className="mt-1.5 text-[10px] opacity-50">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {msg.source && msg.source !== 'web' && (
                                                <span className="ml-1.5">via {msg.source}</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex justify-start"
                            >
                                <div
                                    className="px-4 py-3 rounded-2xl rounded-bl-md"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center"
                            >
                                <span
                                    className="inline-block text-xs px-3 py-1.5 rounded-lg"
                                    style={{ color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)' }}
                                >
                                    {error}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 border-t px-4 py-3" style={{ borderColor: 'var(--bg-card-border)' }}>
                    <div className="flex gap-2 items-end">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Message your coach..."
                            rows={1}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl border bg-white/5 outline-none text-sm resize-none transition-colors focus:ring-1 focus:ring-blue-500/30"
                            style={{
                                borderColor: 'var(--bg-card-border)',
                                maxHeight: '120px',
                            }}
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                boxShadow: input.trim() ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </motion.button>
                    </div>
                    <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                        Press Enter to send · Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
}
