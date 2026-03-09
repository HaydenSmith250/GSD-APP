'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    triggerHaptic();
    playSound('button_press');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        playSound('level_up');
        router.push('/dashboard');
      } else {
        playSound('verify_fail');
        setError(data.error || 'Wrong password');
        setPassword('');
      }
    } catch {
      playSound('verify_fail');
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gsd-bg relative overflow-hidden">
      {/* Background OPAL style ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-green/10 rounded-full blur-[120px]" />

        {/* Particle dust texture sim via grid gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', damping: 20 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Internal card edge highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="text-center space-y-3 mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] mb-2"
              style={{
                background: 'linear-gradient(135deg, var(--color-neon-blue), var(--color-neon-green))',
                boxShadow: '0 0 40px rgba(0, 229, 255, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.4)',
              }}
            >
              <span className="text-3xl font-black text-black tracking-tighter">GSD</span>
            </motion.div>
            <h1 className="text-3xl font-heading font-black text-white tracking-tight">Get Shit Done.</h1>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Access Command Center
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                required
                className="w-full px-5 py-4 rounded-2xl border text-white font-bold tracking-widest text-center text-lg bg-black/40 outline-none transition-all duration-300 focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-600"
                style={{
                  borderColor: error ? 'var(--color-neon-red)' : 'rgba(255,255,255,0.1)',
                  boxShadow: error ? '0 0 15px rgba(255, 51, 51, 0.2)' : 'inset 0 2px 10px rgba(0,0,0,0.5)',
                }}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs font-bold text-neon-red uppercase tracking-wider"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !password}
              className="w-full py-4 rounded-2xl font-black text-black text-lg transition-all duration-300 disabled:opacity-30 disabled:grayscale relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, var(--color-neon-green), #0D9488)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(57, 255, 20, 0.3)',
              }}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? 'Decrypting...' : 'ENTER'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
