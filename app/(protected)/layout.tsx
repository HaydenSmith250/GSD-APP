import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

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
                className="min-h-screen pb-20 md:pb-0"
                style={{ marginLeft: 'var(--sidebar-width)' }}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
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
