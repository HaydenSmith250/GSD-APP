import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { callAI, MODELS } from '@/lib/openrouter';

export async function POST(request: Request) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { title, description } = body;

        if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

        const suggestion = await callAI({
            model: MODELS.COACH_CHAT,
            systemPrompt: `You are a task verification specialist. Given a task title and optional description, write a concise verification prompt that tells an AI vision model exactly what to look for in a photo to confirm the task is being done or was completed. Be specific, visual, and actionable. Return ONLY the verification prompt text — no preamble, no quotes, no extra explanation.`,
            messages: [
                {
                    role: 'user',
                    content: `Task: "${title}"${description ? `\nDescription: ${description}` : ''}`,
                },
            ],
            temperature: 0.4,
            max_tokens: 150,
        });

        return NextResponse.json({ success: true, suggestion: suggestion.trim() });
    } catch (error) {
        console.error('suggest-verification error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate suggestion' }, { status: 500 });
    }
}
