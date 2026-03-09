import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: stats, error } = await supabaseAdmin
            .from('stats')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        const fallbackStats = {
            level: 1,
            total_xp: 0,
            tasks_completed: 0,
            tasks_unfinished: 0,
            current_streak: 0
        };

        return NextResponse.json({ success: true, data: stats || fallbackStats });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
