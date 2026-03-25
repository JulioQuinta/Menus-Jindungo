import React from 'react';

const AdminAlerts = ({ activeAlerts, onDismiss }) => {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80 pointer-events-none">
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
                    <button
                        onClick={() => onDismiss(alert.id)}
                        className={`bg-white px-3 py-1 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-colors shadow-sm ${alert.isOrder ? 'text-green-600' : 'text-red-600'}`}
                    >
                        {alert.isOrder ? 'Ver' : 'Atendido'}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AdminAlerts;
