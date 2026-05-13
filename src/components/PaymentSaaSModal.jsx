import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { CreditCard, Smartphone, X } from 'lucide-react';

const PaymentSaaSModal = ({ isOpen, onClose, restaurant }) => {
    const [phone, setPhone] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (!phone || phone.length < 9) {
            return toast.error("Por favor, introduza um número de telemóvel válido.");
        }

        setIsProcessing(true);
        toast.loading("A contactar Multicaixa Express...", { id: 'mcx-saas' });

        try {
            const { data, error } = await supabase.functions.invoke('process-payment', {
                body: {
                    amount: 35000, // Preço fixo da assinatura mensal (exemplo)
                    phone: phone,
                    restaurant_id: restaurant.id,
                    is_subscription: true,
                }
            });

            if (error || data?.error) {
                toast.error(data?.error || "Erro ao contactar o provedor de pagamento.", { id: 'mcx-saas' });
                setIsProcessing(false);
                return;
            }

            toast.success("Abra a sua App Multicaixa Express ou consulte o SMS para confirmar a renovação do Menús Jindungo!", { id: 'mcx-saas', duration: 10000 });
            
            // Aqui normalmente haveria um polling para saber quando foi pago com sucesso
            // Mas o Webhook "webhook-subscription" irá atualizar a BD em background.
            // O ideal é assinar canais postgres para a tabela 'restaurants' e fechar o modal.
            onClose();

        } catch (err) {
            toast.error("Erro no processamento.", { id: 'mcx-saas' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-2xl relative text-white">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white"
                >
                    <X size={18} />
                </button>
                
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                    <CreditCard className="text-[#D4AF37]" /> Pagamento Automático
                </h2>
                <p className="text-sm text-gray-400 mb-6">Renovação Mensal Menús Jindungo para <strong>{restaurant?.name}</strong>.</p>
                
                <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Plano Atual:</span>
                        <span className="font-bold text-[#D4AF37]">{restaurant?.plan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Total a Pagar:</span>
                        <span className="font-bold text-xl">35 000 Kz</span>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <Smartphone size={14} /> Nº Telemóvel Associado ao MCX
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 9xx xxx xxx"
                        disabled={isProcessing}
                        className="w-full bg-black/50 border border-white/20 p-4 rounded-xl text-white outline-none focus:border-[#D4AF37] disabled:opacity-50"
                    />
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isProcessing || !phone}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA8B2C] text-black font-black py-4 rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.02]"
                >
                    {isProcessing ? "A processar..." : "Pagar Agora e Renovar"}
                </button>
            </div>
        </div>
    );
};

export default PaymentSaaSModal;
