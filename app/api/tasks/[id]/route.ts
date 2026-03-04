import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { awardXp, XP_PENALTIES } from '@/lib/gamification';

// PATCH update a task's status or details
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        const body = await request.json();

        const allowedUpdates = ['title', 'description', 'status', 'priority', 'started_at', 'next_checkin_at', 'completed_at', 'verified_at'];
        const updateData: Record<string, any> = {};

        for (const key of allowedUpdates) {
            if (key in body) updateData[key] = body[key];
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
        }

        // Special logic for failures or skips
        if (updateData.status === 'failed' || updateData.status === 'skipped') {
            const penalty = updateData.status === 'failed' ? XP_PENALTIES.task_failed : XP_PENALTIES.task_skipped;
            await awardXp(penalty, `task_${updateData.status}`);
            updateData.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
    }
}

// DELETE a task
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;

        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
    }
}
