/**
 * Safely checks if the browser Notification API is supported.
 * Returns true if the Notification constructor is available and has the essential static methods.
 */
export const isNotificationSupported = () => {
    return typeof window !== 'undefined' && 
           'Notification' in window && 
           window.Notification !== undefined &&
           typeof window.Notification.requestPermission === 'function';
};

/**
 * Safely requests permission to show notifications.
 * Does nothing if not supported.
 */
export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        console.warn('Notifications not supported in this browser.');
        return 'denied';
    }
    
    try {
        return await Notification.requestPermission();
    } catch (e) {
        console.error('Error requesting notification permission:', e);
        return 'denied';
    }
};

/**
 * Safely sends a browser notification.
 * Does nothing if not supported or permission not granted.
 */
export const sendNotification = (title, options = {}) => {
    if (!isNotificationSupported()) return null;
    
    if (Notification.permission === 'granted') {
        try {
            return new Notification(title, options);
        } catch (e) {
            console.error('Error sending notification:', e);
            return null;
        }
    }
    return null;
};

/**
 * Safely checks current notification permission.
 * Returns 'default' if not supported.
 */
export const getNotificationPermission = () => {
    if (!isNotificationSupported()) return 'default';
    return Notification.permission;
};
