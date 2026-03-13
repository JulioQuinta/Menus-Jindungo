import React from 'react';
import { Lock, Zap, CheckCircle2, ChevronRight, Crown } from 'lucide-react';
import { generateWhatsAppLink } from '../utils/whatsappGenerator';

/**
 * Premium Upgrade Prompt to persuade users to subscribe to higher tiers.
 */
const UpgradePrompt = ({ title, requiredPlan = "Business", features = [] }) => {

    // Support/Sales number
    const supportNumber = "244923000000";

    const handleUpgradeClick = () => {
        const text = `Olá Equipa Jindungo! 🚀 Gostaria de saber mais sobre o Plano ${requiredPlan} para desbloquear a funcionalidade: ${title}. Como posso avançar?`;
        const url = `https://wa.me/${supportNumber}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-8 sm:p-12 bg-[#121212] rounded-3xl shadow-2xl border border-white/5 text-center max-w-3xl mx-auto my-8 mt-12 mb-12 transform transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] group">

            {/* Ambient Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#D4AF37]/10 blur-[120px] pointer-events-none group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none"></div>

            {/* Lock Icon Badge */}
            <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center mb-8 border border-[#D4AF37]/30 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 animate-ping opacity-20"></div>
                <Lock size={36} className="text-[#D4AF37] relative z-10 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            </div>

            {/* Headers */}
            <h2 className="relative z-10 text-3xl sm:text-4xl font-serif font-bold text-white mb-4 tracking-tight">
                Desbloqueie: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-yellow-200">{title}</span>
            </h2>

            <p className="relative z-10 text-gray-400 mb-10 max-w-xl text-lg leading-relaxed">
                Revolucione a gestão do seu restaurante. Esta ferramenta avançada é exclusiva para parceiros do majestoso <span className="font-bold text-[#D4AF37]">Plano {requiredPlan}</span>.
            </p>

            {/* Features Box */}
            {features.length > 0 && (
                <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 w-full text-left mb-10 shadow-inner overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Crown size={80} />
                    </div>

                    <h3 className="font-serif text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Zap size={22} className="text-[#D4AF37] drop-shadow-md" fill="#D4AF37" />
                        O poder que vai ganhar com o Plano {requiredPlan}:
                    </h3>

                    <ul className="space-y-4 relative z-10">
                        {features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-4 text-gray-300 transform transition-transform hover:translate-x-2 duration-300">
                                <div className="mt-1 bg-[#D4AF37]/20 rounded-full p-1">
                                    <CheckCircle2 size={16} className="text-[#D4AF37]" strokeWidth={3} />
                                </div>
                                <span className="text-sm sm:text-base leading-relaxed">{feat}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
                <button
                    onClick={handleUpgradeClick}
                    className="flex-1 sm:flex-none justify-center bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-500 hover:to-yellow-400 text-black px-8 py-4 rounded-xl font-bold shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_10px_40px_rgba(212,175,55,0.5)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                >
                    <Crown size={20} strokeWidth={2.5} />
                    Fazer Upgrade Agora
                    <ChevronRight size={18} strokeWidth={3} />
                </button>
            </div>

            <p className="relative z-10 mt-6 text-sm font-medium text-gray-500 uppercase tracking-widest">
                Upgrade rápido • Sem perda de dados • Suporte VIP
            </p>
        </div>
    );
};

export default UpgradePrompt;
