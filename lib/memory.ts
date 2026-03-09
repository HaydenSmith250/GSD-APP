// Memory system — builds the full AI context from all 3 layers
import { supabaseAdmin } from './supabase-admin';

export interface FullContext {
    systemPrompt: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

// Build the complete context for an AI call
export async function buildFullContext(sessionId?: string): Promise<FullContext> {
    // Fetch all context in parallel
    const [userConfig, recentMessages, topMemories, currentTasks, currentStats] = await Promise.all([
        getUserConfig(),
        getRecentMessages(30, sessionId),
        getTopMemories(10),
        getCurrentTasks(),
        getStats(),
    ]);

    // Assemble the system prompt from all layers
    const systemPromptParts: string[] = [];

    // Layer 1: Coach personality
    if (userConfig?.coach_system_prompt) {
        systemPromptParts.push(userConfig.coach_system_prompt);
    }

    // Layer 1: Permanent memory (identity/preferences)
    if (userConfig?.permanent_memory) {
        systemPromptParts.push(`\n\n=== ABOUT THE USER ===\n${userConfig.permanent_memory}`);
    }

    // Layer 3: Long-term extracted memories
    if (topMemories.length > 0) {
        const memoryList = topMemories
            .map((m: { content: string; category: string; importance: number }) =>
                `- [${m.category}] ${m.content} (importance: ${m.importance}/10)`)
            .join('\n');
        systemPromptParts.push(`\n\n=== THINGS I KNOW ABOUT YOU ===\n${memoryList}`);
    }

    // Current tasks context
    if (currentTasks.length > 0) {
        const taskList = currentTasks
            .map((t: { title: string; status: string; priority: string; xp_reward: number }) =>
                `- [${t.status}] ${t.title} (${t.priority} priority, ${t.xp_reward} XP)`)
            .join('\n');
        systemPromptParts.push(`\n\n=== CURRENT TASKS ===\n${taskList}`);
    }

    // Current stats
    if (currentStats) {
        systemPromptParts.push(`\n\n=== USER STATS ===
Level: ${currentStats.level} | Total XP: ${currentStats.total_xp}
Current streak: ${currentStats.current_streak} days | Longest streak: ${currentStats.longest_streak} days
Tasks completed: ${currentStats.tasks_completed} | Verified: ${currentStats.tasks_verified} | Failed: ${currentStats.tasks_failed}`);
    }

    // Current time context
    const now = new Date();
    const timezone = userConfig?.timezone || 'America/Los_Angeles';
    systemPromptParts.push(`\n\n=== CURRENT TIME ===\n${now.toLocaleString('en-US', { timeZone: timezone })} (${timezone})`);

    // Layer 2: Recent messages as conversation history
    const conversationMessages = recentMessages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
    }));

    return {
        systemPrompt: systemPromptParts.join(''),
        messages: conversationMessages,
    };
}

// === Database helpers ===

async function getUserConfig() {
    const { data } = await supabaseAdmin
        .from('user_config')
        .select('*')
        .limit(1)
        .single();
    return data;
}

async function getRecentMessages(count: number, sessionId?: string) {
    let query = supabaseAdmin
        .from('messages')
        .select('role, content, source, created_at, session_id')
        .order('created_at', { ascending: true })
        .limit(count);

    if (sessionId) {
        query = query.eq('session_id', sessionId);
    } else {
        query = query.is('session_id', null);
    }

    const { data } = await query;
    return data || [];
}

async function getTopMemories(count: number) {
    const { data } = await supabaseAdmin
        .from('memories')
        .select('content, importance, category')
        .order('importance', { ascending: false })
        .order('last_accessed', { ascending: false })
        .limit(count);

    // Update last_accessed for used memories
    if (data && data.length > 0) {
        // Fire and forget — don't block on this
        supabaseAdmin
            .from('memories')
            .update({ last_accessed: new Date().toISOString() })
            .in('content', data.map((m: { content: string }) => m.content))
            .then(() => { });
    }

    return data || [];
}

async function getCurrentTasks() {
    const { data } = await supabaseAdmin
        .from('tasks')
        .select('title, status, priority, xp_reward, due_date, category')
        .in('status', ['pending', 'in_progress', 'awaiting_verification'])
        .order('priority', { ascending: false })
        .limit(20);
    return data || [];
}

async function getStats() {
    const { data } = await supabaseAdmin
        .from('stats')
        .select('*')
        .limit(1)
        .single();
    return data;
}

// Save a message to the database
export async function saveMessage(msg: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    source: 'web' | 'telegram' | 'system';
    session_id?: string;
    metadata?: Record<string, unknown>;
}) {
    const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
            role: msg.role,
            content: msg.content,
            source: msg.source,
            session_id: msg.session_id,
            metadata: msg.metadata || {},
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving message:', error);
        throw error;
    }
    return data;
}

// Get total message count (for memory extraction trigger)
export async function getMessageCount(sessionId?: string): Promise<number> {
    let query = supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true });

    if (sessionId) {
        query = query.eq('session_id', sessionId);
    } else {
        query = query.is('session_id', null);
    }

    const { count } = await query;
    return count || 0;
}
