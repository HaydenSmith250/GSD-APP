// OpenRouter AI Gateway
// Single integration point for all AI model calls

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export const MODELS = {
    COACH_CHAT: "x-ai/grok-4.1-fast",
    VERIFICATION: "google/gemini-3-flash-preview",
    MEMORY_EXTRACTION: "x-ai/grok-4.1-fast",
} as const;

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface AICallConfig {
    model: string;
    systemPrompt: string;
    messages: AIMessage[];
    temperature?: number;
    max_tokens?: number;
}

export async function callAI(config: AICallConfig): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'sk-or-placeholder') {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

    const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://get-shit-done.app",
            "X-Title": "Get Shit Done",
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: "system", content: config.systemPrompt },
                ...config.messages,
            ],
            temperature: config.temperature ?? 0.8,
            max_tokens: config.max_tokens ?? 1000,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter error:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
    }

    return data.choices[0].message.content;
}
