import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendTelegramMessage } from '@/lib/telegram';

// Called every 5 minutes by Vercel Cron.
// Finds in-progress tasks whose next_checkin_at has passed and sends a Telegram reminder.
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get the linked Telegram chat ID
        const { data: config } = await supabaseAdmin
            .from('user_config')
            .select('telegram_chat_id')
            .limit(1)
            .single();

        if (!config?.telegram_chat_id) {
            return NextResponse.json({ skipped: 'No Telegram chat linked' });
        }

        // Find tasks that are overdue for a check-in and haven't been notified yet
        const now = new Date().toISOString();
        const { data: overdueTasks, error } = await supabaseAdmin
            .from('tasks')
            .select('id, title, next_checkin_at, checkin_interval_minutes')
            .eq('status', 'in_progress')
            .not('next_checkin_at', 'is', null)
            .lte('next_checkin_at', now);

        if (error) throw error;
        if (!overdueTasks || overdueTasks.length === 0) {
            return NextResponse.json({ notified: 0 });
        }

        for (const task of overdueTasks) {
            const overdueMins = Math.round(
                (Date.now() - new Date(task.next_checkin_at).getTime()) / 60000
            );
            const message = overdueMins < 2
                ? `⏰ Check-in time for: *${task.title}*\n\nSend a photo to prove you're still on it.`
                : `🚨 CHECK-IN OVERDUE by ${overdueMins} min: *${task.title}*\n\nSend a photo NOW or take the XP hit.`;

            await sendTelegramMessage(config.telegram_chat_id, message);
        }

        return NextResponse.json({ notified: overdueTasks.length });
    } catch (error) {
        console.error('checkin-reminder cron error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
