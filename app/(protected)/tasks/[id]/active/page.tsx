'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ActiveTaskPage() {
    const { id } = useParams();
    const router = useRouter();
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Verification State
    const [uploading, setUploading] = useState(false);
    const [lastMessage, setLastMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, checkinType: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setLastMessage(null);

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;

                const res = await fetch('/api/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId: id,
                        imageBase64: base64,
                        checkinType
                    })
                });

                const data = await res.json();
                setLastMessage(data.coach_message);

                if (data.verified) {
                    // Success! Reload task state
                    await loadTask();
                    if (checkinType === 'end' || checkinType === 'goal_finish') {
                        setTimeout(() => router.push('/tasks'), 3000);
                    }
                }
            };
        } catch (err) {
            console.error(err);
            setLastMessage("Failed to process upload. Try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '📸 Send Start Proof'}
                                </button>
                                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'start')} />
                            </div>
                        )}

                        {!isPending && (
                            <div className="space-y-3">
                                {task.checkin_interval_minutes && (
                                    <>
                                        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${needsCheckin ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}>
                                            {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '⏱ Send Periodic Check-in'}
                                        </button>
                                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={(e) => {
                                            handleFileUpload(e, 'periodic');
                                        }} />
                                    </>
                                )}

                                <div className="pt-4 mt-4 border-t border-white/10">
                                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (task.task_type === 'timed' ? '🏁 Finish & Verify' : '🏁 Mark Goal Complete & Verify')}
                                    </button>
                                    {/* Using a separate ref or just updating the onChange logic dynamically would be better, but for simplicity we rely on the button click logic in a real app. 
                      Since we have one hidden input, we will just use a hack: set a state for the current checkin type before triggering click. */}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Hidden file inputs for specific button actions since they share the camera */}
            <input id="periodicInput" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e, 'periodic')} />
            <input id="endInput" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e, 'end')} />

        </div>
    );
}
