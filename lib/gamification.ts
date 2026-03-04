import { supabaseAdmin } from './supabase-admin';

const LEVEL_THRESHOLDS = [
    0,      // Level 1: Rookie
    100,    // Level 2: Beginner
    300,    // Level 3: Getting Serious
    600,    // Level 4: Committed
    1000,   // Level 5: Machine
    1500,   // Level 6: Unstoppable
    2500,   // Level 7: Elite
    4000,   // Level 8: Legendary
    6000,   // Level 9: Mythic
    10000,  // Level 10: God Mode
];

export const XP_VALUES = {
    task_completed: 10,
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

export function calculateLevel(totalXp: number): { level: number; nextThreshold: number; progress: number } {
    let level = 1;
    let nextThreshold = LEVEL_THRESHOLDS[1];
    let prevThreshold = 0;

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (totalXp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
            prevThreshold = LEVEL_THRESHOLDS[i];
            nextThreshold = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i] * 1.5; // Scale infinitely past 10
        } else {
            break;
        }
    }

    const levelTotalXp = nextThreshold - prevThreshold;
    const levelCurrentXp = totalXp - prevThreshold;
    const progress = Math.max(0, Math.min(100, Math.round((levelCurrentXp / levelTotalXp) * 100)));

    return { level, nextThreshold, progress };
}

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

        const newXp = Math.max(0, currentStats.total_xp + amount); // Don't go below 0
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

        await supabaseAdmin
            .from('stats')
            .update({
                total_xp: newXp,
                level: newLevelData.level,
                daily_xp_log: newLog,
                tasks_completed: tasksCompleted,
                tasks_verified: tasksVerified,
                tasks_failed: tasksFailed,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentStats.id);

        return { leveledUp, currentLevel: newLevelData.level, newXp };
    } catch (error) {
        console.error('Error awarding XP:', error);
        return { leveledUp: false, currentLevel: 1, newXp: 0 };
    }
}
