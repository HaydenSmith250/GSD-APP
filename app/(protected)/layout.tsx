import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth';

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
        <main className="min-h-screen w-full flex flex-col relative mx-auto max-w-md pb-[env(safe-area-inset-bottom)]">
            <div className="bg-galaxy" />
            {children}
        </main>
    );
}
