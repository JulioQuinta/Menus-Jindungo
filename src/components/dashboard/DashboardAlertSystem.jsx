import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import AdminAlerts from './AdminAlerts';
import MasqueradeBanner from './MasqueradeBanner';

const DashboardAlertSystem = ({ 
    activeAlerts, handleDismissAlert, restaurant, globalNotifications, 
    handleDismissNotif, isExpiringSoon, isExpirationDismissed, 
    daysUntilExpiration, setShowExpirationModal, handleDismissExpiration 
}) => {
    return (
        <>
            {/* Waiter & Order Alerts Section */}
            <AdminAlerts activeAlerts={activeAlerts} onDismiss={handleDismissAlert} />

            {/* Masquerade Warning Banner */}
            <MasqueradeBanner restaurantName={restaurant?.name} />

            {/* Global Notifications Banner */}
            {globalNotifications.map(notif => (
                <div
                    key={notif.id}
                    className={`px-4 py-3 flex items-start gap-3 shadow-lg sticky top-0 z-40 backdrop-blur-md border-b text-sm font-medium ${notif.type === 'danger' ? 'bg-red-900/90 text-white border-red-500/50' :
                        notif.type === 'warning' ? 'bg-orange-600/90 text-white border-orange-500/50' :
                            notif.type === 'success' ? 'bg-green-700/90 text-white border-green-500/50' :
                                'bg-blue-800/90 text-white border-blue-500/50'
                        }`}
                >
                    <span className="text-xl mt-0.5">
                        {notif.type === 'danger' ? '🚨' : notif.type === 'warning' ? '⚠️' : notif.type === 'success' ? '🎉' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                        <strong className="block mb-0.5 uppercase tracking-wider text-[10px] opacity-80">
                            Mensagem da Administração Menús Jindungo
                        </strong>
                        {notif.message}
                    </div>
                    <button 
                        onClick={() => handleDismissNotif(notif.id)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors self-center"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}

            {/* Expiration Alert Banner */}
            {isExpiringSoon && !isExpirationDismissed && (
                <div className="px-4 py-3 flex items-center justify-between gap-3 shadow-lg sticky top-0 z-[35] backdrop-blur-md border-b text-sm font-medium bg-gradient-to-r from-orange-600/95 to-red-600/95 text-white border-orange-500/50 animate-pulse-slow">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <strong className="block mb-0.5 uppercase tracking-wider text-[10px] opacity-80">
                                Aviso de Renovação de Licença
                            </strong>
                            O seu plano termina em <strong>{daysUntilExpiration} {daysUntilExpiration === 1 ? 'dia' : 'dias'}</strong>. Para evitar a suspensão do seu Menu Digital, efetue a regularização.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowExpirationModal(true)}
                            className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition whitespace-nowrap shadow-sm"
                        >
                            Ver Detalhes
                        </button>
                        <button 
                            onClick={handleDismissExpiration}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            title="Fechar aviso"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default DashboardAlertSystem;
