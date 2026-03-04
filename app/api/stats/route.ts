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
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data: stats });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
