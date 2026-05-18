import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSlow, setIsSlow] = useState(false);

    useEffect(() => {
        let toastId = null;

        const handleOnline = () => {
            setIsOnline(true);
            setIsSlow(false);
            if (toastId) {
                toast.dismiss(toastId);
                toastId = null;
            }
            toast.success("Ligação restaurada!", { id: 'network-status' });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toastId = toast.error("Sem ligação à internet. Modo offline ativo.", { 
                id: 'network-status',
                duration: Infinity 
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Opcional: Monitorizar a qualidade da ligação (Connection API) se suportada
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            const updateConnectionStatus = () => {
                if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                    setIsSlow(true);
                    toast('Aviso: Ligação lenta. Algumas ações podem demorar mais do que o normal.', {
                        icon: '⚠️',
                        id: 'network-slow',
                        duration: 5000
                    });
                } else {
                    setIsSlow(false);
                }
            };
            
            connection.addEventListener('change', updateConnectionStatus);
            // Verifica no arranque
            updateConnectionStatus();

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                connection.removeEventListener('change', updateConnectionStatus);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, isSlow };
};
