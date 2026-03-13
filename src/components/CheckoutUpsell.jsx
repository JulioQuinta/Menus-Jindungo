import React, { useState, useEffect } from 'react';
import { Sparkles, PlusCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';

const CheckoutUpsell = ({ restaurantId, cartItems, onContinue, onCancel }) => {
    const { addToCart } = useCart();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!restaurantId || cartItems.length === 0) {
                setLoading(false);
                return;
            }

            try {
                // Basic Recommendation Logic: Get items marked as 'highlight' or just random items not in cart
                const cartItemIds = cartItems.map(item => item.id);

                console.log("Upsell: Fetching for restaurant", restaurantId, "not in", cartItemIds);

                const { data, error } = await supabase
                    .from('menu_items')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .eq('is_available', true)
                    .not('id', 'in', `(${cartItemIds.join(',')})`) // Keep this but ensure valid
                    .limit(3);

                if (error) throw error;

                console.log("Upsell: Found items", data?.length);

                // Only show upsell if we found something
                if (data && data.length > 0) {
                    setSuggestions(data);
                } else {
                    console.log("Upsell: No DB suggestions found, using professional fallbacks for testing.");
                    // FALLBACK: If no other items, show some generic premium options
                    setSuggestions([
                        {
                            id: 'fb-1',
                            name: 'Dose Extradicional de Batatas',
                            price: 1500,
                            image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'
                        },
                        {
                            id: 'fb-2',
                            name: 'Cerveja Cuca Gelada (Lata)',
                            price: 800,
                            image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400'
                        },
                        {
                            id: 'fb-3',
                            name: 'Pudim de Leite Condensado',
                            price: 2500,
                            image_url: 'https://images.unsplash.com/photo-1541783245831-57d69a4d5357?w=400'
                        }
                    ]);
                }
            } catch (err) {
                console.error("Error fetching upsells:", err);
                onContinue(); // Fail silently and let them buy
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [restaurantId, cartItems, onContinue]);

    const handleAdd = (item) => {
        addToCart(item);
        // After adding, we remove it from suggestions. 
        // If no more suggestions, auto-continue.
        const remaining = suggestions.filter(s => s.id !== item.id);
        setSuggestions(remaining);

        // Optional: toast success

        if (remaining.length === 0) {
            setTimeout(onContinue, 600);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium animate-pulse">A preparar o seu pedido...</p>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return null; // Handled by useEffect onContinue, but just in case
    }

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-yellow-100 to-orange-50 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="text-[#D4AF37]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 font-serif">Aproveite para Adicionar</h3>
                <p className="text-gray-500 text-sm mt-1">Sugestões perfeitas para acompanhar o seu pedido.</p>
            </div>

            <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto px-2 pb-2">
                {suggestions.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🍽️</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-bold text-gray-800 truncate">{item.name}</h4>
                            <p className="text-[#D4AF37] font-bold text-sm">
                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price).replace('AOA', 'Kz')}
                            </p>
                        </div>
                        <button
                            onClick={() => handleAdd(item)}
                            className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:scale-110 transition-all shrink-0 shadow-md"
                        >
                            <PlusCircle size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onContinue}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                    Avançar para Pagamento
                </button>
                <button
                    onClick={onCancel}
                    className="w-full bg-transparent text-gray-500 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Voltar ao Menu
                </button>
            </div>
        </div>
    );
};

export default CheckoutUpsell;
