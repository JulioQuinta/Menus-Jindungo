import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
    const [isLowEnd, setIsLowEnd] = useState(false);

    useEffect(() => {
        const updateNetworkStatus = () => {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                // Check for generic 'slow-2g', '2g', or '3g'
                const isSlow = ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
                const saveData = connection.saveData; // User enabled Data Saver
                setIsLowEnd(isSlow || saveData);
            }
        };

        updateNetworkStatus();

        if (navigator.connection) {
            navigator.connection.addEventListener('change', updateNetworkStatus);
        }

        return () => {
            if (navigator.connection) {
                navigator.connection.removeEventListener('change', updateNetworkStatus);
            }
        };
    }, []);

    return { isLowEnd };
};
