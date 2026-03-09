// Pure level calculation utility — no server imports, safe for client components

export const LEVEL_THRESHOLDS = [
    0, 100, 300, 650, 1150, 1850, 2850, 4350, 6350, 8850,
    12350, 16850, 22850, 30850, 40850, 53850, 70850, 92850, 120850, 155850
];

export const LEVEL_NAMES = [
    'Wantrepreneur', 'Motivation Playlist Guy', 'Guru Course Buyer', 'Dropship Dreamer', 'Day One Operator',
    'First Real Cheque', 'Quit The Excuses', 'Actual Man', 'Built Different', 'Cash Flow Positive',
    'Silent Operator', 'Revenue Machine', '7-Figure Mindset', 'Discipline Over Talent', 'Empire Builder',
    'Relentless', 'Alpha Ecom Millionaire', 'Exit Strategy', 'Generational', 'E-Commerce God'
];

export function calculateLevel(totalXp: number): { level: number; nextThreshold: number; progress: number; name: string } {
    let level = 1;

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (totalXp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
        } else {
            break;
        }
    }

    // Cap level to 20
    const finalLevel = Math.min(level, 20);
    const prevThreshold = LEVEL_THRESHOLDS[finalLevel - 1] || 0;
    const nextThreshold = LEVEL_THRESHOLDS[finalLevel] || prevThreshold;

    let progress = 100;
    if (finalLevel < 20) {
        const levelTotalXp = nextThreshold - prevThreshold;
        const levelCurrentXp = totalXp - prevThreshold;
        progress = Math.max(0, Math.min(100, Math.round((levelCurrentXp / levelTotalXp) * 100)));
    }

    const name = LEVEL_NAMES[finalLevel - 1];

    return { level: finalLevel, nextThreshold, progress, name };
}
