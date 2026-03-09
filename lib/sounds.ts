'use client';

/**
 * Centralized sound manager for UI micro-interactions using Web Audio API.
 * Synthesizes minimal, premium sounds (clicks, pops, success chords) purely in JS.
 * Zero latency, zero network requests, perfect for PWAs.
 */

type SoundType =
    | 'task_create'
    | 'task_complete'
    | 'verify_pass'
    | 'verify_fail'
    | 'xp_collect'
    | 'level_up'
    | 'badge_unlock'
    | 'streak_break'
    | 'timer_complete'
    | 'tab_switch'
    | 'swipe_action'
    | 'button_press'
    | 'type_key'
    | 'msg_send'
    | 'msg_receive';

let audioCtx: AudioContext | null = null;
let soundsEnabled = true;

const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const initSounds = () => {
    if (typeof window === 'undefined') return;
    const pref = localStorage.getItem('gsd_sounds_enabled');
    if (pref !== null) {
        soundsEnabled = pref === 'true';
    }

    // Add warm-up listener for iOS
    const unlockAudio = () => {
        getAudioContext();
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });
};

export const setSoundsEnabled = (enabled: boolean) => {
    soundsEnabled = enabled;
    if (typeof window !== 'undefined') {
        localStorage.setItem('gsd_sounds_enabled', enabled.toString());
    }
};

// --- Synths ---

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1, slideFreq?: number) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
};

const playNoise = (duration: number, vol: number = 0.1) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.start(now);
};

export const playSound = (type: SoundType) => {
    if (typeof window === 'undefined' || !soundsEnabled) return;

    try {
        switch (type) {
            // UI Clicks & Taps
            case 'tab_switch':
            case 'button_press':
                // Small, satisfying click for cards/buttons
                playTone(800, 'sine', 0.03, 0.04);
                break;
            case 'type_key':
                // Extremely subtle typing tick
                playNoise(0.015, 0.01);
                break;
            case 'swipe_action':
                playNoise(0.04, 0.02);
                break;

            // Chat Messages
            case 'msg_send':
                playTone(400, 'sine', 0.1, 0.03, 600);
                break;
            case 'msg_receive':
                playTone(600, 'sine', 0.1, 0.03, 400);
                break;

            // Core Actions
            case 'task_create':
                // Energetic double-pop
                playTone(900, 'sine', 0.1, 0.05);
                setTimeout(() => playTone(1400, 'sine', 0.15, 0.06), 80);
                break;
            case 'task_complete':
            case 'verify_pass':
            case 'xp_collect':
                // Major success chord (clean & satisfying)
                playTone(523.25, 'triangle', 0.4, 0.04); // C5
                playTone(659.25, 'triangle', 0.4, 0.04); // E5
                playTone(783.99, 'triangle', 0.4, 0.04); // G5
                break;
            case 'verify_fail':
                // Dull error thud
                playTone(150, 'square', 0.2, 0.05, 50);
                break;
            case 'streak_break':
                playTone(200, 'sawtooth', 0.4, 0.05, 50);
                break;

            // Gamification
            case 'level_up':
                // Short, suspenseful buildup when overlay appears
                const buildupCtx = getAudioContext();
                if (!buildupCtx) return;
                let t = 0;
                [261.63, 329.63, 392.00].forEach((freq) => {
                    setTimeout(() => playTone(freq, 'square', 0.2, 0.05), t);
                    t += 200;
                });
                break;

            case 'badge_unlock':
                // 5-second triumphant jingle for the animation overlay
                const ctx = getAudioContext();
                if (!ctx) return;

                // Arpeggio leading up
                let time = 0;
                const notes = [
                    261.63, // C4
                    329.63, // E4
                    392.00, // G4
                    523.25, // C5
                    659.25, // E5
                    783.99, // G5
                ];

                notes.forEach((freq, i) => {
                    setTimeout(() => playTone(freq, 'square', 0.15, 0.05), time);
                    time += 150;
                });

                // Final sustained triumphant chord
                setTimeout(() => {
                    playTone(523.25, 'triangle', 4.0, 0.05); // C5
                    playTone(659.25, 'triangle', 4.0, 0.05); // E5
                    playTone(783.99, 'triangle', 4.0, 0.05); // G5
                    playTone(1046.50, 'triangle', 4.0, 0.05); // C6
                }, time);
                break;

            case 'timer_complete':
                // Double ring
                playTone(800, 'sine', 0.4, 0.1);
                setTimeout(() => playTone(800, 'sine', 0.4, 0.1), 200);
                break;
        }
    } catch (error) {
        console.error('Error playing WebAudio sound:', error);
    }
};
