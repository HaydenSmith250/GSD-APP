'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { useRouter } from 'next/navigation';

interface Message {
    id: string;
    sender: 'ai' | 'user';
    text: string;
}

export default function ChatSessionPage({ params }: { params: Promise<{ chatId: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const chatId = resolvedParams.chatId;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch existing messages
        fetch(`/api/chat?sessionId=${chatId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    const loaded = data.data.map((m: any) => ({
                        id: m.id,
                        sender: m.role === 'assistant' ? 'ai' : 'user',
                        text: m.content
                    }));
                    setMessages(loaded);
                }
            });
    }, [chatId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        triggerHaptic();
        playSound('msg_send');

        const newMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, newMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMsg.text, sessionId: chatId })
            });
            const data = await res.json();

            if (data.success) {
                playSound('msg_receive');
                triggerHaptic();
                setMessages(prev => [
                    ...prev,
                    { id: data.data.id, sender: 'ai', text: data.data.content }
                ]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-gsd-bg pb-[calc(85px+env(safe-area-inset-bottom))]">
            {/* Header */}
            <header className="px-4 py-3 pt-[max(1rem,env(safe-area-inset-top))] flex items-center gap-3 border-b border-white/5 bg-gsd-surface/90 backdrop-blur-xl z-20 shrink-0 sticky top-0">
                <button onClick={() => router.push('/coach')} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="text-xl">😎</span>
                </div>
                <div>
                    <h1 className="font-heading font-black text-white text-lg leading-tight">Dan</h1>
                    <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" /> Online
                    </p>
                </div>
            </header>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-4"
                style={{ scrollBehavior: 'smooth' }}
            >
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.sender === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 mr-2 flex-shrink-0 flex items-center justify-center self-end mb-1">
                                    <span className="text-sm">😎</span>
                                </div>
                            )}

                            <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${msg.sender === 'user'
                                ? 'bg-gradient-to-br from-neon-blue to-[#1E3A8A] text-white rounded-br-sm shadow-[0_4px_15px_rgba(0,229,255,0.2)]'
                                : 'glass-card bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'
                                }`}>
                                <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex justify-start"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 mr-2 flex-shrink-0 flex items-center justify-center self-end mb-1">
                                <span className="text-sm">😎</span>
                            </div>
                            <div className="px-4 py-4 glass-card bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm flex gap-1.5">
                                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="w-full px-4 pt-2 pb-6 bg-gsd-bg z-20 shrink-0 border-t border-white/5">
                <form
                    onSubmit={handleSend}
                    className="relative flex items-center glass-card bg-gsd-surface/90 border border-white/10 p-1.5 rounded-full shadow-lg backdrop-blur-xl"
                >
                    <button type="button" className="p-2.5 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full ml-1">
                        <ImageIcon size={20} />
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            if (e.target.value.length > inputValue.length) {
                                playSound('type_key');
                            }
                        }}
                        placeholder="Message Dan..."
                        className="flex-1 bg-transparent border-none outline-none px-4 text-white text-[15px] placeholder:text-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="p-3 bg-neon-blue text-black rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        style={{ boxShadow: inputValue.trim() ? '0 0 15px rgba(0,229,255,0.4)' : 'none' }}
                    >
                        <Send size={18} className="ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
