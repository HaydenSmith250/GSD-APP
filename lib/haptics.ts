'use client';

/**
 * Haptic feedback utility matching the GSD UX Gamification Plan.
 * Because standard Vibration API isn't supported in Safari for PWAs,
 * this uses the iOS 18+ checkbox hack to force a native haptic tap.
 */
export const triggerHaptic = () => {
    if (typeof window === 'undefined') return;

    if (localStorage.getItem('gsd_haptics_enabled') === 'false') return;

    try {
        const hapticCheckbox = document.createElement('input');
        hapticCheckbox.type = 'checkbox';
        hapticCheckbox.setAttribute('switch', '');
        hapticCheckbox.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;';
        document.body.appendChild(hapticCheckbox);

        // Toggle state to force the haptic physical click
        hapticCheckbox.checked = !hapticCheckbox.checked;

        // Clean up
        setTimeout(() => {
            if (document.body.contains(hapticCheckbox)) {
                document.body.removeChild(hapticCheckbox);
            }
        }, 100);
    } catch (e) {
        // Ignore errors if used in unsupported context (e.g., non-iOS)
    }
};
