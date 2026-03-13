'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Goal, Info, RefreshCw, XCircle, Trophy, ArrowLeft } from 'lucide-react';

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

    // Custom Camera State
    const [showCamera, setShowCamera] = useState<string | null>(null); // contains checkinType if open
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            const res = await fetch(`/api/tasks`); // remove ?status=active to allow viewing completed tasks
            const data = await res.json();
            if (data.success) {
                const t = data.data.find((x: any) => x.id === id);
                if (t) setTask(t);
                else router.push('/tasks');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // HTML5 Custom Camera Logic
    const openCamera = async (type: string) => {
        setCameraError('');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            setShowCamera(type);
        } catch (err) {
            console.error('Camera access denied:', err);
            setCameraError('Camera access required. Please check permissions.');
        }
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(null);
    };

    useEffect(() => {
        if (showCamera && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [showCamera, stream]);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !showCamera) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
                    const preview = URL.createObjectURL(blob);
                    setPendingUpload({ file, preview, checkinType: showCamera });
                    closeCamera();
                }
            }, 'image/jpeg', 0.85);
        }
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
        <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-32px)] space-y-6 pb-24 safe-scrollbar overflow-y-auto">

            {/* Header Info */}
            <div className="glass-card p-6 flex-shrink-0 text-center relative overflow-hidden rounded-[2rem] border border-white/5 mx-4 mt-6 group">
                <div className="absolute inset-0 opacity-10 transition-colors duration-1000" style={{ background: isPending ? 'var(--neon-blue)' : needsCheckin ? 'var(--neon-red)' : 'var(--neon-green)' }}></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-white/10 transition-colors" />

                <h1 className="text-2xl font-black font-heading text-white relative z-10 break-words">{task.title}</h1>
                <p className="text-xs font-bold text-gray-400 mt-2 relative z-10 uppercase tracking-widest">{task.task_type} • {task.priority}</p>

                <div className="mt-6 pb-2">
                    <div className={`${(timeLeft.includes(':') && timeLeft.length < 10) ? 'text-6xl font-mono' : 'text-xl'} font-black tracking-tighter ${needsCheckin ? 'text-neon-red animate-pulse drop-shadow-[0_0_15px_rgba(255,51,102,0.5)]' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'}`}>
                        {timeLeft}
                    </div>
                    {task.status === 'in_progress' && !needsCheckin && task.next_checkin_at && (
                        <p className="text-[10px] text-gray-500 mt-3 uppercase tracking-widest font-bold">Until Next Verification</p>
                    )}
                </div>
            </div>

            {/* Main Execution Area */}
            <div className="flex-1 px-4 flex flex-col items-center justify-start space-y-6">

                {lastMessage && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-neon-amber" />
                        <p className="text-xs font-bold uppercase tracking-widest text-neon-amber mb-2">Coach Says:</p>
                        <p className="text-gray-200 text-sm leading-relaxed italic">"{lastMessage}"</p>
                    </motion.div>
                )}

                {isFinished ? (
                    <div className="text-center w-full">
                        <div className="w-20 h-20 mx-auto bg-neon-gold/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                            <Trophy size={40} className="text-neon-gold" />
                        </div>
                        <h2 className="text-3xl font-black font-heading text-white mb-8 drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">Task Crushed.</h2>

                        <div className="glass-card bg-black/40 border border-white/5 rounded-3xl p-6 text-left space-y-5">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Type</span>
                                <span className="text-white font-bold capitalize bg-white/10 px-3 py-1 rounded-full text-sm">{task.task_type}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Reward</span>
                                <span className="text-neon-gold font-black text-lg drop-shadow-[0_0_10px_rgba(255,215,0,0.2)]">+{task.xp_reward} XP</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Completed At</span>
                                <span className="text-gray-300 font-bold">{new Date(task.completed_at || task.verified_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        <button onClick={() => router.back()} className="mt-10 w-full py-4 rounded-xl font-black text-black text-lg transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,229,255,0.3)]" style={{ background: 'var(--neon-blue)' }}>
                            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" /> Return to Base
                        </button>
                    </div>
                ) : (
                    <div className="w-full space-y-6 max-w-sm">
                        <div className="glass-card p-5 rounded-2xl border border-white/5 bg-black/40">
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={16} className="text-neon-blue" />
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Verification Target</h3>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed pl-6">
                                {(() => {
                                    let vText = task.verification_prompt;
                                    try {
                                        if (vText && vText.startsWith('{')) {
                                            const parsed = JSON.parse(vText);
                                            vText = isPending ? parsed.start : parsed.end;
                                        }
                                    } catch (e) { }
                                    return vText;
                                })()}
                            </p>
                        </div>

                        {cameraError && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center">
                                {cameraError}
                            </div>
                        )}

                        {isPending && (
                            <div className="space-y-3">
                                <button onClick={() => openCamera('start')} disabled={uploading} className="w-full py-4 rounded-[1.5rem] font-black text-black bg-neon-blue hover:bg-[#00c2d9] shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02]">
                                    {uploading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Camera size={20} /> Initialize Scanner</>}
                                </button>
                            </div>
                        )}

                        {!isPending && (
                            <div className="space-y-4">
                                {task.checkin_interval_minutes && (
                                    <>
                                        <button onClick={() => openCamera('periodic')} disabled={uploading} className={`w-full py-4 rounded-[1.5rem] font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] border ${needsCheckin ? 'bg-neon-red/10 border-neon-red text-neon-red shadow-[0_0_20px_rgba(255,51,102,0.3)] animate-pulse' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                            {uploading ? <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <><RefreshCw size={20} /> Periodic Scan</>}
                                        </button>
                                    </>
                                )}

                                <div>
                                    <button onClick={() => openCamera(task.task_type === 'goal' ? 'goal_finish' : 'end')} disabled={uploading} className="w-full py-4 rounded-[1.5rem] font-black text-black bg-neon-green hover:bg-[#00cc66] shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02]">
                                        {uploading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Goal size={20} /> Final Verification Scan</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Abandon button — only when task is started and not finished */}
                {!isPending && !isFinished && (
                    <button
                        onClick={() => setAbandonDialog(true)}
                        className="text-xs font-bold text-gray-500 hover:text-neon-red transition-colors mt-8 uppercase tracking-widest flex items-center gap-1.5 mx-auto"
                    >
                        <XCircle size={14} /> Abandon task
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

            {/* Custom Camera HUD Modal */}
            <AnimatePresence>
                {showCamera && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
                    >
                        {/* Live Video Feed */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Scanner Overlay HUD */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-12 px-6">

                            {/* Top info */}
                            <div className="bg-black/40 backdrop-blur-md px-6 py-2 border border-neon-green/30 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,153,0.2)]">
                                <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse" />
                                <span className="font-bold text-neon-green uppercase tracking-widest text-xs">Awaiting Target Verification</span>
                            </div>

                            {/* Center Reticle / HUD Corners */}
                            <div className="relative w-64 h-64 sm:w-80 sm:h-80 opacity-80">
                                {/* Top Left */}
                                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-neon-green rounded-tl-xl" />
                                {/* Top Right */}
                                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-neon-green rounded-tr-xl" />
                                {/* Bottom Left */}
                                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-neon-green rounded-bl-xl" />
                                {/* Bottom Right */}
                                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-neon-green rounded-br-xl" />

                                {/* Center Crosshair */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-30">
                                    <div className="w-8 h-[1px] bg-neon-green absolute" />
                                    <div className="h-8 w-[1px] bg-neon-green absolute" />
                                </div>
                            </div>

                            {/* Scanning textual hints */}
                            <div className="text-center w-full space-y-2 mb-20 max-w-sm mx-auto">
                                <p className="text-white/80 font-mono text-xs uppercase bg-black/50 p-2 rounded-lg">
                                    Provide visual proof: {task.verification_prompt}
                                </p>
                            </div>
                        </div>

                        {/* Camera Controls */}
                        <div className="absolute bottom-[calc(80px+env(safe-area-inset-bottom))] inset-x-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center gap-12 pb-8">
                            <button
                                onClick={closeCamera}
                                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                            >
                                <XCircle size={28} />
                            </button>

                            <button
                                onClick={capturePhoto}
                                className="w-20 h-20 rounded-full border-4 border-neon-green flex items-center justify-center group active:scale-95 transition-transform shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                            >
                                <div className="w-16 h-16 rounded-full bg-neon-green shadow-[0_0_30px_rgba(0,255,153,0.5)] group-hover:bg-[#00e65c] transition-colors" />
                            </button>

                            <div className="w-14 h-14" /> {/* Spacer to balance flex layout */}
                        </div>
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
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pb-[calc(80px+env(safe-area-inset-bottom))]"
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 40, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="glass-card p-6 w-full max-w-sm space-y-5 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                            style={{ background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(10,10,10,0.95) 100%)' }}
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
