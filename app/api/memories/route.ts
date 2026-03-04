import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET — fetch all stored memories
export async function GET() {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('memories')
            .select('*')
            .order('importance', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Memories GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to load memories' }, { status: 500 });
    }
}

// DELETE — remove a specific memory
export async function DELETE(request: Request) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await request.json();

        const { error } = await supabaseAdmin
            .from('memories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Memory DELETE error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete memory' }, { status: 500 });
    }
}
