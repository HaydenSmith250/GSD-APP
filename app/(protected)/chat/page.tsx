'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Send } from 'lucide-react';
import Image from 'next/image';

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

    // Pre-fill input from ?task= query param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const taskParam = params.get('task');
        if (taskParam) {
            setInput(`Let's talk about my task: ${taskParam}`);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, []);

    // Load chat history
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

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom, loading]);

    async function handleSend() {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        setError('');

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
            if (window.innerWidth > 768) {
                inputRef.current?.focus();
            }
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setInput(e.target.value);
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-48px)] flex flex-col bg-gsd-bg">

            {/* NEW HEADER MATCHING DESIGN */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-gsd-surface flex-shrink-0 z-10 w-[calc(100vw-6rem)]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(0,229,255,0.2)] bg-black flex items-center justify-center">
                        <span className="font-heading font-black text-xl italic text-neon-blue">D</span>
                    </div>
                    {/* Online indicator pip */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-neon-green rounded-full border-2 border-gsd-surface shadow-[0_0_8px_rgba(57,255,20,0.6)]" />
                </div>
                <div>
                    <h1 className="text-xl font-heading font-black text-white italic tracking-widest uppercase">DAN</h1>
                    <p className="text-[10px] text-neon-green font-bold tracking-widest uppercase mt-0.5">AI COACH • ONLINE</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 scroll-smooth">
                {/* DATE BADGE */}
                <div className="flex justify-center mb-8">
                    <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-inner">
                        TODAY
                    </span>
                </div>

                <div className="space-y-6">
                    {initialLoading ? (
                        <div className="flex justify-center mt-10">
                            <div className="animate-spin w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => {
                                const isUser = msg.role === 'user';

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                                            {/* Optional avatar on bot side */}
                                            {!isUser && (
                                                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-black border border-white/10 flex items-center justify-center shadow-lg self-end mb-1">
                                                    <span className="font-heading font-black text-neon-blue text-xs italic">D</span>
                                                </div>
                                            )}
                                            {isUser && (
                                                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-white/10 flex items-center justify-center shadow-lg self-end mb-1">
                                                    <span className="font-heading font-black text-white text-xs italic">U</span>
                                                </div>
                                            )}

                                            <div
                                                className={`px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed whitespace-pre-wrap shadow-xl`}
                                                style={{
                                                    background: isUser
                                                        ? 'linear-gradient(135deg, var(--color-neon-blue), var(--color-neon-green))'
                                                        : '#1c2127', // Dark gray card matched to image
                                                    color: isUser ? '#000' : 'white',
                                                    borderBottomRightRadius: isUser ? '4px' : undefined,
                                                    borderBottomLeftRadius: !isUser ? '4px' : undefined,
                                                }}
                                            >
                                                {/* If there's markdown style lists, just let them natural wrap */}
                                                <span className={isUser ? 'font-bold' : 'text-gray-200'}>{msg.content}</span>
                                            </div>
                                        </div>

                                        <div className={`mt-1 text-[10px] text-gray-600 font-bold ${isUser ? 'mr-12' : 'ml-12'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}

                    {loading && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start w-full gap-3">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-black border border-white/10 flex items-center justify-center self-end mb-1">
                                <span className="font-heading font-black text-neon-blue text-xs italic">D</span>
                            </div>
                            <div className="px-5 py-5 rounded-[1.5rem] rounded-bl-sm bg-[#1c2127] shadow-xl flex items-center gap-1.5 min-h-[44px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* NEW SLEEK INPUT AREA */}
            <div className="flex-shrink-0 px-4 pt-4 pb-8 bg-gsd-surface border-t border-white/5 drop-shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 relative">
                <div className="flex gap-3 items-center bg-[#1c2127] rounded-[2rem] p-2 pr-2 border border-white/5 focus-within:border-white/10 transition-colors shadow-inner">
                    <button className="p-2 text-gray-500 hover:text-white transition-colors ml-1">
                        <Paperclip size={20} />
                    </button>

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask DAN for productivity tips..."
                        rows={1}
                        disabled={loading}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500 resize-none py-3"
                        style={{ maxHeight: '120px' }}
                    />

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:grayscale transition-all"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-neon-blue), var(--color-neon-green))',
                            boxShadow: input.trim() ? '0 0 15px rgba(0,229,255,0.3)' : 'none',
                        }}
                    >
                        <Send size={16} fill="currentColor" className="text-black ml-0.5 -mb-0.5" />
                    </motion.button>
                </div>
            </div>

        </div>
    );
}
