import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, QrCode, MessageSquare, Utensils, Star, Smartphone, ArrowRight, Sparkles } from 'lucide-react';

const QuickActionTile = ({ label, sublabel, icon: Icon, color, onClick, badge }) => {
    const colorVariants = {
        gold: 'from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/20 hover:border-[#D4AF37]/40 text-[#D4AF37]',
        orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20 hover:border-orange-500/40 text-orange-400',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40 text-blue-400',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40 text-purple-400',
    };

    return (
        <button 
            onClick={onClick}
            className={`relative group flex flex-col items-start p-6 rounded-[2rem] bg-gradient-to-br ${colorVariants[color]} border backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 text-left overflow-hidden`}
        >
            {/* Gloss Effect */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={120} strokeWidth={1} />
            </div>

            <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-black/40 rounded-2xl border border-white/5">
                        <Icon size={24} />
                    </div>
                    {badge && (
                        <span className="bg-white/10 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-white/10">
                            {badge}
                        </span>
                    )}
                </div>

                <h4 className="text-lg font-serif font-black text-white mb-1 group-hover:text-primary transition-colors tracking-tight">
                    {label}
                </h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                    {sublabel}
                </p>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    Começar Agora <ArrowRight size={14} />
                </div>
            </div>
        </button>
    );
};

const QuickActionGrid = () => {
    const navigate = useNavigate();

    const actions = [
        {
            label: 'Promoção Blitz',
            sublabel: 'Lançar cupão de desconto por 2 horas',
            icon: Zap,
            color: 'gold',
            badge: 'Poderoso',
            onClick: () => navigate('/admin/marketing')
        },
        {
            label: 'QR das Mesas',
            sublabel: 'Exportar kit completo de QR Codes',
            icon: QrCode,
            color: 'orange',
            onClick: () => navigate('/admin/qrcode')
        },
        {
            label: 'Assistente AI',
            sublabel: 'Gerar novos pratos com Inteligência Artificial',
            icon: Sparkles,
            color: 'blue',
            badge: 'Beta',
            onClick: () => navigate('/admin/chat')
        },
        {
            label: 'Mensagem Clientes',
            sublabel: 'Enviar broadcast via WhatsApp',
            icon: MessageSquare,
            color: 'purple',
            onClick: () => navigate('/admin/crm')
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {actions.map((action, idx) => (
                <QuickActionTile key={idx} {...action} />
            ))}
        </div>
    );
};

export default QuickActionGrid;
