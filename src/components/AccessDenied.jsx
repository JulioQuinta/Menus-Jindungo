import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';

const AccessDenied = ({ role }) => {
    const navigate = useNavigate();

    const getRoleLabel = (r) => {
        const roles = {
            'admin': 'Administrador',
            'waiter': 'Empregado de Mesa',
            'kitchen': 'Chef de Cozinha',
            'reception': 'Receção / Salão'
        };
        return roles[r] || r || 'Colaborador';
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 min-h-[60vh] text-center relative overflow-hidden">
            {/* Ambient Background Glow effect inside the card region */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-md w-full bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Gold/Red Warning Icon Container */}
                <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-[#D4AF37]/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse">
                    <ShieldAlert size={40} className="text-[#D4AF37]" />
                </div>

                <h2 className="text-3xl font-serif font-black text-white mb-3 tracking-tight">
                    Acesso Restrito
                </h2>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    A sua conta com a função de <span className="text-[#D4AF37] font-bold uppercase tracking-wider text-[11px] bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg border border-[#D4AF37]/20">{getRoleLabel(role)}</span> não tem permissão para visualizar esta secção administrativa.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Voltar à Visão Geral
                    </button>

                    <p className="text-[10px] text-gray-500 font-mono mt-4 flex items-center justify-center gap-1">
                        <KeyRound size={12} />
                        Precisa de acesso? Contacte o administrador da loja.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
