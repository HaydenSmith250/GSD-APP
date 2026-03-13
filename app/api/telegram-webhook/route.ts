import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendTelegramMessage, sendTypingAction, getTelegramFileUrl } from '@/lib/telegram';
import { callAI, MODELS } from '@/lib/openrouter';
import { buildFullContext, saveMessage } from '@/lib/memory';
import { processVerification } from '@/lib/verify-logic';

export async function POST(req: Request) {
    // Verify Telegram webhook secret token to prevent spoofed requests
    const incomingSecret = req.headers.get('x-telegram-bot-api-secret-token');
    if (process.env.TELEGRAM_WEBHOOK_SECRET && incomingSecret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const update = await req.json();
        const chatId = update.message?.chat?.id;
        const text = update.message?.text;
        const photo = update.message?.photo; // array of photo sizes

        if (!chatId) return new Response('OK');

        // 1. Identify User & Store chat_id if new
        const { data: userConfig } = await supabaseAdmin.from('user_config').select('*').limit(1).single();
        if (userConfig && userConfig.telegram_chat_id !== chatId) {
            await supabaseAdmin.from('user_config').update({ telegram_chat_id: chatId }).eq('id', userConfig.id);
        }

        let responseMessage = '';

        // 2. Handle Photo Uploads (Verification)
        if (photo && photo.length > 0) {
            // Get the largest photo version
            const fileId = photo[photo.length - 1].file_id;
            const fileUrl = await getTelegramFileUrl(fileId);

            if (fileUrl) {
                // Download image to buffer
                const imageRes = await fetch(fileUrl);
                const arrayBuffer = await imageRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Find the most relevant active task to verify
                const { data: activeTasks } = await supabaseAdmin
                    .from('tasks')
                    .select('*')
                    .in('status', ['pending', 'in_progress'])
                    .order('next_checkin_at', { ascending: true })
                    .limit(1);

                if (activeTasks && activeTasks.length > 0) {
                    const task = activeTasks[0];
                    // Determine the type of checkin based on task status
                    let checkinType: 'start' | 'periodic' | 'end' | 'goal_finish' = 'periodic';
                    if (task.status === 'pending') checkinType = 'start';
                    else if (task.task_type === 'goal') checkinType = 'goal_finish'; // Assuming they are finishing a goal

                    await sendTelegramMessage(chatId, `Analyzing photo for task: "${task.title}"...`);

                    const result = await processVerification(task.id, buffer, checkinType);

                    responseMessage = result.coach_message;
                    if (result.verified && result.xp_updates) {
                        responseMessage += `\n\n+${result.xp_updates.newXp} XP. Total Level: ${result.xp_updates.currentLevel}`;
                    }
                } else {
                    responseMessage = "You sent a photo, but you don't have any active tasks running to verify right now. Focus up and start one.";
                }
            }
        }
        // 3. Handle Text Chat
        else if (text) {
            // Basic Commands
            if (text === '/status' || text === '/stats') {
                const { data: stats } = await supabaseAdmin.from('stats').select('*').limit(1).single();
                if (stats) {
                    responseMessage = `Level ${stats.level} | ${stats.total_xp} XP\n🔥 Streak: ${stats.current_streak} days\n✅ Done: ${stats.tasks_completed}`;
                }
            } else if (text === '/tasks') {
                const { data: activeTasks } = await supabaseAdmin.from('tasks').select('title, status').in('status', ['pending', 'in_progress']);
                if (activeTasks && activeTasks.length > 0) {
                    responseMessage = "Active Tasks:\n" + activeTasks.map(t => `- ${t.title} (${t.status})`).join('\n');
                } else {
                    responseMessage = "No active tasks right now.";
                }
            } else {
                // Standard AI Chat conversation
                await saveMessage({ role: 'user', content: text, source: 'telegram' });

                // Show real typing indicator
                await sendTypingAction(chatId);

                const context = await buildFullContext();
                const messagesForAI = [
                    ...context.messages,
                    { role: 'user' as const, content: text },
                ];
                const aiResponse = await callAI({
                    model: MODELS.COACH_CHAT,
                    systemPrompt: context.systemPrompt,
                    messages: messagesForAI,
                });

                await saveMessage({ role: 'assistant', content: aiResponse, source: 'telegram' });
                responseMessage = aiResponse;
            }
        }

        if (responseMessage) {
            await sendTelegramMessage(chatId, responseMessage);
        }

        return new Response('OK');
    } catch (err) {
        console.error('Telegram Webhook error:', err);
        return new Response('OK'); // Always return OK to Telegram to prevent retries
    }
}
