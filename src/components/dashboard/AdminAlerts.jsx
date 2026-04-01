import React from 'react';

const AdminAlerts = ({ activeAlerts, onDismiss }) => {
    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 sm:w-80 pointer-events-none">
            {activeAlerts.map(alert => (
                <div key={alert.id} className={`pointer-events-auto text-white p-4 rounded-xl shadow-2xl border-2 animate-bounce flex items-center justify-between ${alert.isOrder ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'}`}>
                    <div>
                        <h4 className="font-bold text-lg flex items-center gap-2">
                            {alert.isOrder ? '🛍️ Novo Pedido' : `🔔 Mesa ${alert.mesa_id}`}
                        </h4>
                        <p className={`text-xs ${alert.isOrder ? 'text-green-100' : 'text-red-100'}`}>
                            {alert.isOrder ? alert.request_type : 'Chamou o garçom!'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {alert.isOrder && alert.customer_phone && (
                            <a
                                href={`https://wa.me/244${alert.customer_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center"
                                title="Contactar Cliente"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </a>
                        )}
                        <button
                            onClick={() => onDismiss(alert.id)}
                            className={`bg-white px-3 py-1 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-colors shadow-sm ${alert.isOrder ? 'text-green-600' : 'text-red-600'}`}
                        >
                            {alert.isOrder ? 'Ver' : 'Atendido'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminAlerts;
