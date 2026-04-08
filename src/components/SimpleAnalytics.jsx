import React, { useMemo } from 'react';

const SimpleAnalytics = ({ items = [] }) => {
    const [realData, setRealData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!items || items.length === 0) return;
        const fetchPopularItems = async () => {
            const restId = items[0].restaurant_id;
            if (!restId) return;
            try {
                const { supabase } = await import('../lib/supabaseClient');
                // Fetch last 50 orders
                const { data } = await supabase.from('orders').select('items').eq('restaurant_id', restId).order('created_at', { ascending: false }).limit(50);
                
                const freqs = {};
                if (data) {
                    data.forEach(order => {
                        (order.items || []).forEach(i => {
                            freqs[i.name] = (freqs[i.name] || 0) + (i.quantity || 1);
                        });
                    });
                }
                
                // Map frequencies to provided items
                let computed = items.map(item => ({
                    name: item.name,
                    views: freqs[item.name] || 0
                })).sort((a, b) => b.views - a.views).slice(0, 5);

                // Fallback for fresh instances so UI isn't empty
                if (computed.every(c => c.views === 0)) {
                    computed = items.slice(0, 5).map(item => ({ name: item.name, views: 0 }));
                }

                setRealData(computed);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPopularItems();
    }, [items]);

    const maxViews = Math.max(1, ...realData.map(d => d.views));

    return (
        <div className="bg-white/90 dark:bg-[#141414]/90 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                🔥 Mais Populares
            </h4>
            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="text-sm text-gray-400 animate-pulse">A calcular estatísticas reais...</div>
                ) : realData.map((d, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm">
                        <span className="w-1/3 truncate text-gray-800 dark:text-gray-200 font-medium font-serif">
                            {d.name}
                        </span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${(d.views / maxViews) * 100}%`
                                }}
                            />
                        </div>
                        <span className="w-12 text-right font-bold text-primary">{d.views} <span className="text-[10px] text-gray-400">pedidos</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimpleAnalytics;
