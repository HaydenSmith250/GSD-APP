// Pure level calculation utility — no server imports, safe for client components

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

export const LEVEL_NAMES = [
    'Rookie', 'Beginner', 'Getting Serious', 'Committed', 'Machine',
    'Unstoppable', 'Elite', 'Legendary', 'Mythic', 'God Mode',
];

export function calculateLevel(totalXp: number): { level: number; nextThreshold: number; progress: number; name: string } {
    let level = 1;
    let nextThreshold = LEVEL_THRESHOLDS[1];
    let prevThreshold = 0;

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (totalXp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
            prevThreshold = LEVEL_THRESHOLDS[i];
            nextThreshold = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i] * 1.5;
        } else {
            break;
        }
    }

    const levelTotalXp = nextThreshold - prevThreshold;
    const levelCurrentXp = totalXp - prevThreshold;
    const progress = Math.max(0, Math.min(100, Math.round((levelCurrentXp / levelTotalXp) * 100)));
    const name = LEVEL_NAMES[level - 1] || 'Legend';

    return { level, nextThreshold, progress, name };
}
