import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { syncOfflineOrders } from '../utils/offlineSync';

const checkIsLowEnd = (connection, isSlowNetwork) => {
    if (isSlowNetwork) return true;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
        return true;
    }
    
    // Check device specs (memory, cores) to classify low-end device
    if (typeof navigator !== 'undefined') {
        if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
            return true;
        }
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
            return true;
        }
    }
    return false;
};

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSlow, setIsSlow] = useState(false);
    const [isLowEnd, setIsLowEnd] = useState(() => {
        const connection = typeof navigator !== 'undefined' ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection) : null;
        return checkIsLowEnd(connection, false);
    });

    useEffect(() => {
        let toastId = null;
        const connection = typeof navigator !== 'undefined' ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection) : null;

        const updateLowEndStatus = (slowStatus) => {
            setIsLowEnd(checkIsLowEnd(connection, slowStatus));
        };

        const handleOnline = () => {
            setIsOnline(true);
            setIsSlow(false);
            updateLowEndStatus(false);
            if (toastId) {
                toast.dismiss(toastId);
                toastId = null;
            }
            toast.success("Ligação restaurada!", { id: 'network-status' });
            
            // Sync any offline orders immediately when internet returns
            setTimeout(syncOfflineOrders, 1000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            updateLowEndStatus(true);
            toastId = toast.error("Sem ligação à internet. Modo offline ativo.", { 
                id: 'network-status',
                duration: Infinity 
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodically attempt offline sync every 15 seconds if online
        const syncInterval = setInterval(() => {
            if (navigator.onLine) {
                syncOfflineOrders();
            }
        }, 15000);

        // Run sync on mount once in case we started online with pending items
        if (navigator.onLine) {
            syncOfflineOrders();
        }

        // Monitor connection API if supported
        if (connection) {
            const updateConnectionStatus = () => {
                if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                    setIsSlow(true);
                    updateLowEndStatus(true);
                    toast('Aviso: Ligação lenta. Algumas ações podem demorar mais do que o normal.', {
                        icon: '⚠️',
                        id: 'network-slow',
                        duration: 5000
                    });
                } else {
                    setIsSlow(false);
                    updateLowEndStatus(false);
                }
            };
            
            connection.addEventListener('change', updateConnectionStatus);
            // Check initially
            updateConnectionStatus();

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                connection.removeEventListener('change', updateConnectionStatus);
                clearInterval(syncInterval);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(syncInterval);
        };
    }, []);

    return { isOnline, isSlow, isLowEnd };
};

