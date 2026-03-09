import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Called every night at 11:59 PM (or 12:00 AM) by Vercel Cron.
// Finds any pending/in_progress tasks from the previous day and marks them as 'failed' (unfinished).
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Find all active tasks
        const { data: activeTasks, error: fetchError } = await supabaseAdmin
            .from('tasks')
            .select('id, xp_reward')
            .in('status', ['pending', 'in_progress']);

        if (fetchError) throw fetchError;

        if (!activeTasks || activeTasks.length === 0) {
            return NextResponse.json({ processed: 0, message: 'No unfinished tasks to sweep.' });
        }

        // 2. Mark them as 'failed'
        const taskIds = activeTasks.map(t => t.id);
        const { error: updateError } = await supabaseAdmin
            .from('tasks')
            .update({ status: 'failed', completed_at: new Date().toISOString() })
            .in('id', taskIds);

        if (updateError) throw updateError;

        // 3. Increment the tasks_unfinished counter in stats by the number of failed tasks
        const { data: currentStats } = await supabaseAdmin
            .from('stats')
            .select('tasks_unfinished')
            .limit(1)
            .maybeSingle();

        const unfinCount = (currentStats?.tasks_unfinished || 0) + activeTasks.length;

        // Reset streak to 0 as a penalty
        await supabaseAdmin
            .from('stats')
            .update({
                tasks_unfinished: unfinCount,
                current_streak: 0
            })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy where clause just to update

        return NextResponse.json({ processed: activeTasks.length, message: `Swept ${activeTasks.length} unfinished tasks.` });

    } catch (error) {
        console.error('daily-reset cron error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
