import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET — fetch user config (permanent memory, coach prompt)
export async function GET() {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('user_config')
            .select('permanent_memory, coach_system_prompt, display_name, timezone')
            .limit(1)
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
    }
}

// PUT — update user config
export async function PUT(request: Request) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const updates = await request.json();

        // Only allow updating specific fields
        const allowedFields = ['permanent_memory', 'coach_system_prompt', 'display_name', 'timezone'];
        const sanitized: Record<string, string> = {};
        for (const key of allowedFields) {
            if (key in updates) {
                sanitized[key] = updates[key];
            }
        }

        if (Object.keys(sanitized).length === 0) {
            return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
        }

        const { data: allConfigs } = await supabaseAdmin
            .from('user_config')
            .select('id')
            .limit(1);

        if (!allConfigs || allConfigs.length === 0) {
            return NextResponse.json({ success: false, error: 'No user config found' }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from('user_config')
            .update({ ...sanitized, updated_at: new Date().toISOString() })
            .eq('id', allConfigs[0].id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings PUT error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
    }
}
