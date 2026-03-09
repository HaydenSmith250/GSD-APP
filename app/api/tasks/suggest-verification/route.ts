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

        const suggestionRaw = await callAI({
            model: MODELS.COACH_CHAT,
            systemPrompt: `You are a task verification specialist. Given a task title and optional description, provide 3 distinct, actionable ways an AI vision model could verify this task is being done or was completed via photo. Return ONLY a JSON array of 3 short strings. No markdown formatting, just the raw array. Example: ["A photo of the completed code on screen", "A selfie holding a thumbs up at your desk", "A screenshot of your daily revenue dashboard"]`,
            messages: [
                {
                    role: 'user',
                    content: `Task: "${title}"${description ? `\nDescription: ${description}` : ''}`,
                },
            ],
            temperature: 0.5,
            max_tokens: 200,
        });

        let suggestions = [];
        try {
            suggestions = JSON.parse(suggestionRaw.trim());
        } catch (e) {
            console.error("Failed to parse verification suggestions:", suggestionRaw);
            suggestions = ["A clear photo of the end result", "A selfie of you doing the work", "A screenshot indicating completion"];
        }

        return NextResponse.json({ success: true, suggestions });
    } catch (error) {
        console.error('suggest-verification error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate suggestion' }, { status: 500 });
    }
}
