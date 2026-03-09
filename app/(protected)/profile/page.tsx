'use client';

import { motion } from 'framer-motion';
import { Settings, Bell, Shield, LogOut, ArrowRight, Zap, Smartphone, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { supabase } from '@/lib/supabase';
import BadgeViewer from '@/components/BadgeViewer';
import { LEVEL_NAMES } from '@/lib/level-utils';

export default function ProfilePage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [haptics, setHaptics] = useState(true);
    const [sounds, setSounds] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [userName, setUserName] = useState<string>('Hayden');

    useEffect(() => {
        setHaptics(localStorage.getItem('gsd_haptics_enabled') !== 'false');
        setSounds(localStorage.getItem('gsd_sounds_enabled') !== 'false');
        setNotifications(localStorage.getItem('gsd_notifications_enabled') !== 'false');
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.user_metadata?.first_name) {
                setUserName(user.user_metadata.first_name);
            }
        });

        fetch('/api/stats').then(res => res.json()).then(data => {
            if (data.success) setStats(data.data);
        });
    }, []);

    const handleLogout = async () => {
        triggerHaptic();
        playSound('button_press');
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const toggleHaptics = () => {
        const newValue = !haptics;
        setHaptics(newValue);
        localStorage.setItem('gsd_haptics_enabled', String(newValue));
        if (newValue) triggerHaptic();
        playSound('button_press');
    };

    const toggleSounds = () => {
        const newValue = !sounds;
        setSounds(newValue);
        localStorage.setItem('gsd_sounds_enabled', String(newValue));
        // Need to update actual sound lib
        import('@/lib/sounds').then((mod) => mod.setSoundsEnabled(newValue));
        triggerHaptic();
        if (newValue) playSound('button_press');
    };

    const toggleNotifications = () => {
        const newValue = !notifications;
        setNotifications(newValue);
        localStorage.setItem('gsd_notifications_enabled', String(newValue));
        triggerHaptic();
        playSound('button_press');
        if (newValue && 'Notification' in window) {
            Notification.requestPermission();
        }
    };

    return (
        <div className="space-y-6 pt-12 px-6 pb-32">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-heading font-black text-white">Profile</h1>
                    <p className="text-gray-400 font-semibold text-sm tracking-wide uppercase mt-1">Command Center</p>
                </div>
                <button
                    onClick={() => router.push('/settings')}
                    className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                    <Settings size={20} className="text-white" />
                </button>
            </motion.div>

            {/* User ID Card */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <div className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-neon-blue/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-neon-blue/20 transition-colors duration-500" />

                    <div className="flex items-center gap-6 relative z-10 w-full">
                        <div className="flex-shrink-0">
                            <BadgeViewer level={stats?.level || 1} size="lg" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-white truncate">{userName}</h2>
                            <p className="text-neon-blue font-bold text-xs tracking-widest uppercase flex flex-col gap-0.5 mt-1">
                                <span>Level {stats?.level || 1}</span>
                                <span className="text-gray-400">{LEVEL_NAMES[(stats?.level || 1) - 1]}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Preferences */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest ml-1 mb-2">Preferences</h3>

                <div className="glass-card rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
                    {/* Notifications Toggle */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg text-neon-amber"><Bell size={18} /></div>
                            <span className="font-bold text-white text-sm">Push Notifications</span>
                        </div>
                        <button
                            onClick={toggleNotifications}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${notifications ? 'bg-neon-amber' : 'bg-white/10'}`}
                        >
                            <motion.div
                                className="w-4 h-4 rounded-full bg-white shadow-md"
                                animate={{ x: notifications ? 24 : 0 }}
                            />
                        </button>
                    </div>

                    {/* Haptic Feedback Toggle */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg text-neon-blue"><Smartphone size={18} /></div>
                            <span className="font-bold text-white text-sm">Haptic Feedback</span>
                        </div>
                        <button
                            onClick={toggleHaptics}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${haptics ? 'bg-neon-blue' : 'bg-white/10'}`}
                        >
                            <motion.div
                                className="w-4 h-4 rounded-full bg-white shadow-md"
                                animate={{ x: haptics ? 24 : 0 }}
                            />
                        </button>
                    </div>

                    {/* Sound UI Toggle */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg text-neon-green"><Zap size={18} /></div>
                            <span className="font-bold text-white text-sm">UI Sounds</span>
                        </div>
                        <button
                            onClick={toggleSounds}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${sounds ? 'bg-neon-green' : 'bg-white/10'}`}
                        >
                            <motion.div
                                className="w-4 h-4 rounded-full bg-white shadow-md"
                                animate={{ x: sounds ? 24 : 0 }}
                            />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Features & Plan */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest ml-1 mb-2">Account</h3>

                <div className="glass-card rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
                    <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg text-white"><Shield size={18} /></div>
                            <span className="font-bold text-white text-sm">Privacy & Security</span>
                        </div>
                        <ArrowRight size={16} className="text-gray-500" />
                    </button>

                    <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-neon-blue to-purple-500 rounded-lg text-white shadow-[0_0_10px_rgba(0,229,255,0.3)]"><CreditCard size={18} /></div>
                            <div className="text-left">
                                <span className="font-bold text-white text-sm block">GSD Pro Plan</span>
                                <span className="text-[10px] text-neon-blue font-bold uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </motion.div>

            {/* Logout */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4">
                <button
                    onClick={handleLogout}
                    className="w-full p-4 rounded-2xl border border-neon-red/30 bg-neon-red/5 hover:bg-neon-red/10 text-neon-red font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,51,51,0.05)]"
                >
                    <LogOut size={18} /> Disconnect
                </button>
            </motion.div>
        </div>
    );
}
