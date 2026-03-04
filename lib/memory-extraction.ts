// Memory extraction — extract important facts from conversations
import { supabaseAdmin } from './supabase-admin';
import { callAI, MODELS } from './openrouter';

const EXTRACTION_PROMPT = `Review this conversation excerpt. Extract any important facts, goals, preferences, habits, struggles, or commitments the user mentioned.

Return ONLY a valid JSON array. No other text. Each item should have:
- "content": a concise statement of the fact/memory
- "importance": 1-10 (10 = critical life goal, 1 = minor preference)
- "category": one of "general", "goal", "preference", "habit", "struggle"

Only extract genuinely important/new information. Skip small talk and greetings.
If there is nothing worth extracting, return an empty array: []

Example output:
[{"content": "User wants to gym 4x per week", "importance": 7, "category": "goal"}]`;

export async function extractMemories(recentMessages: Array<{ role: string; content: string }>) {
    if (recentMessages.length < 3) return; // Not enough to extract from

    try {
        // Format conversation for extraction
        const conversationText = recentMessages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        const result = await callAI({
            model: MODELS.MEMORY_EXTRACTION,
            systemPrompt: EXTRACTION_PROMPT,
            messages: [{ role: 'user', content: conversationText }],
            temperature: 0.3,
            max_tokens: 500,
        });

        // Parse JSON response
        let memories: Array<{ content: string; importance: number; category: string }>;
        try {
            // Try to extract JSON from the response (handle markdown code blocks)
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return;
            memories = JSON.parse(jsonMatch[0]);
        } catch {
            console.error('Failed to parse memory extraction result:', result);
            return;
        }

        if (!Array.isArray(memories) || memories.length === 0) return;

        // Deduplicate against existing memories
        const { data: existingMemories } = await supabaseAdmin
            .from('memories')
            .select('content');

        const existingSet = new Set(
            (existingMemories || []).map((m: { content: string }) => m.content.toLowerCase())
        );

        const newMemories = memories.filter(m =>
            m.content &&
            m.importance >= 1 &&
            m.importance <= 10 &&
            !existingSet.has(m.content.toLowerCase())
        );

        if (newMemories.length === 0) return;

        // Insert new memories
        const { error } = await supabaseAdmin
            .from('memories')
            .insert(newMemories.map(m => ({
                content: m.content,
                importance: m.importance,
                category: m.category || 'general',
            })));

        if (error) {
            console.error('Error inserting memories:', error);
        } else {
            console.log(`Extracted ${newMemories.length} new memories`);
        }
    } catch (err) {
        console.error('Memory extraction error:', err);
    }
}
