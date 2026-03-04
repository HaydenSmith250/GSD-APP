import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { callAI, MODELS } from '@/lib/openrouter';
import { buildFullContext, saveMessage, getMessageCount } from '@/lib/memory';
import { extractMemories } from '@/lib/memory-extraction';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        // Verify authentication
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { message } = await request.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
        }

        // 1. Save the user's message
        await saveMessage({
            role: 'user',
            content: message.trim(),
            source: 'web',
        });

        // 2. Build full context (all 3 memory layers + tasks + stats)
        const context = await buildFullContext();

        // 3. Add the new user message to the conversation
        const messagesForAI = [
            ...context.messages,
            { role: 'user' as const, content: message.trim() },
        ];

        // 4. Call the AI coach
        const aiResponse = await callAI({
            model: MODELS.COACH_CHAT,
            systemPrompt: context.systemPrompt,
            messages: messagesForAI,
            temperature: 0.8,
            max_tokens: 1000,
        });

        // 5. Save the AI response
        const savedResponse = await saveMessage({
            role: 'assistant',
            content: aiResponse,
            source: 'web',
        });

        // 6. Check if we should trigger memory extraction (every 5 messages)
        const msgCount = await getMessageCount();
        if (msgCount > 0 && msgCount % 5 === 0) {
            // Fetch last 10 messages for extraction (fire and forget)
            const { data: recentMsgs } = await supabaseAdmin
                .from('messages')
                .select('role, content')
                .order('created_at', { ascending: false })
                .limit(10);

            if (recentMsgs && recentMsgs.length >= 3) {
                // Don't await — run in background
                extractMemories(recentMsgs.reverse()).catch(err =>
                    console.error('Background memory extraction failed:', err)
                );
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                id: savedResponse.id,
                role: 'assistant',
                content: aiResponse,
                created_at: savedResponse.created_at,
            },
        });
    } catch (error) {
        console.error('Chat API error:', error);
        const message = error instanceof Error ? error.message : 'Something went wrong';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

// GET — fetch recent messages for chat history
export async function GET() {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('messages')
            .select('id, role, content, source, created_at')
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Chat GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to load messages' }, { status: 500 });
    }
}
