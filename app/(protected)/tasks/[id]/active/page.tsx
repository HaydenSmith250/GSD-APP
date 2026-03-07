'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActiveTaskPage() {
    const { id } = useParams();
    const router = useRouter();
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Verification State
    const [uploading, setUploading] = useState(false);
    const [lastMessage, setLastMessage] = useState<string | null>(null);
    const [abandonDialog, setAbandonDialog] = useState(false);
    const [abandoning, setAbandoning] = useState(false);
    const [xpFloat, setXpFloat] = useState<{ amount: string; key: number } | null>(null);
    const [levelUpInfo, setLevelUpInfo] = useState<{ level: number } | null>(null);
    const [pendingUpload, setPendingUpload] = useState<{ file: File; preview: string; checkinType: string } | null>(null);
    const startInputRef = useRef<HTMLInputElement>(null);
    const periodicInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadTask();
        const interval = setInterval(loadTask, 30000); // refresh every 30s for checkin sync
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        if (!task) return;

        // Timer logic
        const timer = setInterval(() => {
            const now = new Date().getTime();

            if (task.status === 'in_progress' && task.next_checkin_at) {
                const target = new Date(task.next_checkin_at).getTime();
                const diff = target - now;

                if (diff <= 0) {
                    setTimeLeft('CHECK-IN REQUIRED NOW');
                } else {
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                }
            } else if (task.status === 'pending') {
                setTimeLeft('Awaiting Start Verification');
            } else if (task.status === 'verified') {
                setTimeLeft('Task Complete!');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [task]);

    async function loadTask() {
        try {
            const res = await fetch(`/api/tasks?status=active`);
            const data = await res.json();
            if (data.success) {
                const t = data.data.find((x: any) => x.id === id);
                if (t) setTask(t);
                else router.push('/tasks'); // not active anymore
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, checkinType: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setPendingUpload({ file, preview, checkinType });
        // Reset input so the same file can be re-selected after retake
        e.target.value = '';
    };

    const handleConfirmUpload = async () => {
        if (!pendingUpload) return;
        const { file, preview, checkinType } = pendingUpload;

        setUploading(true);
        setLastMessage(null);
        setPendingUpload(null);
        URL.revokeObjectURL(preview);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;

                const res = await fetch('/api/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId: id, imageBase64: base64, checkinType })
                });

                const data = await res.json();
                setLastMessage(data.coach_message);

                if (data.verified) {
                    let xpText = '';
                    if (checkinType === 'periodic') xpText = '+15 XP';
                    else if (checkinType === 'end' || checkinType === 'goal_finish') xpText = `+${(task.xp_reward || 0) + 25} XP`;
                    if (xpText) {
                        setXpFloat({ amount: xpText, key: Date.now() });
                        setTimeout(() => setXpFloat(null), 2000);
                    }
                    if (data.xp_updates?.leveledUp) {
                        setLevelUpInfo({ level: data.xp_updates.currentLevel });
                        setTimeout(() => setLevelUpInfo(null), 3500);
                    }
                    await loadTask();
                    if (checkinType === 'end' || checkinType === 'goal_finish') {
                        setTimeout(() => router.push('/tasks'), 3000);
                    }
                }
            };
        } catch (err) {
            console.error(err);
            setLastMessage('Failed to process upload. Try again.');
        } finally {
            setUploading(false);
        }
    };

    async function handleAbandon(status: 'failed' | 'skipped') {
        setAbandoning(true);
        try {
            await fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            router.push('/tasks');
        } catch (err) {
            console.error(err);
            setAbandoning(false);
        }
    }

    if (loading) return <div className="p-10 text-center text-white"><div className="animate-spin w-8 h-8 mx-auto border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
    if (!task) return null;

    const isPending = task.status === 'pending';
    const isFinished = task.status === 'verified';
    const needsCheckin = timeLeft === 'CHECK-IN REQUIRED NOW';

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] space-y-4">

            {/* Header Info */}
            <div className="glass-card p-6 flex-shrink-0 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ background: isPending ? 'var(--accent-blue)' : needsCheckin ? 'var(--accent-red)' : 'var(--accent-emerald)' }}></div>
                <h1 className="text-2xl font-bold text-white relative z-10">{task.title}</h1>
                <p className="text-sm text-white/70 mt-1 relative z-10">{task.task_type.toUpperCase()} • {task.priority}</p>

                <div className="mt-4 pb-2">
                    <div className={`text-5xl font-mono font-bold tracking-tight ${needsCheckin ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timeLeft}
                    </div>
                    {task.status === 'in_progress' && !needsCheckin && task.next_checkin_at && (
                        <p className="text-xs text-white/50 mt-2 uppercase tracking-widest">Until Next Verification</p>
                    )}
                </div>
            </div>

            {/* Main Execution Area */}
            <div className="glass-card flex-1 p-6 flex flex-col items-center justify-center space-y-6">

                {lastMessage && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 border border-white/20 rounded-xl p-4 w-full max-w-md">
                        <p className="text-sm font-medium text-white">🤖 Coach Says:</p>
                        <p className="text-white/80 mt-1 italic">"{lastMessage}"</p>
                    </motion.div>
                )}

                {isFinished ? (
                    <div className="text-center">
                        <div className="text-5xl mb-4">🏆</div>
                        <h2 className="text-2xl font-bold text-white">Task Crushed.</h2>
                        <p className="text-white/60 mt-2">XP Awarded. Returning to dashboard...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-sm space-y-4">
                        <p className="text-center text-sm text-white/60 mb-6 px-4">
                            <strong>Agreed Verification:</strong> {task.verification_prompt}
                        </p>

                        {isPending && (
                            <div className="space-y-3">
                                <button onClick={() => startInputRef.current?.click()} disabled={uploading} className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '📸 Send Start Proof'}
                                </button>
                                <input type="file" accept="image/*" capture="environment" ref={startInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'start')} />
                            </div>
                        )}

                        {!isPending && (
                            <div className="space-y-3">
                                {task.checkin_interval_minutes && (
                                    <>
                                        <button onClick={() => periodicInputRef.current?.click()} disabled={uploading} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${needsCheckin ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}>
                                            {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '⏱ Send Periodic Check-in'}
                                        </button>
                                        <input type="file" accept="image/*" capture="environment" ref={periodicInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'periodic')} />
                                    </>
                                )}

                                <div className="pt-4 mt-4 border-t border-white/10">
                                    <button onClick={() => endInputRef.current?.click()} disabled={uploading} className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (task.task_type === 'timed' ? '🏁 Finish & Verify' : '🏁 Mark Goal Complete & Verify')}
                                    </button>
                                    <input type="file" accept="image/*" capture="environment" ref={endInputRef} className="hidden" onChange={(e) => handleFileSelect(e, task.task_type === 'goal' ? 'goal_finish' : 'end')} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Abandon button — only when task is started and not finished */}
                {!isPending && !isFinished && (
                    <button
                        onClick={() => setAbandonDialog(true)}
                        className="text-xs text-white/25 hover:text-red-400 transition-colors mt-2"
                    >
                        Abandon task
                    </button>
                )}
            </div>

            {/* XP Float Animation */}
            <AnimatePresence>
                {xpFloat && (
                    <motion.div
                        key={xpFloat.key}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -80 }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                        className="fixed top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-50"
                    >
                        <span className="text-4xl font-black" style={{ color: 'var(--accent-gold)', textShadow: '0 0 24px rgba(251,191,36,0.6)' }}>
                            {xpFloat.amount}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Level-Up Overlay */}
            <AnimatePresence>
                {levelUpInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
                        onClick={() => setLevelUpInfo(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            transition={{ type: 'spring', bounce: 0.4 }}
                            className="text-center px-8"
                        >
                            <div className="text-7xl mb-4">⭐</div>
                            <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--accent-gold)' }}>Level Up!</p>
                            <p className="text-7xl font-black text-white">{levelUpInfo.level}</p>
                            <p className="text-white/50 mt-4 text-sm">Keep pushing.</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Photo Preview Modal */}
            <AnimatePresence>
                {pendingUpload && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-8"
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="glass-card p-5 w-full max-w-sm space-y-4"
                        >
                            <p className="text-sm font-semibold text-white/70 uppercase tracking-widest text-center">Confirm Photo</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={pendingUpload.preview}
                                alt="Preview"
                                className="w-full rounded-xl object-cover max-h-64"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { URL.revokeObjectURL(pendingUpload.preview); setPendingUpload(null); }}
                                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    ✕ Retake
                                </button>
                                <button
                                    onClick={handleConfirmUpload}
                                    disabled={uploading}
                                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                >
                                    {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '✓ Upload'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Abandon Confirmation Dialog */}
            {abandonDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 w-full max-w-sm space-y-4"
                    >
                        <h3 className="text-lg font-bold text-white">Abandon this task?</h3>
                        <p className="text-sm text-white/60">Choose how to close it. XP penalties apply.</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleAbandon('failed')}
                                disabled={abandoning}
                                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-red-600/80 hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                💀 Mark as Failed <span className="text-red-300 font-normal">(-15 XP)</span>
                            </button>
                            <button
                                onClick={() => handleAbandon('skipped')}
                                disabled={abandoning}
                                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-50"
                            >
                                ⏭ Skip Task <span className="text-white/40 font-normal">(-10 XP)</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setAbandonDialog(false)}
                            disabled={abandoning}
                            className="w-full text-sm text-white/40 hover:text-white/60 transition-colors pt-1"
                        >
                            Cancel
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
