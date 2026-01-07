import { useStore } from './store';

// Helper functions for showing notifications
export const useNotifications = () => {
    const { addToast } = useStore();

    const showSuccess = (message: string, duration?: number) => {
        addToast(message, 'success', duration);
    };

    const showError = (message: string, duration?: number) => {
        addToast(message, 'error', duration);
    };

    const showInfo = (message: string, duration?: number) => {
        addToast(message, 'info', duration);
    };

    const showWarning = (message: string, duration?: number) => {
        addToast(message, 'warning', duration);
    };

    return {
        showSuccess,
        showError,
        showInfo,
        showWarning,
    };
};

// Browser notification permission and helper
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const showBrowserNotification = (
    title: string,
    options?: NotificationOptions,
): Notification | null => {
    if (!('Notification' in window)) {
        return null;
    }

    if (Notification.permission === 'granted') {
        return new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options,
        });
    }

    return null;
};

