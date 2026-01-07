// Sound utilities for notifications

let audioContext: AudioContext | null = null;

// Initialize audio context (lazy initialization)
const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;

    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (error) {
            console.warn('AudioContext not supported:', error);
            return null;
        }
    }

    return audioContext;
};

// Play a simple notification sound using Web Audio API
export const playNotificationSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        // Create a simple beep sound
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
        console.warn('Error playing notification sound:', error);
    }
};

// Alternative: Play sound from a data URL (more reliable)
export const playNotificationSoundDataURL = () => {
    try {
        // Create a short beep sound using data URL
        const audio = new Audio();

        // Generate a simple beep sound using Web Audio API
        const ctx = getAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const destination = ctx.createMediaStreamDestination();

        oscillator.connect(gainNode);
        gainNode.connect(destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);

        audio.srcObject = destination.stream;
        audio.play().catch((error) => {
            console.warn('Error playing sound:', error);
        });
    } catch (error) {
        console.warn('Error creating notification sound:', error);
    }
};

// Simple beep using oscillator (most reliable)
export const playBeep = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) {
            // Fallback: try to resume context if suspended
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            return;
        }

        // Resume context if suspended (required by some browsers)
        // This is important - browsers require user interaction to start audio
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {
                // If resume fails, try to create a new context
                audioContext = null;
            });
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Two-tone beep (like WhatsApp)
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
    } catch (error) {
        console.warn('Error playing beep:', error);
    }
};

