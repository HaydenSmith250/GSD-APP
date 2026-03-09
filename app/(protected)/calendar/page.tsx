'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckSquare, Plus, CheckCircle2, Goal, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import TaskCreateSheet from '@/components/TaskCreateSheet';
import { useRouter } from 'next/navigation';

type ViewMode = 'day' | 'month';

export default function CalendarPage() {
    const router = useRouter();
    const [view, setView] = useState<ViewMode>('day');
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        loadTasks();

        const channel = supabase
            .channel('calendar-tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                loadTasks();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadTasks = () => {
        fetch('/api/tasks')
            .then(res => res.json())
            .then(data => {
                if (data.success) setTasks(data.data);
            })
            .finally(() => setLoading(false));
    };

    const [direction, setDirection] = useState(0);

    const handleViewChange = (v: ViewMode) => {
        triggerHaptic();
        playSound('tab_switch');
        setView(v);
    };

    const handlePrev = () => {
        triggerHaptic();
        playSound('swipe_action');
        setDirection(-1);
        const newDate = new Date(selectedDate);
        if (view === 'month') newDate.setMonth(selectedDate.getMonth() - 1);
        else newDate.setDate(selectedDate.getDate() - 7);
        setSelectedDate(newDate);
    };

    const handleNext = () => {
        triggerHaptic();
        playSound('swipe_action');
        setDirection(1);
        const newDate = new Date(selectedDate);
        if (view === 'month') newDate.setMonth(selectedDate.getMonth() + 1);
        else newDate.setDate(selectedDate.getDate() + 7);
        setSelectedDate(newDate);
    };

    const selectedDateString = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    // Calculate week dates
    const currentDate = new Date(selectedDate);
    const currentDayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek); // Start on Sunday

    const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    // Calculate month dates
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
    const monthDates = Array.from({ length: daysInMonth }).map((_, i) => {
        return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1);
    });

    const dayTasks = tasks.filter(t => {
        const dStr = selectedDateString;
        if (t.due_date && t.due_date.startsWith(dStr)) return true;
        if (t.recurring_pattern === 'daily' && t.due_date <= dStr) return true;
        if (t.recurring_pattern === 'weekly' && t.due_date <= dStr) {
            const tDate = new Date(t.due_date);
            const currDate = new Date(dStr);
            const tDateObj = new Date(tDate.getTime() + tDate.getTimezoneOffset() * 60000);
            const cDateObj = new Date(currDate.getTime() + currDate.getTimezoneOffset() * 60000);
            if (tDateObj.getDay() === cDateObj.getDay()) return true;
        }
        if (!t.due_date && t.created_at.split('T')[0] === dStr) return true;
        return false;
    });

    // Sort tasks by time if possible, otherwise put them at start of day.
    const sortedTasks = [...dayTasks].sort((a, b) => {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : 0;
        return aTime - bTime;
    });

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 50 : -50, opacity: 0 })
    };

    return (
        <div className="space-y-6 pt-12 px-6 pb-32">
            {/* View Toggles */}
            <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5 shadow-inner">
                {(['day', 'month'] as ViewMode[]).map((v) => (
                    <button
                        key={v}
                        onClick={() => handleViewChange(v)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${view === v ? 'bg-white/15 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        style={{
                            backgroundColor: view === v ? 'rgba(57, 255, 20, 0.1)' : 'transparent',
                            color: view === v ? 'var(--color-neon-blue)' : undefined
                        }}
                    >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>

            {/* Calendar Strip Header */}
            <div className="flex items-center justify-between px-2 pt-2">
                <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-heading font-black text-white">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="overflow-hidden">
                <AnimatePresence mode="popLayout" custom={direction}>
                    {view === 'day' ? (
                        <motion.div
                            key={`day-view-${startOfWeek.getTime()}`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) * velocity.x;
                                if (swipe < -100) handleNext();
                                else if (swipe > 100) handlePrev();
                            }}
                            className="grid grid-cols-7 gap-2 px-1"
                        >
                            {weekDates.map((d, i) => {
                                const isSelected = d.toDateString() === selectedDate.toDateString();
                                const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                                return (
                                    <div
                                        key={i}
                                        onClick={() => { triggerHaptic(); playSound('button_press'); setSelectedDate(d); }}
                                        className={`flex flex-col items-center py-3 rounded-xl cursor-pointer transition-all ${isSelected
                                            ? 'shadow-[0_4px_15px_rgba(0,229,255,0.4)]'
                                            : 'hover:bg-white/5 text-gray-500'
                                            }`}
                                        style={{
                                            background: isSelected ? 'var(--color-neon-green)' : 'transparent',
                                            color: isSelected ? 'black' : undefined
                                        }}
                                    >
                                        <span className={`text-xs font-bold mb-1 ${isSelected ? 'text-black/70' : ''}`}>
                                            {dayLabels[i]}
                                        </span>
                                        <span className={`text-lg font-black ${isSelected ? 'text-black' : 'text-gray-300'}`}>
                                            {d.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`month-view-${selectedDate.getFullYear()}-${selectedDate.getMonth()}`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) * velocity.x;
                                if (swipe < -100) handleNext();
                                else if (swipe > 100) handlePrev();
                            }}
                            className="glass-card rounded-3xl p-4 border border-white/5"
                        >
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                    <div key={i} className="text-center text-[10px] font-bold text-gray-500 tracking-widest">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                    <div key={`empty-${i}`} className="p-2" />
                                ))}
                                {monthDates.map((d, i) => {
                                    const isSelected = d.toDateString() === selectedDate.toDateString();
                                    const isToday = d.toDateString() === new Date().toDateString();
                                    const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];

                                    // Checking if there are any tasks for this day
                                    const hasTasks = tasks.some(t => {
                                        if (t.due_date && t.due_date.startsWith(dateStr)) return true;
                                        if (t.recurring_pattern === 'daily' && t.due_date <= dateStr) return true;
                                        if (t.recurring_pattern === 'weekly' && t.due_date <= dateStr) {
                                            return new Date(t.due_date).getDay() === d.getDay();
                                        }
                                        if (!t.due_date && t.created_at.split('T')[0] === dateStr) return true;
                                        return false;
                                    });

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => { triggerHaptic(); playSound('button_press'); setSelectedDate(d); setView('day'); }}
                                            className={`relative aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all text-sm font-bold ${isSelected ? 'bg-neon-green text-black shadow-[0_0_15px_rgba(57,255,20,0.5)]' :
                                                isToday ? 'bg-white/10 text-white border border-white/20' :
                                                    'hover:bg-white/5 text-gray-400'
                                                }`}
                                        >
                                            {d.getDate()}
                                            {hasTasks && !isSelected && (
                                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Today's Focus List */}
            <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-heading font-black text-white">Today's Focus</h3>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="text-white hover:bg-white/10 p-2 rounded-full transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                        <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                    </div>
                ) : sortedTasks.length > 0 ? (
                    <div className="space-y-4 relative">
                        {/* Vertical line through timeline */}
                        <div className="absolute left-[39px] top-6 bottom-6 w-px bg-white/10" />

                        <AnimatePresence>
                            {sortedTasks.map((task, i) => {
                                const tDate = task.due_date ? new Date(task.due_date) : null;
                                const isCompleted = task.status === 'completed' || task.status === 'verified';

                                return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex gap-4 relative z-10"
                                    >
                                        <div className="w-16 flex-shrink-0 pt-3 text-right">
                                            <span className="text-xs font-bold text-gray-400">
                                                {tDate ? tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Any'}
                                            </span>
                                        </div>

                                        <div
                                            onClick={() => router.push(`/tasks/${task.id}/active`)}
                                            className={`flex-1 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${isCompleted
                                                ? 'bg-black/60 border-white/5 opacity-50'
                                                : 'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className={`text-lg font-bold ${isCompleted ? 'text-gray-500 line-through' : 'text-neon-green'}`}>
                                                    {task.title}
                                                </h4>
                                                {task.verification_required && !isCompleted && (
                                                    <Lock size={14} className="text-gray-500" />
                                                )}
                                                {isCompleted && (
                                                    <CheckCircle2 size={16} className="text-neon-green" />
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-400 mb-3 line-clamp-1">{task.description || 'No description provided.'}</p>

                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 text-neon-blue border border-neon-blue/20">
                                                    {task.task_type}
                                                </span>
                                                {tDate && (
                                                    <span className="text-xs text-gray-500">
                                                        {tDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                        {task.duration_minutes ? ` - ${new Date(tDate.getTime() + task.duration_minutes * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="p-8 text-center glass-card rounded-2xl border border-white/5 border-dashed">
                        <Goal size={32} className="mx-auto mb-3 text-white/20" />
                        <p className="text-gray-500 font-bold">Nothing scheduled yet.</p>
                        <p className="text-xs text-gray-600 mt-1">Add tasks to build out your timeline.</p>
                    </div>
                )}
            </div>

            <TaskCreateSheet
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={loadTasks}
                initialDate={selectedDate}
            />
        </div>
    );
}
