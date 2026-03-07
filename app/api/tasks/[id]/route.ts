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

        const allowedUpdates = ['title', 'description', 'status', 'priority', 'verification_prompt', 'duration_minutes', 'checkin_interval_minutes', 'category', 'due_date', 'recurring_pattern', 'started_at', 'next_checkin_at', 'completed_at', 'verified_at'];
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

        // Auto-create next recurrence when a recurring task closes
        const closingStatuses = ['verified', 'failed', 'skipped'];
        if (closingStatuses.includes(updateData.status) && data.recurring_pattern) {
            const nextDue = getNextRecurringDate(data.recurring_pattern, data.due_date);
            if (nextDue) {
                await supabaseAdmin.from('tasks').insert({
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    task_type: data.task_type,
                    duration_minutes: data.duration_minutes,
                    checkin_interval_minutes: data.checkin_interval_minutes,
                    verification_prompt: data.verification_prompt,
                    category: data.category,
                    due_date: nextDue,
                    recurring_pattern: data.recurring_pattern,
                    xp_reward: data.xp_reward,
                    status: 'pending',
                    checkins: [],
                });
            }
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
    }
}

function getNextRecurringDate(pattern: string, currentDueDate?: string | null): string | null {
    const base = currentDueDate ? new Date(currentDueDate) : new Date();
    const next = new Date(base);

    if (pattern === 'daily') {
        next.setDate(next.getDate() + 1);
    } else if (pattern === 'weekdays') {
        next.setDate(next.getDate() + 1);
        while (next.getDay() === 0 || next.getDay() === 6) {
            next.setDate(next.getDate() + 1);
        }
    } else if (pattern === 'weekly') {
        next.setDate(next.getDate() + 7);
    } else {
        return null;
    }

    return next.toISOString();
}

// DELETE a task
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
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
