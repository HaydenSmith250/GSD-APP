'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Camera, Sparkles, ChevronDown, ArrowRight, ArrowLeft, CalendarDays, Rocket } from 'lucide-react';
import { playSound } from '@/lib/sounds';
import { triggerHaptic } from '@/lib/haptics';
import { useRouter } from 'next/navigation';

interface TaskCreateSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (task?: any) => void;
    initialDate?: Date;
}

export default function TaskCreateSheet({ isOpen, onClose, onSuccess, initialDate }: TaskCreateSheetProps) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);

    // Step 1 State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isTimed, setIsTimed] = useState(false);

    // Step 2 State
    const [isScheduled, setIsScheduled] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState('30');
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [dueDate, setDueDate] = useState<string>(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [dueTime, setDueTime] = useState<string>(''); // empty means all-day
    const [recurringPattern, setRecurringPattern] = useState<'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly'>('none');

    // Verification config
    const [startVerificationPrompt, setStartVerificationPrompt] = useState<string>('');
    const [endVerificationPrompt, setEndVerificationPrompt] = useState<string>('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleNextStep = async () => {
        if (!title.trim()) return;
        triggerHaptic();
        setStep(2);

        if (suggestions.length === 0) {
            setLoadingSuggestions(true);
            try {
                const res = await fetch('/api/tasks/suggest-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description })
                });
                const data = await res.json();
                if (data.success && data.suggestions) {
                    setSuggestions(data.suggestions);
                    if (data.suggestions.length > 0) {
                        setEndVerificationPrompt(data.suggestions[0]);
                        setStartVerificationPrompt(data.suggestions[0]);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingSuggestions(false);
            }
        }
    };

    const handlePrevStep = () => {
        triggerHaptic();
        setStep(1);
    };

    const handleGetSuggestions = async () => {
        setLoadingSuggestions(true);
        triggerHaptic();
        try {
            const res = await fetch('/api/tasks/suggest-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            const data = await res.json();
            if (data.success && data.suggestions) {
                setSuggestions(data.suggestions);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        triggerHaptic();

        try {
            let finalDueDate = null;
            if (isScheduled) {
                if (dueDate) {
                    finalDueDate = dueTime ? `${dueDate}T${dueTime}:00Z` : `${dueDate}T23:59:59Z`;
                }
            } else {
                // Task for now
                finalDueDate = new Date().toISOString();
            }

            // Encode verification structure
            const finalVerificationPrompt = JSON.stringify({
                start: startVerificationPrompt || 'A photo showing you are ready to start.',
                end: endVerificationPrompt || 'A photo showing the final result.',
            });

            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    priority: 'medium',
                    status: 'pending',
                    task_type: isTimed ? 'timed' : 'goal',
                    duration_minutes: isTimed ? parseInt(durationMinutes, 10) : null,
                    verification_required: true,
                    verification_prompt: finalVerificationPrompt,
                    xp_reward: isTimed ? parseInt(durationMinutes, 10) : 50,
                    due_date: finalDueDate,
                    recurring_pattern: recurringPattern === 'none' ? null : recurringPattern,
                }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to create task');

            playSound('task_create');

            const task = data.data;

            // Reset form
            setTitle('');
            setDescription('');
            setIsTimed(false);
            setIsScheduled(false);
            setDurationMinutes('30');
            setRequiresVerification(false);
            setStartVerificationPrompt('');
            setEndVerificationPrompt('');
            setSuggestions([]);
            setRecurringPattern('none');
            setDueDate(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setDueTime('');
            setStep(1);

            onSuccess(task);
            onClose();

            // Task now goes into queue regardless, so we don't automatically router.push
        } catch (error) {

            console.error('Error creating task:', error);
            playSound('verify_fail');
        } finally {
            setLoading(false);
        }
    };

    const isTimeCloseToNow = (dateStr: string, timeStr: string) => {
        if (!timeStr) return true;
        const now = new Date();
        const scheduledStr = `${dateStr}T${timeStr}:00`;
        const scheduled = new Date(scheduledStr);
        const diffMinutes = (scheduled.getTime() - now.getTime()) / 60000;
        return (diffMinutes <= 15 && diffMinutes >= -60);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: '20%', opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: '20%', opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-x-4 top-[10%] md:top-1/2 md:-translate-y-1/2 max-w-sm mx-auto z-[101] max-h-[80vh] overflow-y-auto glass-card border border-white/10 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] safe-scrollbar"
                    >
                        <div className="flex justify-between items-center mb-6">
                            {step === 2 ? (
                                <button type="button" onClick={handlePrevStep} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400">
                                    <ArrowLeft size={20} />
                                </button>
                            ) : (
                                <div className="w-10"></div>
                            )}
                            <h2 className="text-xl font-heading font-black text-white">
                                {step === 1 ? 'Create Mission' : 'Mission Details'}
                            </h2>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex justify-center gap-2 mb-6">
                            <div className={`w-12 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                            <div className={`w-12 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3 glass-card p-5 rounded-3xl border border-white/5 bg-black/40">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="What are you getting done?"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full bg-transparent text-3xl font-heading font-black text-white placeholder:text-white/20 outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Add context or details (optional)"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="w-full bg-transparent text-sm text-gray-300 placeholder:text-white/20 outline-none"
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block px-2">Mission Type</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsTimed(false); triggerHaptic(); }}
                                                    className={`p-4 rounded-[1.5rem] border text-left transition-all ${!isTimed ? 'bg-neon-blue/10 border-neon-blue/30 shadow-[0_0_20px_rgba(0,229,255,0.15)]' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${!isTimed ? 'bg-neon-blue text-black' : 'bg-white/10 text-white/50'}`}>
                                                        <CheckCircleIcon size={20} />
                                                    </div>
                                                    <p className={`font-bold ${!isTimed ? 'text-white' : ''}`}>Till Finish</p>
                                                    <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Standard Task</p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => { setIsTimed(true); triggerHaptic(); }}
                                                    className={`p-4 rounded-[1.5rem] border text-left transition-all relative overflow-hidden ${isTimed ? 'bg-neon-amber/10 border-neon-amber/30 shadow-[0_0_20px_rgba(255,176,0,0.15)]' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                                                >
                                                    {isTimed && <div className="absolute top-0 right-0 w-24 h-24 bg-neon-amber/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />}
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 relative z-10 ${isTimed ? 'bg-neon-amber text-black' : 'bg-white/10 text-white/50'}`}>
                                                        <Clock size={20} />
                                                    </div>
                                                    <p className={`font-bold relative z-10 ${isTimed ? 'text-white' : ''}`}>Deep Work</p>
                                                    <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider relative z-10">Timed Session</p>
                                                </button>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={handleNextStep}
                                            disabled={!title.trim()}
                                            className="w-full py-4 rounded-xl mt-4 font-bold text-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden group"
                                            style={{
                                                background: 'white',
                                                boxShadow: title.trim() ? '0 0 20px rgba(255, 255, 255, 0.3)' : 'none',
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                            Next Step <ArrowRight size={20} />
                                        </motion.button>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-5">
                                            {/* Execution Timing */}
                                            <div className="glass-card p-5 rounded-[1.5rem] border border-white/5 relative overflow-hidden">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2 text-white">
                                                        <CalendarDays size={18} className="text-neon-blue" />
                                                        <h3 className="text-sm font-bold tracking-wide">Execution Window</h3>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-4 border border-white/5">
                                                    <button type="button" onClick={() => { setIsScheduled(false); triggerHaptic(); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${!isScheduled ? 'bg-white/15 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>
                                                        <Rocket size={14} /> Execute Now
                                                    </button>
                                                    <button type="button" onClick={() => { setIsScheduled(true); triggerHaptic(); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${isScheduled ? 'bg-white/15 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>
                                                        <CalendarDays size={14} /> Schedule Later
                                                    </button>
                                                </div>

                                                <AnimatePresence>
                                                    {isScheduled && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                                                            <div className="flex gap-3">
                                                                <div className="flex-1 relative group">
                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                        <CalendarDays size={14} className="text-neon-blue" />
                                                                    </div>
                                                                    <input
                                                                        type="date"
                                                                        value={dueDate}
                                                                        onChange={(e) => setDueDate(e.target.value)}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm font-medium outline-none focus:bg-white/10 transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 relative group">
                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                        <Clock size={14} className="text-neon-blue" />
                                                                    </div>
                                                                    <input
                                                                        type="time"
                                                                        value={dueTime}
                                                                        onChange={(e) => setDueTime(e.target.value)}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm font-medium outline-none focus:bg-white/10 transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="relative">
                                                                <select
                                                                    value={recurringPattern}
                                                                    onChange={(e) => setRecurringPattern(e.target.value as any)}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 font-medium text-sm outline-none focus:bg-white/10 transition-colors appearance-none"
                                                                >
                                                                    <option value="none">Does not repeat</option>
                                                                    <option value="daily">Every day</option>
                                                                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                                                                    <option value="weekly">Every week</option>
                                                                    <option value="monthly">Every month</option>
                                                                </select>
                                                                <ChevronDown size={14} className="absolute right-4 top-4 text-neon-blue pointer-events-none" />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {isTimed && (
                                                    <div className="mt-3">
                                                        <label className="text-[10px] font-bold text-neon-amber uppercase tracking-widest mb-1.5 block">Session Duration (Mins)</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="480"
                                                                value={durationMinutes}
                                                                onChange={(e) => setDurationMinutes(e.target.value)}
                                                                className="w-full bg-neon-amber/5 border border-neon-amber/30 rounded-xl pl-10 pr-4 py-3 text-neon-amber font-bold text-lg outline-none focus:bg-neon-amber/10 shadow-[0_0_15px_rgba(255,176,0,0.1)] transition-colors"
                                                            />
                                                            <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neon-amber/50" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Photo Verification */}
                                            <div className="glass-card p-5 rounded-[1.5rem] border border-white/5 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-neon-green/10 transition-colors" />
                                                <div className="flex items-center justify-between mb-4 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <Camera size={18} className="text-neon-green" />
                                                        <h3 className="text-sm font-bold text-white tracking-wide">Photo Verification Rules</h3>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-2 relative z-10 overflow-hidden">

                                                    {loadingSuggestions ? (
                                                        <div className="flex w-full items-center justify-center p-4">
                                                            <div className="w-5 h-5 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mr-2" />
                                                            <span className="text-sm text-neon-blue font-bold">Brainstorming verification rules...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {(!suggestions.length) && (
                                                                <button type="button" onClick={handleGetSuggestions} className="w-full py-3 rounded-xl border border-neon-blue/30 bg-neon-blue/10 text-neon-blue font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-neon-blue/20 transition-all shadow-[0_0_15px_rgba(0,229,255,0.1)] active:scale-95">
                                                                    <Sparkles size={16} /> Auto-Suggest Rules
                                                                </button>
                                                            )}

                                                            {suggestions.length > 0 && (
                                                                <div className="flex flex-wrap justify-center gap-2 pb-2">
                                                                    {suggestions.map((opt, i) => (
                                                                        <button
                                                                            key={i}
                                                                            type="button"
                                                                            onClick={() => { setEndVerificationPrompt(opt); if (!startVerificationPrompt) setStartVerificationPrompt(opt); triggerHaptic(); }}
                                                                            className="text-center text-[11px] font-bold tracking-wide leading-snug px-4 py-2 rounded-xl border border-neon-blue/30 bg-neon-blue/10 hover:bg-neon-blue/20 hover:border-neon-blue/100 transition-colors text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.1)] active:scale-95"
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-neon-green uppercase tracking-widest mb-1.5 flex justify-center text-center">Start Proof Standard</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Photo of your textbook opened"
                                                                value={startVerificationPrompt}
                                                                onChange={(e) => setStartVerificationPrompt(e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-neon-green/50 transition-colors placeholder:text-gray-600 text-center"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-neon-green uppercase tracking-widest mb-1.5 flex justify-center text-center">Completion Standard</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Photo of finished code"
                                                                value={endVerificationPrompt}
                                                                onChange={(e) => setEndVerificationPrompt(e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-neon-green/50 transition-colors placeholder:text-gray-600 text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all disabled:opacity-50 relative overflow-hidden group shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                                            style={{
                                                background: 'linear-gradient(135deg, var(--color-neon-blue), #00A6CE)',
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                            {loading ? 'Initializing...' : 'Initialize Mission'}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function CheckCircleIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    )
}
