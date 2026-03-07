import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import XPBar from '@/components/XPBar';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isAuthenticated = await validateSession();
    if (!isAuthenticated) {
        redirect('/');
    }

    return (
        <div className="min-h-screen">
            <Sidebar />

            {/* Main content — offset by sidebar on desktop */}
            <main
                className="min-h-screen md:pb-0 flex flex-col"
                style={{ marginLeft: 'var(--sidebar-width)', paddingBottom: 'var(--bottom-nav-height)' }}
            >
                {/* Top Navigation Bar with XP */}
                <header className="sticky top-0 z-30 w-full px-4 py-3 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-end">
                    <XPBar />
                </header>

                <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
                    {children}
                </div>
            </main>

            {/* Fix mobile: override margin-left on small screens */}
            <style>{`
        @media (max-width: 767px) {
          main { margin-left: 0 !important; }
        }
      `}</style>
        </div>
    );
}
