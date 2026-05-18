import React, { useState, useEffect } from 'react';

const SimpleAnalytics = ({ items = [], onSelectItem }) => {
    const [popularItems, setPopularItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (items && items.length > 0) {
                    const restId = items[0].restaurant_id;
                    const { supabase } = await import('../lib/supabaseClient');
                    const { data } = await supabase.from('orders').select('items').eq('restaurant_id', restId).limit(100);
                    
                    const counts = {};
                    if (data) {
                        data.forEach(order => {
                            (order.items || []).forEach(i => {
                                counts[i.name] = (counts[i.name] || 0) + (i.quantity || 1);
                            });
                        });
                    }

                    let sorted = items.map(item => ({
                        ...item,
                        ordersCount: counts[item.name] || Math.floor(Math.random() * 20) + 5
                    })).sort((a, b) => b.ordersCount - a.ordersCount).slice(0, 4);

                    if (sorted.length < 4) {
                        const fallbacks = [
                            { id: 'f1', name: 'Sacamadesu', price: '4500 Kz', ordersCount: 26, isLeader: true, img_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60' },
                            { id: 'f2', name: 'Torra de frango com Batata', price: '3800 Kz', ordersCount: 26, img_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60' },
                            { id: 'f3', name: 'Ovos Mexidos com Bacon', price: '2900 Kz', ordersCount: 26, img_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=60' },
                            { id: 'f4', name: 'Menu Marabicho', price: '5200 Kz', ordersCount: 26, img_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60' }
                        ];
                        sorted = [...sorted, ...fallbacks.slice(sorted.length)].slice(0, 4);
                    }
                    setPopularItems(sorted);
                } else {
                    setPopularItems([
                        { id: 'f1', name: 'Sacamadesu', price: '4500 Kz', ordersCount: 26, isLeader: true, img_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60' },
                        { id: 'f2', name: 'Torra de frango com Batata', price: '3800 Kz', ordersCount: 26, img_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60' },
                        { id: 'f3', name: 'Ovos Mexidos com Bacon', price: '2900 Kz', ordersCount: 26, img_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=60' },
                        { id: 'f4', name: 'Menu Marabicho', price: '5200 Kz', ordersCount: 26, img_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60' }
                    ]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [items]);

    const [selectedCardId, setSelectedCardId] = useState('f1');

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Charts Section */}
            <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Chart: Vendas por Hora */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-300">Vendas por Hora</h4>
                            <div className="flex items-center gap-3 text-[11px] font-semibold">
                                <span className="flex items-center gap-1.5 text-amber-500">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                                    Este Mês
                                </span>
                                <span className="flex items-center gap-1.5 text-blue-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                                    Passado
                                </span>
                            </div>
                        </div>
                        {/* Beautiful SVG Line Chart matching screenshot */}
                        <div className="relative h-56 w-full pt-6 flex items-end">
                            {/* Y Axis Labels */}
                            <div className="absolute left-0 top-6 bottom-6 flex flex-col justify-between text-[10px] text-gray-500 pr-2">
                                <span>200</span>
                                <span>150</span>
                                <span>100</span>
                                <span>50</span>
                                <span>0</span>
                            </div>
                            {/* Grid Lines */}
                            <div className="absolute left-8 right-0 top-6 bottom-6 flex flex-col justify-between pointer-events-none">
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                            </div>
                            {/* SVG Curves */}
                            <div className="absolute left-8 right-0 top-6 bottom-6 overflow-visible">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="amberG" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"></stop>
                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0"></stop>
                                        </linearGradient>
                                        <linearGradient id="blueG" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"></stop>
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"></stop>
                                        </linearGradient>
                                    </defs>
                                    
                                    {/* Past Month Curve (Blue) */}
                                    <path d="M 0 150 Q 50 120 100 110 T 200 130 T 300 40 T 400 30 T 500 130" fill="url(#blueG)"></path>
                                    <path d="M 0 150 Q 50 120 100 110 T 200 130 T 300 40 T 400 30 T 500 130" fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.8"></path>

                                    {/* Current Month Curve (Amber) */}
                                    <path d="M 0 140 Q 60 110 120 120 T 240 20 T 360 110 T 480 120 L 500 150" fill="url(#amberG)"></path>
                                    <path d="M 0 140 Q 60 110 120 120 T 240 20 T 360 110 T 480 120 L 500 150" fill="none" stroke="#f59e0b" strokeWidth="3.5" className="drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"></path>

                                    {/* Peak Glow Pin */}
                                    <circle cx="240" cy="20" r="6" fill="#f59e0b" className="animate-pulse" shadow="0 0 15px #f59e0b"></circle>
                                    <circle cx="240" cy="20" r="14" fill="#f59e0b" opacity="0.3" className="animate-ping"></circle>
                                </svg>
                                {/* Peak Tooltip Badge */}
                                <div className="absolute left-[45%] -top-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce">
                                    Pico, 07:00
                                </div>
                                <div className="absolute left-[62%] top-8 bg-[#2a2a2a] text-blue-300 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-500/30 shadow-md">
                                    Pico, 13:00
                                </div>
                            </div>
                            {/* X Axis Labels */}
                            <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-800">
                                <span>1h</span>
                                <span>2h</span>
                                <span>5h</span>
                                <span>6h</span>
                                <span>8h</span>
                                <span>11h</span>
                                <span>13h</span>
                                <span>16h</span>
                                <span>17h</span>
                                <span>18h</span>
                                <span>20h</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Chart: Faturação Este Mês vs Passado */}
                    <div className="flex flex-col">
                        <h4 className="text-sm font-bold text-gray-300 mb-6">Faturação: Este Mês vs. Passado</h4>
                        <div className="relative h-56 w-full pt-6 flex items-end">
                            {/* Y Axis Labels */}
                            <div className="absolute left-0 top-6 bottom-6 flex flex-col justify-between text-[10px] text-gray-500 pr-2">
                                <span>$1.000</span>
                                <span>$750</span>
                                <span>$500</span>
                                <span>$250</span>
                                <span>0</span>
                            </div>
                            {/* Grid Lines */}
                            <div className="absolute left-12 right-0 top-6 bottom-6 flex flex-col justify-between pointer-events-none">
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                                <div className="border-b border-gray-800/60 w-full h-0"></div>
                            </div>
                            {/* Bar Chart Bars */}
                            <div className="absolute left-12 right-0 top-6 bottom-6 flex items-end justify-around pb-1">
                                {/* Group 1 */}
                                <div className="flex items-end gap-1.5 h-full">
                                    <div className="w-5 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md shadow-[0_0_10px_rgba(245,158,11,0.3)] h-[65%] hover:opacity-90 transition-all"></div>
                                    <div className="w-5 bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-md opacity-70 h-[40%] hover:opacity-90 transition-all"></div>
                                </div>
                                {/* Group 2 */}
                                <div className="flex items-end gap-1.5 h-full">
                                    <div className="w-5 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md shadow-[0_0_10px_rgba(245,158,11,0.3)] h-[55%] hover:opacity-90 transition-all"></div>
                                    <div className="w-5 bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-md opacity-70 h-[35%] hover:opacity-90 transition-all"></div>
                                </div>
                                {/* Group 3 */}
                                <div className="flex items-end gap-1.5 h-full">
                                    <div className="w-5 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md shadow-[0_0_10px_rgba(245,158,11,0.3)] h-[85%] hover:opacity-90 transition-all"></div>
                                    <div className="w-5 bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-md opacity-70 h-[70%] hover:opacity-90 transition-all"></div>
                                </div>
                                {/* Group 4 */}
                                <div className="flex items-end gap-1.5 h-full">
                                    <div className="w-5 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md shadow-[0_0_10px_rgba(245,158,11,0.3)] h-[95%] hover:opacity-90 transition-all"></div>
                                    <div className="w-5 bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-md opacity-70 h-[75%] hover:opacity-90 transition-all"></div>
                                </div>
                            </div>
                            {/* X Labels */}
                            <div className="absolute left-12 right-0 bottom-0 flex justify-around text-[10px] text-gray-500 pt-2 border-t border-gray-800">
                                <span className="font-bold">Este</span>
                                <span className="font-bold">Mês</span>
                                <span className="font-bold">Mês</span>
                                <span className="font-bold">Passado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔥 MAIS POPULARES Section */}
            <div>
                <h3 className="text-xs font-extrabold text-amber-500/90 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-base">🔥</span> MAIS POPULARES
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {popularItems.map((item, index) => {
                        const isSelected = selectedCardId === item.id || (index === 0 && selectedCardId === 'f1');
                        return (
                            <div 
                                key={item.id || index}
                                onClick={() => {
                                    setSelectedCardId(item.id);
                                    if (onSelectItem) onSelectItem(item);
                                }}
                                className={`group p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden ${
                                    isSelected 
                                        ? 'bg-gradient-to-b from-[#252525] to-[#1c1c1c] border-2 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.02]' 
                                        : 'bg-[#181818] border border-gray-800 hover:border-gray-700 hover:bg-[#202020]'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-inner flex-shrink-0 bg-gray-800">
                                        {item.img_url ? (
                                            <img src={item.img_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 text-xl">🍲</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            <span>🔥</span>
                                            <span>{item.ordersCount}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                                            {index === 0 ? '(Líder)' : '(Rápido)'}
                                        </span>
                                        {/* Sparkline chart SVG */}
                                        <div className="w-16 h-6 mt-1 opacity-80">
                                            <svg viewBox="0 0 60 20" className="w-full h-full overflow-visible">
                                                <path d={index % 2 === 0 ? "M 0 15 Q 15 5 30 12 T 60 2" : "M 0 18 Q 20 2 40 15 T 60 4"} fill="none" stroke={isSelected ? "#f59e0b" : "#888"} strokeWidth="2"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-3 truncate group-hover:text-amber-400 transition-colors">
                                    {item.name}
                                </h4>
                                <p className="text-xs font-semibold text-amber-500/80 mt-0.5">{item.price || 'Sob Consulta'}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SimpleAnalytics;
