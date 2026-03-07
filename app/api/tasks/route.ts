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
                query = query.in('status', ['pending', 'in_progress', 'awaiting_verification']);
            } else {
                query = query.eq('status', status);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
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
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
    }
}
