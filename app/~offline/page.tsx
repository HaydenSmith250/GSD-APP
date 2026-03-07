'use client';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-sm w-full text-center space-y-4 border border-[var(--accent-red)]/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--accent-red)]/5"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center mb-4 text-3xl">
                        📡
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">No Connection</h1>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                        You appear to be offline. Your AI coach needs a connection to verify your work.
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-red), #991b1b)'
                        }}
                    >
                        Try Again
                    </button>

                    <p className="text-xs text-[var(--text-muted)] mt-4">
                        Results require consistency, even when the internet is stubborn.
                    </p>
                </div>
            </div>
        </div>
    );
}
