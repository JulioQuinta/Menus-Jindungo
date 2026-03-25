import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MessageSquare, Star, Calendar } from 'lucide-react';

const FeedbackManager = ({ restaurantId }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const fetchFeedbacks = async () => {
            try {
                const { data, error } = await supabase
                    .from('feedbacks')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .order('created_at', { ascending: false })
                    .limit(50);
                
                if (error) throw error;
                setFeedbacks(data || []);
            } catch (err) {
                console.error("Erro ao carregar feedbacks:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedbacks();
    }, [restaurantId]);

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={16}
                        className={star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-600"}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="p-8 text-gray-500 text-center animate-pulse">A carregar avaliações...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in text-white">
            <div className="bg-gradient-to-br from-[#121212] to-black rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                    <MessageSquare className="text-[#D4AF37]" size={28} />
                    Avaliações Privadas
                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-[#D4AF37]/30">Privado</span>
                </h2>
                <p className="text-gray-400 mt-1">O que os seus clientes acham da comida e do serviço.</p>
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden p-6">
                {feedbacks.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-gray-400">
                        <Star size={48} className="text-gray-600 mb-4 opacity-50" />
                        <p className="text-lg font-bold">Ainda sem avaliações</p>
                        <p className="text-sm mt-2 max-w-sm">Quando os clientes derem estrelas no ecrã de Status do Pedido, elas aparecerão aqui em segredo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {feedbacks.map(fb => (
                            <div key={fb.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="font-bold text-gray-200">{fb.customer_name || 'Cliente Anónimo'}</div>
                                    {renderStars(fb.rating)}
                                </div>
                                {fb.comment && (
                                    <p className="text-gray-400 text-sm italic mb-4">"{fb.comment}"</p>
                                )}
                                <div className="text-[10px] text-gray-500 flex items-center gap-1 font-bold mt-auto pt-3 border-t border-white/5">
                                    <Calendar size={12} />
                                    {new Date(fb.created_at).toLocaleString('pt-PT')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackManager;
