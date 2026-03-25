import React from 'react';

const MasqueradeBanner = ({ restaurantName }) => {
    const isMasquerading = localStorage.getItem('masquerade_restaurant_id');
    
    if (!isMasquerading) return null;

    return (
        <div className="bg-red-600/90 text-white px-4 py-2 flex items-center justify-between shadow-lg sticky top-0 z-40 backdrop-blur-md border-b border-red-500/50">
            <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-xl">🕵️‍♂️</span> Você está no MODO FANTASMA - A ver o painel de: {restaurantName}
            </div>
            <button
                onClick={() => {
                    localStorage.removeItem('masquerade_restaurant_id');
                    window.location.href = '/super-admin';
                }}
                className="bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm"
            >
                Sair e Voltar ao Super Admin
            </button>
        </div>
    );
};

export default MasqueradeBanner;
