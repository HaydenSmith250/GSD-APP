import { supabaseAdmin } from './supabase-admin';

export const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', icon: '🩸', description: 'Complete your first task', check: (s: any) => s.tasks_completed >= 1 },
    { id: 'proof_of_work', name: 'Proof of Work', icon: '📸', description: 'First photo verification', check: (s: any) => s.tasks_verified >= 1 },
    { id: 'on_a_roll', name: 'On a Roll', icon: '🔥', description: '3-day streak', check: (s: any) => s.longest_streak >= 3 },
    { id: 'week_warrior', name: 'Week Warrior', icon: '💪', description: '7-day streak', check: (s: any) => s.longest_streak >= 7 },
    { id: 'century_club', name: 'Century Club', icon: '💯', description: 'Earn 100 XP total', check: (s: any) => s.total_xp >= 100 },
    { id: 'grinder', name: 'Grinder', icon: '⚙️', description: '10 tasks completed', check: (s: any) => s.tasks_completed >= 10 },
    { id: 'no_excuses', name: 'No Excuses', icon: '🎯', description: '25 proofs submitted', check: (s: any) => s.tasks_verified >= 25 },
    { id: 'unstoppable', name: 'Unstoppable', icon: '🚀', description: '30-day streak', check: (s: any) => s.longest_streak >= 30 },
    { id: 'xp_machine', name: 'XP Machine', icon: '⚡', description: 'Earn 1,000 XP total', check: (s: any) => s.total_xp >= 1000 },
];

import { calculateLevel } from './level-utils';

export const XP_VALUES = {
    task_completed: 50,
    task_verified_photo: 25,
    checkin_bonus_perfect: 15,  // Answered within 2 mins
    checkin_bonus_ok: 5,        // Answered within 5 mins
    streak_bonus: (days: number) => Math.min(days * 2, 50),
};

export const XP_PENALTIES = {
    task_failed: -15,
    task_skipped: -10,
    missed_checkin: -20,
    streak_broken: -50,
};

export async function addTempXpToLog(statsId: string, userLog: any[], xpAmount: number, dateStr: string) {
    let newLog = Array.isArray(userLog) ? [...userLog] : [];
    let found = false;

    for (let i = 0; i < newLog.length; i++) {
        if (newLog[i].date === dateStr) {
            newLog[i].xp = (newLog[i].xp || 0) + xpAmount;
            found = true;
            break;
        }
    }

    if (!found) {
        newLog.push({ date: dateStr, xp: xpAmount });
    }

    // Keep only last 30 days
    if (newLog.length > 30) {
        newLog = newLog.slice(newLog.length - 30);
    }

    return newLog;
}

export async function awardXp(amount: number, reason: string): Promise<{ leveledUp: boolean; currentLevel: number; newXp: number }> {
    try {
        const { data: currentStats } = await supabaseAdmin
            .from('stats')
            .select('*')
            .limit(1)
            .single();

        if (!currentStats) throw new Error('Stats not found');

        // Apply Streak Multiplier (starts at 1x, +0.05 per extra day)
        // streak 1 = 1.0x, streak 2 = 1.05x, streak 3 = 1.10x
        const currentStreak = Math.max(1, currentStats.current_streak || 1);
        const multiplier = 1.0 + ((currentStreak - 1) * 0.05);

        // Calculate final XP to add (don't multiply negative amounts)
        const finalAmount = amount > 0 ? Math.round(amount * multiplier) : amount;

        const newXp = Math.max(0, currentStats.total_xp + finalAmount); // Don't go below 0
        const oldLevelData = calculateLevel(currentStats.total_xp);
        const newLevelData = calculateLevel(newXp);

        const leveledUp = newLevelData.level > oldLevelData.level;

        const today = new Date().toISOString().split('T')[0];
        const newLog = await addTempXpToLog(currentStats.id, currentStats.daily_xp_log, amount, today);

        // Track total completed/verified
        let tasksCompleted = currentStats.tasks_completed;
        let tasksVerified = currentStats.tasks_verified;
        let tasksFailed = currentStats.tasks_failed;

        if (reason === 'task_completed') tasksCompleted++;
        if (reason === 'task_verified_photo') tasksVerified++;
        if (reason === 'task_failed') tasksFailed++;

        // Check which achievements are newly unlocked
        const updatedStats = {
            ...currentStats,
            total_xp: newXp,
            level: newLevelData.level,
            tasks_completed: tasksCompleted,
            tasks_verified: tasksVerified,
            tasks_failed: tasksFailed,
        };
        const existingAchievements: { id: string; unlocked_at: string }[] = Array.isArray(currentStats.achievements) ? currentStats.achievements : [];
        const existingIds = new Set(existingAchievements.map((a) => a.id));
        const newAchievements = [...existingAchievements];
        for (const achievement of ACHIEVEMENTS) {
            if (!existingIds.has(achievement.id) && achievement.check(updatedStats)) {
                newAchievements.push({ id: achievement.id, unlocked_at: new Date().toISOString() });
            }
        }

        await supabaseAdmin
            .from('stats')
            .update({
                total_xp: newXp,
                level: newLevelData.level,
                daily_xp_log: newLog,
                tasks_completed: tasksCompleted,
                tasks_verified: tasksVerified,
                tasks_failed: tasksFailed,
                achievements: newAchievements,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentStats.id);

        return { leveledUp, currentLevel: newLevelData.level, newXp };
    } catch (error) {
        console.error('Error awarding XP:', error);
        return { leveledUp: false, currentLevel: 1, newXp: 0 };
    }
}
