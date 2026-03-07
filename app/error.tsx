'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-sm w-full text-center space-y-4 border border-[var(--accent-red)]/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--accent-red)]/5"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center mb-4 text-3xl">
                        ⚠️
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">Something broke</h1>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                        An unexpected error occurred. Don't use it as an excuse to stop working.
                    </p>

                    <button
                        onClick={() => reset()}
                        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-red), #991b1b)'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}
