import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from('chat_sessions')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to load sessions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { title } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('chat_sessions')
            .insert({ title: title || 'New Chat' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });
    }
}
