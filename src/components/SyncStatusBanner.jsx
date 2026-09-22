import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { offlineDb } from '../lib/offlineDb';

export default function SyncStatusBanner({ restaurantId }) {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState(null);

    const updatePending = async () => {
        if (!restaurantId) return;
        const count = await offlineDb.getPendingSyncCount(restaurantId);
        setPendingCount(count);
    };

    useEffect(() => {
        updatePending();

        const handleOnline = () => {
            setIsOnline(true);
            updatePending();
            syncEngine.syncPendingData(restaurantId);
        };
        const handleOffline = () => {
            setIsOnline(false);
            updatePending();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Subscrever a atualizações do syncEngine
        const unsubscribe = syncEngine.subscribe(() => {
            updatePending();
        });

        // Polling discreto a cada 10 segundos
        const interval = setInterval(updatePending, 10000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
            clearInterval(interval);
        };
    }, [restaurantId]);

    const handleForceSync = async () => {
        setIsSyncing(true);
        setSyncMessage('A sincronizar faturas acumuladas com a cloud...');
        const result = await syncEngine.syncPendingData(restaurantId);
        setIsSyncing(false);

        if (result.success) {
            setSyncMessage(`Sincronização concluída! ${result.syncedCount || 0} faturas enviadas com sucesso.`);
            setTimeout(() => setSyncMessage(null), 5000);
        } else {
            setSyncMessage('Sem ligação à internet no momento ou erro no servidor.');
            setTimeout(() => setSyncMessage(null), 5000);
        }
        updatePending();
    };

    // Se estiver online e sem pendências, não precisa mostrar banner
    if (isOnline && pendingCount === 0 && !syncMessage && !isSyncing) {
        return null;
    }

    return (
        <div className={`w-full px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm transition-all duration-300 ${
            !isOnline
                ? 'bg-amber-500 text-slate-950 border-b border-amber-600'
                : pendingCount > 0
                    ? 'bg-blue-600 text-white border-b border-blue-700'
                    : 'bg-emerald-600 text-white'
        }`}>
            <div className="flex items-center space-x-2">
                {!isOnline ? (
                    <div className="flex items-center space-x-1.5">
                        <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
                        <span>
                            <strong>Modo Offline Ativo (30 Dias)</strong> — O sistema está a gravar faturas localmente.
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-1.5">
                        <Wifi className="w-4 h-4 text-emerald-200" />
                        <span>Online | Conexão de Rede Ativa</span>
                    </div>
                )}

                {pendingCount > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full font-bold ${
                        !isOnline ? 'bg-slate-950 text-amber-400' : 'bg-white text-blue-700'
                    }`}>
                        {pendingCount} fatura{pendingCount > 1 ? 's' : ''} acumulada{pendingCount > 1 ? 's' : ''} por sincronizar
                    </span>
                )}
            </div>

            <div className="flex items-center space-x-3">
                {syncMessage && (
                    <span className="text-[11px] opacity-90 hidden md:inline">
                        {syncMessage}
                    </span>
                )}

                {isOnline && pendingCount > 0 && (
                    <button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className="flex items-center space-x-1 px-3 py-1 rounded bg-white text-blue-700 hover:bg-blue-50 transition-colors font-medium shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'A Sincronizar...' : 'Sincronizar Agora'}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
