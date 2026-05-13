import React from 'react';
import { ExternalLink } from 'lucide-react';

const ExpirationModal = ({ isOpen, onClose, restaurant, daysUntilExpiration, onShowPayment }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#1a1a1a] border border-red-500/30 rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-5">
                {/* Warning glow background */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/40 blur-[80px] pointer-events-none"></div>
                
                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                    <span className="text-3xl text-red-500">⚠️</span>
                </div>

                <h2 className="text-2xl font-black text-center text-white mb-2">Renovação de Licença</h2>
                <p className="text-center text-gray-300 text-sm mb-6">
                    Informamos que a sua subscrição da plataforma Jindungo para o restaurante <strong className="text-white">{restaurant?.name}</strong> expira em <strong className="text-red-400 font-black text-lg">{daysUntilExpiration} {daysUntilExpiration === 1 ? 'dia' : 'dias'}</strong>.
                </p>

                <div className="bg-black/50 border border-white/10 rounded-2xl p-5 mb-8">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Como Renovar</p>
                    <div className="space-y-4">
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                            <p className="text-sm text-gray-300">Faça o pagamento via Multicaixa Express ou Depósito Bancário para o IBAN: <br /><strong className="text-[#D4AF37] font-mono tracking-wider">AO06 0000 0000 0000 0000 0</strong></p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                            <p className="text-sm text-gray-300">Envie o comprovativo para o nosso suporte no WhatsApp.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <a
                        href={`https://wa.me/244900000000?text=Olá, o meu restaurante (${restaurant?.name}) vai expirar em ${daysUntilExpiration} dias. Venho renovar a licença.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 group"
                        onClick={() => {
                            sessionStorage.setItem('expiration_acknowledged', 'true');
                            onClose();
                        }}
                    >
                        Falar com o Suporte e Renovar <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    <button
                        onClick={() => {
                            onClose();
                            onShowPayment();
                        }}
                        className="w-full bg-[#D4AF37] hover:bg-[#AA8B2C] text-black font-black py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
                    >
                        Pagar com MCX (Automático)
                    </button>
                    <button
                        onClick={() => {
                            sessionStorage.setItem('expiration_acknowledged', 'true');
                            onClose();
                        }}
                        className="w-full bg-transparent text-gray-400 hover:text-white py-3 font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                        Lembrar-me mais tarde
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpirationModal;
