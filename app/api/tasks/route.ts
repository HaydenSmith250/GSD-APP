import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET all tasks (filtered by status optionally)
export async function GET(request: Request) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) {
            if (status === 'active') {
                query = query.in('status', ['pending', 'in_progress']);
            } else if (status === 'completed') {
                query = query.eq('status', 'verified');
            } else {
                query = query.eq('status', status);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        let returnedData = data || [];

        // If requesting active, gracefully fail any tasks that are past due_date immediately, rather than waiting for cron.
        if (status === 'active') {
            const nowTime = new Date().getTime();
            const overdueIds: string[] = [];
            
            returnedData = returnedData.filter((t: any) => {
                if (t.due_date) {
                    const dueTime = new Date(t.due_date).getTime();
                    if (dueTime < nowTime) {
                        overdueIds.push(t.id);
                        return false; // remove from active array
                    }
                }
                return true;
            });

            // Fire and forget update to fail overdue tasks that are still pending/in_progress
            if (overdueIds.length > 0) {
                (async () => {
                    try {
                        await supabaseAdmin
                            .from('tasks')
                            .update({ status: 'failed', completed_at: new Date().toISOString() })
                            .in('id', overdueIds);

                        console.log(`Auto-failed ${overdueIds.length} overdue tasks during GET`);
                        
                        const s = await supabaseAdmin.from('stats').select('tasks_unfinished').limit(1).maybeSingle();
                        const unfinCount = (s.data?.tasks_unfinished || 0) + overdueIds.length;
                        await supabaseAdmin.from('stats').update({ tasks_unfinished: unfinCount, current_streak: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
                    } catch (e) {
                        console.error("Auto-fail update error:", e);
                    }
                })();
            }
        }

        return NextResponse.json({ success: true, data: returnedData });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

// POST create a new task
export async function POST(request: Request) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { title, description, priority, task_type, duration_minutes, checkin_interval_minutes, verification_prompt, category, due_date, recurring_pattern } = body;

        if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

        const xp_reward = body.xp_reward || (task_type === 'timed' ? duration_minutes : 25); // Timed pays 1 XP per minute as base

        const newTask = {
            title,
            description: description || '',
            priority: priority || 'medium',
            task_type: task_type || 'goal',
            duration_minutes: duration_minutes || null,
            checkin_interval_minutes: checkin_interval_minutes || null,
            verification_prompt: verification_prompt || 'A photo showing clear progress or completion of the task.',
            category: category || 'general',
            due_date: due_date || null,
            recurring_pattern: recurring_pattern || null,
            status: 'pending',
            xp_reward,
            checkins: [],
        };

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .insert(newTask)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error)?.message || 'Failed to create task' }, { status: 500 });
    }
}
