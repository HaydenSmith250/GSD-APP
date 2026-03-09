import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const id = resolvedParams.id;

        const { error } = await supabaseAdmin
            .from('chat_sessions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
    }
}
