import React from 'react';

const AdminAlerts = ({ activeAlerts, onDismiss }) => {
    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 sm:w-80 pointer-events-none">
            {activeAlerts.map(alert => (
                <div key={alert.id} className={`pointer-events-auto text-white p-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-2 animate-in slide-in-from-bottom duration-300 hover:scale-[1.02] transition-all flex items-center justify-between ${alert.isOrder ? 'bg-green-600 border-green-400' : 'bg-gradient-to-r from-red-600 to-red-700 border-red-400 ring-4 ring-red-500/30'}`}>
                    <div>
                        <h4 className="font-bold text-lg flex items-center gap-2 drop-shadow-md">
                            {alert.isOrder ? '🛍️ Novo Pedido' : `🔔 Mesa: ${alert.mesa_id}`}
                        </h4>
                        <p className={`text-xs font-semibold mt-0.5 ${alert.isOrder ? 'text-green-100' : 'text-red-100 uppercase tracking-wide'}`}>
                            {alert.isOrder ? alert.request_type : '🛎️ Chamou o empregado de mesa!'}
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
                            className={`bg-white px-3 py-1.5 rounded-lg font-extrabold text-sm hover:bg-gray-100 active:scale-95 transition-all shadow-md ${alert.isOrder ? 'text-green-700' : 'text-red-700'}`}
                        >
                            {alert.isOrder ? 'Ver' : 'Atendido ✓'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminAlerts;
