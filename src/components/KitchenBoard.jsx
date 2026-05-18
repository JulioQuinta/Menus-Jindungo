import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orderService';
import { Clock, CheckCircle, ChefHat, Truck, XCircle, AlertCircle, Banknote, Printer, Ticket, Smartphone, Volume2, VolumeX, Award, RefreshCw, Bike, Settings2, CheckCheck, Archive, Trash2, ShoppingBag, UserCheck, Phone, User, Star, HelpCircle, Sparkles, MoreHorizontal, ChevronDown, Search, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import TableBillTemplate from './TableBillTemplate';
import { printerService } from '../utils/bluetoothPrinter';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';

const OrderCard = React.memo(({ order, onStatusChange, onPrint, enablePrint, restaurantName }) => {
    const [elapsed, setElapsed] = useState('');
    const [showTimeSelector, setShowTimeSelector] = useState(false);
    const [customMins, setCustomMins] = useState('30');
    const [courierName, setCourierName] = useState('');
    const [courierPhone, setCourierPhone] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const diff = Date.now() - new Date(order.created_at).getTime();
            const minutes = Math.floor(diff / 60000);
            setElapsed(`${minutes} min`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [order.created_at, order.status]);

    const status = (order.status || '').toLowerCase().trim();

    const isDelivery = order.table_number?.includes('Entrega:') || order.order_type === 'delivery';
    const isTakeaway = order.table_number?.includes('Takeaway') || order.order_type === 'takeaway';
    let displayAddress = order.table_number;
    let mapsLink = null;
    let paymentMethod = null;

    if (isDelivery && order.table_number?.includes('Entrega:')) {
        const parts = order.table_number.split('|').map(p => p.trim());
        displayAddress = parts[0].replace('Entrega:', '').trim();
        parts.forEach(part => {
             if (part.startsWith('Maps:')) mapsLink = part.replace('Maps:', '').trim();
             if (part.startsWith('Pgto:')) paymentMethod = part.replace('Pgto:', '').trim();
             if (part.startsWith('Distância:')) displayAddress += ` [${part.replace('Distância:', '').trim()}]`;
             if (part.startsWith('Ref:')) displayAddress += ` (Ref: ${part.replace('Ref:', '').trim()})`;
        });
    } else {
        if (order.table_number?.includes('| Pgto:')) {
            const parts = order.table_number.split('| Pgto:');
            displayAddress = parts[0].trim();
            paymentMethod = parts[1].trim();
        }
    }

    const handleEditTotal = async () => {
        const newTotal = window.prompt(`Total Atual: ${order.total} Kz\nIntroduza o NOVO total (incluindo a taxa de entrega ajustada):`, order.total);
        if (newTotal && !isNaN(newTotal)) {
            try {
                await orderService.updateOrder(order.id, { total: parseFloat(newTotal) });
                toast.success('Valor do pedido atualizado!');
            } catch (err) {
                toast.error('Erro ao atualizar valor.');
            }
        }
    };

    const isPreparing = status === 'preparing' || status === 'preparando';
    const isPending = status === 'pending' || status === 'pendente';
    const isReady = status === 'ready' || status === 'pronto';

    // Obter primeira imagem de item disponível para hero image ou miniaturas
    const itemWithImage = order.items?.find(i => i.img || i.img_url || i.image_url);
    const heroImage = itemWithImage ? (itemWithImage.img || itemWithImage.img_url || itemWithImage.image_url) : null;

    return (
        <div className="bg-[#161616]/95 border border-[#2A2A2A] rounded-[28px] p-5 mb-5 relative overflow-hidden shadow-2xl backdrop-blur-2xl transition-all hover:scale-[1.01] hover:border-[#D4AF37]/30 group/card text-left">
            {/* Ambient Background Glow inside card */}
            <div className={`absolute -right-12 -top-12 w-36 h-36 rounded-full blur-[60px] opacity-15 group-hover/card:opacity-30 transition-opacity ${isPreparing ? 'bg-[#E67E22]' : isReady ? 'bg-[#2ECC71]' : 'bg-[#D4AF37]'}`}></div>
            
            {/* Hero Image no cabeçalho se estiver em preparação */}
            {isPreparing && heroImage && (
                <div className="relative -mx-5 -mt-5 mb-4 h-40 overflow-hidden rounded-t-[28px] border-b border-white/10">
                    <img src={heroImage} alt="Prato em Destaque" className="w-full h-full object-cover brightness-90 group-hover/card:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/40 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-orange-500/30 flex items-center gap-1.5 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                        <span className="text-[11px] font-black tracking-wider text-orange-400 uppercase">⏱️ {elapsed}</span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-500/20 px-2.5 py-0.5 rounded-md border border-orange-500/30">Em Confeção</span>
                            <h4 className="text-xl font-serif font-black text-white leading-tight mt-1 truncate">
                                {isDelivery ? displayAddress : isTakeaway ? 'Recolha ao Balcão' : `#Mesa ${displayAddress}`}
                            </h4>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar: Type & Elapsed Time (se não tiver hero image) */}
            {(!isPreparing || !heroImage) && (
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] tracking-wider uppercase">
                        <Star size={13} className="text-[#D4AF37] fill-[#D4AF37]" />
                        <span>{isDelivery ? 'Entrega ao Domicílio' : isTakeaway ? 'Takeaway / Recolha' : 'Pedido de Sala'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#1C1C1C] border border-[#2A2A2A] px-3 py-1 rounded-full text-xs text-gray-300 font-bold shadow-inner">
                        <Clock size={12} className="text-[#D4AF37]" />
                        <span>{elapsed}</span>
                    </div>
                </div>
            )}

            {/* Table / Customer Info & Waveform (se não tiver hero image) */}
            {(!isPreparing || !heroImage) && (
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h4 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight truncate max-w-[220px]">
                                {isDelivery ? displayAddress : isTakeaway ? 'Recolha ao Balcão' : `#Mesa ${displayAddress}`}
                            </h4>
                            {(isPreparing || isPending) && (
                                <div className="flex items-center gap-1 bg-[#D4AF37]/15 px-2.5 py-1.5 rounded-lg border border-[#D4AF37]/30 shadow-sm" title="Em processamento ativo">
                                    <div className="w-1 bg-[#D4AF37] animate-pulse h-3 rounded-full"></div>
                                    <div className="w-1 bg-[#D4AF37] animate-bounce h-4 rounded-full"></div>
                                    <div className="w-1 bg-[#D4AF37] animate-pulse h-2 rounded-full"></div>
                                    <div className="w-1 bg-[#D4AF37] animate-bounce h-5 rounded-full"></div>
                                    <div className="w-1 bg-[#D4AF37] animate-pulse h-3 rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-medium">{order.customer_name || 'Cliente'}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 font-bold">
                            #{order.id ? order.id.slice(0, 6) : 'ORD'}
                        </span>
                        {parseInt(elapsed) > 30 && isPending && (
                            <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mt-1.5 animate-pulse">Atrasado</span>
                        )}
                    </div>
                </div>
            )}

            {/* Caixa de Logística / Entrega / Estafeta */}
            {(isDelivery || isTakeaway || order.courier_name) && (
                <div className="mb-4 bg-[#1C1C1C] border border-white/10 rounded-2xl p-3 text-xs space-y-1.5 shadow-inner">
                    {isTakeaway && (
                        <div className="flex items-center gap-2 text-amber-400 font-bold">
                            <ShoppingBag size={14} /> Takeaway / Recolha ao Balcão (Estimado: {order.takeaway_time || '30-40 min'})
                        </div>
                    )}
                    {isDelivery && (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-cyan-400 font-bold">
                                <Truck size={14} /> Entrega: {order.delivery_neighborhood || 'Bairro Padrão'}
                            </div>
                            <p className="text-gray-300 font-medium">{order.delivery_address || displayAddress}</p>
                            {order.delivery_reference && (
                                <p className="text-gray-400 text-[11px] italic">📌 Ref: {order.delivery_reference}</p>
                            )}
                        </div>
                    )}
                    {order.courier_name && (
                        <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center text-[11px] text-gray-300">
                            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold"><Bike size={13} /> {order.courier_name}</span>
                            {order.courier_phone && <span className="text-gray-400 font-mono">{order.courier_phone}</span>}
                            {order.dispatched_at && <span className="text-[10px] text-gray-500 font-mono">Despachado às {new Date(order.dispatched_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        </div>
                    )}
                </div>
            )}

            {mapsLink && (
                <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="mb-3 w-full bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/30 font-bold px-3 py-2.5 rounded-lg text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                    Abrir Mapa no GPS <ArrowUpRight size={14} />
                </a>
            )}

            {/* Items List Squircles (Com Miniaturas de Imagem se disponível) */}
            <div className="space-y-2.5 my-4">
                {order.items?.map((item, idx) => {
                    const itemImg = item.img || item.img_url || item.image_url;
                    return (
                        <div key={idx} className="flex items-center gap-3.5 bg-[#1C1C1C]/80 border border-white/5 p-3 rounded-2xl text-sm shadow-sm group/item">
                            {itemImg ? (
                                <img src={itemImg} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#D4AF37]/30 shadow-md group-hover/item:scale-105 transition-all" />
                            ) : (
                                <span className="bg-[#161616] border border-[#D4AF37]/40 text-[#D4AF37] font-black w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-sm">
                                    {item.quantity}
                                </span>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-gray-100 block truncate">{item.name}</span>
                                    {itemImg && (
                                        <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-black px-2 py-0.5 rounded-lg text-xs shrink-0 shadow-sm">
                                            x{item.quantity}
                                        </span>
                                    )}
                                </div>
                                {item.variant_name && <span className="text-[10px] text-[#D4AF37] font-semibold block">↳ {item.variant_name}</span>}
                                {item.notes && <span className="text-[10px] text-orange-400 italic block">Obs: {item.notes}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Caixa de Total / Método de Pagamento */}
            <div className="mb-4 bg-[#1C1C1C]/80 border border-white/5 p-3 rounded-2xl flex justify-between items-center text-xs">
                <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-widest">Total Estimado</span>
                    <span className="text-lg font-serif font-black text-[#D4AF37] leading-none">
                        {new Intl.NumberFormat('pt-AO').format(order.total)} <span className="text-xs text-gray-400">Kz</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {paymentMethod && (
                        <span className="bg-white/10 px-2.5 py-1 rounded-xl text-gray-300 font-bold text-[11px] border border-white/10 flex items-center gap-1">
                            <Banknote size={12} className="text-[#D4AF37]" /> {paymentMethod}
                        </span>
                    )}
                    {(isDelivery || isTakeaway) && (
                        <button 
                            onClick={handleEditTotal}
                            className="bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[#D4AF37] px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-[#D4AF37]/30 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Ajustar taxa ou desconto"
                        >
                            ✨ Ajustar
                        </button>
                    )}
                </div>
            </div>

            {/* Discounts & Rewards */}
            {order.coupon_discount > 0 && (
                <div className="mb-4 text-[10px] font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 flex justify-between items-center tracking-tight">
                    <span className="flex items-center gap-1">
                        <Ticket size={10} /> Cupão: {order.coupon_code}
                    </span>
                    <span>-{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.coupon_discount).replace('AOA', 'Kz')}</span>
                </div>
            )}

            {order.is_loyalty_redemption && (
                <div className="mb-4 text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20 flex justify-between items-center tracking-tight">
                    <span className="flex items-center gap-1">
                        <Award size={10} /> RECOMPENSA FIDELIZAÇÃO
                    </span>
                    <span>{order.loyalty_reward_text}</span>
                </div>
            )}

            {/* Bottom Action Row */}
            <div className="pt-4 border-t border-white/5 mt-4 flex items-center gap-2">
                {isPending && (
                    <>
                        <button
                            onClick={() => onStatusChange(order.id, 'preparing')}
                            className="bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:brightness-110 text-black font-black py-3.5 px-5 rounded-2xl text-xs flex-1 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                        >
                            <ChefHat size={16} /> Atribuir Chef
                        </button>
                        <button onClick={() => onStatusChange(order.id, 'cancelled', 'Cancelado pela Cozinha')} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Cancelar Pedido">
                            <XCircle size={18} />
                        </button>
                        {enablePrint && (
                            <button onClick={() => onPrint(order)} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Imprimir">
                                <Printer size={18} />
                            </button>
                        )}
                    </>
                )}

                {isPreparing && (
                    <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onStatusChange(order.id, 'ready')}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 text-white font-black py-3.5 px-5 rounded-2xl text-xs flex-1 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                            >
                                <CheckCircle size={16} /> Pronto p/ Servir
                            </button>
                            <button onClick={() => onStatusChange(order.id, 'cancelled', 'Cancelado pela Cozinha')} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Cancelar Pedido">
                                <XCircle size={18} />
                            </button>
                            {enablePrint && (
                                <button onClick={() => onPrint(order)} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Imprimir">
                                    <Printer size={18} />
                                </button>
                            )}
                        </div>
                        {/* Avatares dos Chefs Atribuídos */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1.5"><UserCheck size={13} className="text-orange-400" /> Chef Atribuído:</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-bold text-[10px]">C1</div>
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-[10px]">C2</div>
                                <span className="bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all">Alterar ▾</span>
                            </div>
                        </div>
                    </div>
                )}

                {(status === 'ready' || status === 'pronto') && (
                    <div className="flex flex-col gap-2 w-full">
                        {isDelivery ? (
                            <div className="w-full">
                                {!showTimeSelector ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <button
                                            onClick={() => setShowTimeSelector(true)}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex justify-center items-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer"
                                        >
                                            <Bike size={18} /> Despachar Mota
                                        </button>
                                        <button onClick={() => onStatusChange(order.id, 'cancelled', 'Cancelado pela Cozinha')} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Cancelar Pedido">
                                            <XCircle size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-[#1C1C1C] p-4 rounded-2xl border border-cyan-500/30 animate-in zoom-in-95 duration-200">
                                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2 text-center">Atribuir Estafeta & Tempo</p>
                                        
                                        <div className="space-y-2 mb-3 pt-1 border-b border-white/5 pb-3">
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase font-black mb-1">Nome do Estafeta</label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-cyan-400"><User size={12} /></span>
                                                    <input 
                                                        type="text" 
                                                        value={courierName}
                                                        onChange={(e) => setCourierName(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50"
                                                        placeholder="Ex: João Silva ou Estafeta 1"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase font-black mb-1">Telemóvel do Estafeta</label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-cyan-400"><Phone size={12} /></span>
                                                    <input 
                                                        type="text" 
                                                        value={courierPhone}
                                                        onChange={(e) => setCourierPhone(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50"
                                                        placeholder="Ex: +244 923..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2 text-center">Tempo de Entrega?</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[15, 20, 30, 45, 60, 90].map(mins => (
                                                <button
                                                    key={mins}
                                                    onClick={() => {
                                                        const targetEpochMs = Date.now() + mins * 60000;
                                                        onStatusChange(order.id, 'out_for_delivery', targetEpochMs.toString(), {
                                                            courier_name: courierName || 'Estafeta Próprio',
                                                            courier_phone: courierPhone || '',
                                                            dispatched_at: new Date().toISOString()
                                                        });
                                                        setShowTimeSelector(false);
                                                    }}
                                                    className="bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-white py-2.5 rounded-xl text-xs font-black transition-all border border-cyan-500/20 active:scale-95 cursor-pointer"
                                                >
                                                    {mins}'
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="number" 
                                                    value={customMins}
                                                    onChange={(e) => setCustomMins(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50"
                                                    placeholder="Outros min..."
                                                />
                                                <button
                                                    onClick={() => {
                                                        const val = parseInt(customMins);
                                                        if (val > 0) {
                                                            const targetEpochMs = Date.now() + val * 60000;
                                                            onStatusChange(order.id, 'out_for_delivery', targetEpochMs.toString(), {
                                                                courier_name: courierName || 'Estafeta Próprio',
                                                                courier_phone: courierPhone || '',
                                                                dispatched_at: new Date().toISOString()
                                                            });
                                                            setShowTimeSelector(false);
                                                        }
                                                    }}
                                                    className="bg-cyan-500 text-black px-4 rounded-xl font-bold text-xs hover:brightness-110 cursor-pointer"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setShowTimeSelector(false)}
                                            className="w-full mt-3 text-[9px] text-gray-500 hover:text-white uppercase font-bold tracking-[0.2em] cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full">
                                <button
                                    onClick={() => onStatusChange(order.id, 'delivered')}
                                    className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-2 border-[#3B82F6] text-blue-300 font-bold py-3.5 px-5 rounded-2xl flex-1 flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(59,130,246,0.6)] animate-pulse hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                                >
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400 shrink-0">
                                        <CheckCheck size={14} />
                                    </div>
                                    <span className="text-xs sm:text-sm tracking-wide font-black">Finalizar Pedido (Entregue)</span>
                                </button>
                                <button onClick={() => onStatusChange(order.id, 'cancelled', 'Cancelado pela Cozinha')} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Cancelar Pedido">
                                    <XCircle size={20} />
                                </button>
                                {enablePrint && (
                                    <button onClick={() => onPrint(order)} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Imprimir">
                                        <Printer size={20} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {(status === 'paid' || status === 'pago') && (
                    <div className="flex items-center gap-2 w-full">
                        <button
                            onClick={() => onStatusChange(order.id, 'delivered')}
                            className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-2 border-[#3B82F6] text-blue-300 font-bold py-3.5 px-5 rounded-2xl flex-1 flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(59,130,246,0.6)] animate-pulse hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        >
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400 shrink-0">
                                <CheckCheck size={14} />
                            </div>
                            <span className="text-xs sm:text-sm tracking-wide font-black">Finalizar Pedido (Entregue)</span>
                        </button>
                        <button onClick={() => onStatusChange(order.id, 'cancelled', 'Cancelado pela Cozinha')} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Cancelar Pedido">
                            <XCircle size={20} />
                        </button>
                        {enablePrint && (
                            <button onClick={() => onPrint(order)} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Imprimir">
                                <Printer size={20} />
                            </button>
                        )}
                    </div>
                )}

                {(status === 'out_for_delivery') && (
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const motoboyUrl = `${window.location.origin}/delivery/${order.id}`;
                                    navigator.clipboard.writeText(motoboyUrl);
                                    toast.success('Link do Motoboy copiado!');
                                }}
                                className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 py-3 rounded-2xl font-bold text-xs flex justify-center items-center gap-2 transition-all uppercase cursor-pointer"
                            >
                                <Bike size={14} /> Link da App (Estafeta)
                            </button>
                            <button
                                onClick={() => onStatusChange(order.id, 'arrived')}
                                className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 py-3 rounded-2xl font-bold text-xs flex justify-center items-center gap-2 transition-all uppercase cursor-pointer"
                            >
                                🔔 Estafeta Chegou
                            </button>
                            <button onClick={() => onStatusChange(order.id, 'cancelled', 'Cancelado pela Cozinha')} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Cancelar Pedido">
                                <XCircle size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {(status === 'arrived') && (
                    <div className="flex flex-col gap-2 w-full">
                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-3 mb-1 text-center animate-pulse">
                            <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                <Bike size={14}/> À PORTA DO CLIENTE!
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                            <button
                                onClick={() => onStatusChange(order.id, 'delivered')}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:brightness-110 text-white py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-green-500/25 cursor-pointer"
                            >
                                <CheckCircle size={16} /> Entregue c/ Sucesso (Pago)
                            </button>
                            <button onClick={() => onStatusChange(order.id, 'cancelled', 'Cancelado pela Cozinha')} className="w-12 h-12 bg-[#1C1C1C] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0" title="Cancelar Pedido">
                                <XCircle size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {order.customer_phone && (status === 'ready' || status === 'pronto' || status === 'out_for_delivery' || status === 'arrived') && (
                <button
                    onClick={() => {
                        let message = `Olá ${order.customer_name || ''}! Atualização do seu pedido: `;
                        if (status === 'ready' || status === 'pronto') message += `Já está pronto! 🍽️`;
                        else if (status === 'out_for_delivery') message += `Saiu para entrega! 🛵`;
                        else if (status === 'arrived') message += `Chegámos à sua porta! 🛵💨`;
                        
                        let phone = order.customer_phone.replace(/\D/g, '');
                        if (phone.length === 9) phone = '244' + phone;
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="w-full bg-green-500/10 border border-green-500/30 text-green-400 py-2.5 rounded-2xl font-bold text-[10px] flex justify-center items-center gap-2 hover:bg-green-500/20 transition-all uppercase mt-3 cursor-pointer shadow-sm"
                >
                    <Smartphone size={14} /> Avisar no WhatsApp
                </button>
            )}
        </div>
    );
});

const KitchenBoard = ({ restaurantId, config, restaurantName }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [printingOrder, setPrintingOrder] = useState(null);
    const [isBluetoothReady, setIsBluetoothReady] = useState(false);
    const [autoPrint, setAutoPrint] = useState(false);
    
    // Novos estados para a reestruturação estética
    const [searchQuery, setSearchQuery] = useState('');
    const [showAIPanel, setShowAIPanel] = useState(false);

    // Initial check for Bluetooth printer on component mount
    useEffect(() => {
        setIsBluetoothReady(printerService.isConnected());
    }, []);

    const toggleAudio = () => {
        setIsAudioEnabled(prev => !prev);
        if (!isAudioEnabled) {
            toast.success('Alertas sonoros ativados!');
            const sound = new Audio('/bell.mp3');
            sound.play().catch(() => {});
        } else {
            toast('Alertas sonoros desativados.', { icon: '🔇' });
        }
    };

    const toggleBluetoothPrinter = async () => {
        try {
            if (isBluetoothReady && printerService.type === 'bluetooth') {
                await printerService.disconnect();
                setIsBluetoothReady(false);
                toast('Impressora Bluetooth Desconectada', { icon: '🔌' });
            } else {
                toast.loading('A conectar Bluetooth...', { id: 'bt' });
                await printerService.connectBluetooth();
                setIsBluetoothReady(true);
                toast.success('Bluetooth Conectado com Sucesso!', { id: 'bt' });
            }
        } catch (error) {
            toast.error('Erro de conexão Bluetooth: ' + error.message, { id: 'bt' });
            setIsBluetoothReady(false);
        }
    };

    const toggleUSBPrinter = async () => {
        try {
            if (isBluetoothReady && printerService.type === 'usb') {
                await printerService.disconnect();
                setIsBluetoothReady(false);
                toast('Impressora USB Desconectada', { icon: '🔌' });
            } else {
                toast.loading('A conectar USB...', { id: 'usb' });
                await printerService.connectUSB();
                setIsBluetoothReady(true);
                toast.success('USB Conectado com Sucesso!', { id: 'usb' });
            }
        } catch (error) {
            toast.error('Erro de conexão USB: ' + error.message, { id: 'usb' });
            setIsBluetoothReady(false);
        }
    };

    const handleTestPrint = async () => {
        if (!isBluetoothReady) {
             toast.error('Nenhuma impressora conectada!');
             return;
        }
        try {
            toast.loading('A imprimir teste...', { id: 'test-print' });
            await printerService.sendText("\x1B\x40\x1B\x61\x01\x1B\x21\x30TESTE JINDUNGO\n\x1B\x21\x00\nImpressora OK!\x0A\x0A\x0A\x0A\x1D\x56\x41");
            toast.success('Teste Concluido!', { id: 'test-print' });
        } catch (error) {
            toast.error('Erro no teste: ' + error.message, { id: 'test-print' });
        }
    };

    const handlePrintOrder = async (order) => {
        if (isBluetoothReady && printerService.isConnected()) {
            try {
                toast.loading('A Imprimir...', { id: 'print' });
                await printerService.printOrder(order, restaurantName);
                toast.success('Talão Impresso!', { id: 'print' });
            } catch {
                toast.error('Erro na impressão Bluetooth. Modificando para fallback visual.', { id: 'print' });
                // Fallback on fail
                setPrintingOrder(order);
                setTimeout(() => window.print(), 100);
            }
            return;
        }

        // Fallback genérico visual (Window.print)
        setPrintingOrder(order);
        // Wait for state to update and React to render the printable area
        setTimeout(() => {
            window.print();
        }, 100);
    };

    useRealtimeOrders(restaurantId, (newOrder) => {
        if (autoPrint && isBluetoothReady) {
            setTimeout(() => {
                handlePrintOrder(newOrder);
            }, 1000);
        }
    });

    useEffect(() => {
        if (!restaurantId) return;

        const loadOrders = async () => {
            const { data } = await orderService.getActiveOrders(restaurantId);
            setOrders(prev => {
                const newIds = new Set(prev.map(o => o.id));
                const combined = [...prev, ...data.filter(o => !newIds.has(o.id))];
                return combined;
            });
            setLoading(false);
        };
        loadOrders();

        const channel = orderService.subscribeToOrders(restaurantId, (payload) => {
            console.log('Realtime State Update:', payload.eventType, payload.new?.id);
            
            if (payload.eventType === 'INSERT') {
                setOrders(prev => {
                    if (prev.find(o => o.id === payload.new.id)) return prev;
                    return [payload.new, ...prev];
                });
            } else if (payload.eventType === 'UPDATE') {
                setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
            } else if (payload.eventType === 'DELETE') {
                setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    const handleStatusUpdate = async (id, status, reason = null, extraData = {}) => {
        const previousOrders = [...orders];

        setOrders(prev => prev.map(o => o.id === id ? { ...o, status, rejection_reason: reason, ...extraData } : o));

        const toastId = toast.loading('A atualizar pedido...');

        try {
            await orderService.updateOrderStatus(id, status, reason, extraData);
            toast.success('Pedido atualizado!', { id: toastId });
        } catch (error) {
            console.error('Falha ao atualizar pedido:', error);
            setOrders(previousOrders);
            toast.error('Erro ao atualizar: ' + (error.message || 'Verifique a ligação'), { id: toastId });
        }
    };

    // Filtragem de Pedidos com a Pesquisa
    const filteredOrders = orders.filter(o => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase().trim();
        const customerMatch = (o.customer_name || '').toLowerCase().includes(q);
        const tableMatch = (o.table_number || '').toLowerCase().includes(q);
        const itemsMatch = o.items?.some(item => (item.name || '').toLowerCase().includes(q));
        return customerMatch || tableMatch || itemsMatch;
    });

    const pendingOrders = filteredOrders.filter(o => {
        const s = (o.status || '').toLowerCase().trim();
        return s === 'pending' || s === 'pendente';
    });
    const preparingOrders = filteredOrders.filter(o => {
        const s = (o.status || '').toLowerCase().trim();
        return s === 'preparing' || s === 'preparando';
    });
    const readyOrders = filteredOrders.filter(o => {
        const s = (o.status || '').toLowerCase().trim();
        return s === 'ready' || s === 'pronto' || s === 'paid' || s === 'pago' || s === 'out_for_delivery' || s === 'arrived';
    });
    const deliveredOrders = filteredOrders.filter(o => {
        const s = (o.status || '').toLowerCase().trim();
        return s === 'delivered' || s === 'entregue' || s === 'cancelled' || s === 'cancelado';
    });

    if (loading) return <div className="p-8 text-gray-500 font-bold">Carregando quadro de cozinha...</div>;

    return (
        <>
        <div className="h-full flex flex-col p-4 sm:p-6 bg-[#0E0E0E] text-white overflow-hidden relative print:hidden min-h-screen">
            {/* Top Bar / Status Pills */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400">WORKSPACE &gt; PEDIDOS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Cozinha Digital</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Loja Aberta
                    </span>
                    <button 
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className={`border px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${showAIPanel ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/10'}`}
                    >
                        <Sparkles size={13} className={showAIPanel ? 'text-black' : 'text-[#D4AF37]'} /> 
                        <span>JINDUNGO AI ✦</span>
                    </button>
                </div>
            </div>

            {/* Header Area com Título e Ações */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-serif font-black text-white tracking-tight flex items-center gap-3 bg-gradient-to-r from-white via-amber-100 to-[#D4AF37] bg-clip-text text-transparent">
                        Cozinha: {restaurantName}
                    </h2>
                    <p className="text-gray-400 text-xs uppercase font-semibold tracking-widest mt-1 flex items-center gap-2">
                        <span>Quadro de Pedidos ao Vivo (Kanban)</span>
                        <span className="text-[#D4AF37]">● {orders.length} Pedidos Ativos</span>
                    </p>
                </div>
                
                {/* Header Action Pills */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={toggleAudio}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
                            isAudioEnabled 
                                ? 'bg-green-950/40 text-green-400 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                                : 'bg-[#161616] text-gray-400 border-white/5 hover:border-white/20'
                        }`}
                        title="Alternar alertas sonoros"
                    >
                        {isAudioEnabled ? <Volume2 size={16} className="text-green-400 animate-pulse" /> : <VolumeX size={16} />}
                        <span>Som {isAudioEnabled ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                        onClick={toggleBluetoothPrinter}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
                            isBluetoothReady && printerService.type === 'bluetooth'
                                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                                : 'bg-[#161616] text-gray-400 border-white/5 hover:border-white/20'
                        }`}
                        title="Conectar impressora Bluetooth"
                    >
                        <Printer size={16} className={isBluetoothReady && printerService.type === 'bluetooth' ? 'text-[#D4AF37]' : ''} />
                        <span className="hidden sm:inline">Bluetooth</span> {isBluetoothReady && printerService.type === 'bluetooth' ? 'ON' : 'OFF'}
                    </button>

                    <button
                        onClick={toggleUSBPrinter}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
                            isBluetoothReady && printerService.type === 'usb'
                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                                : 'bg-[#161616] text-gray-400 border-white/5 hover:border-white/20'
                        }`}
                        title="Conectar impressora USB"
                    >
                        <Printer size={16} className={isBluetoothReady && printerService.type === 'usb' ? 'text-cyan-400' : ''} />
                        <span className="hidden sm:inline">USB</span> {isBluetoothReady && printerService.type === 'usb' ? 'ON' : 'OFF'}
                    </button>

                    {isBluetoothReady && (
                        <button
                            onClick={handleTestPrint}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-all border border-white/10 flex items-center gap-2 cursor-pointer active:scale-95"
                            title="Imprimir página de teste"
                        >
                            <Settings2 size={16} /> Testar
                        </button>
                    )}

                    <button
                        onClick={() => setAutoPrint(!autoPrint)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
                            autoPrint 
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                                : 'bg-[#161616] text-gray-400 border-white/5 hover:border-white/20'
                        }`}
                        title="Impressão automática de novos pedidos"
                    >
                        <span>Auto-Print {autoPrint ? 'ON' : 'OFF'}</span>
                    </button>
                </div>
            </div>

            {/* 3 Top Dash Cards (Estatísticas Premium em Noir & Gold) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div className="bg-[#161616]/90 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-[#D4AF37]/10 blur-[40px] group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-[#D4AF37] flex items-center gap-2">
                            <ShoppingBag size={15} /> Total de Pedidos
                        </span>
                        <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2.5 py-1 rounded-full border border-[#D4AF37]/20 font-bold">Hoje</span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-4 relative z-10">
                        <span className="text-4xl sm:text-5xl font-serif font-black text-white leading-none">{orders.length}</span>
                        <span className="text-xs font-bold text-green-400 flex items-center gap-1">▲ 100% Ativos</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium relative z-10">Todos os pedidos processados hoje</p>
                </div>

                <div className="bg-[#161616]/90 border border-cyan-500/30 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-cyan-500/10 blur-[40px] group-hover:bg-cyan-500/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400 flex items-center gap-2">
                            <ChefHat size={15} /> Confirmados / Em Preparo
                        </span>
                        <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/20 font-bold">Na Grelha</span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-4 relative z-10">
                        <span className="text-4xl sm:text-5xl font-serif font-black text-white leading-none">{preparingOrders.length}</span>
                        <span className="text-xs font-bold text-cyan-400">Em Confeção</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium relative z-10">Em andamento na cozinha</p>
                </div>

                <div className="bg-[#161616]/90 border border-orange-500/30 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-orange-500/10 blur-[40px] group-hover:bg-orange-500/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-orange-400 flex items-center gap-2">
                            <Clock size={15} /> Pendentes Hoje
                        </span>
                        <span className="text-xs bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/20 font-bold">Aguardam</span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-4 relative z-10">
                        <span className="text-4xl sm:text-5xl font-serif font-black text-white leading-none">{pendingOrders.length}</span>
                        {pendingOrders.length > 0 && (
                            <span className="text-xs font-bold text-red-400 animate-pulse flex items-center gap-1">● Requer Ação</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium relative z-10">Aguardam confirmação ou chef</p>
                </div>
            </div>

            {/* Barra de Pesquisa e Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between bg-[#161616] border border-white/5 p-4 rounded-3xl shadow-inner">
                <div className="relative w-full sm:w-80">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Search size={16} /></span>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar mesa, cliente ou prato..."
                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className="text-xs text-gray-400 hidden lg:inline">Filtro rápido:</span>
                    <button 
                        onClick={() => setSearchQuery('')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${!searchQuery ? 'bg-[#D4AF37] text-black shadow-md' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Todos ({orders.length})
                    </button>
                    <button 
                        onClick={() => setSearchQuery('Entrega')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${searchQuery === 'Entrega' ? 'bg-cyan-500 text-black shadow-md' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Entregas
                    </button>
                    <button 
                        onClick={() => setSearchQuery('Takeaway')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${searchQuery === 'Takeaway' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Takeaway
                    </button>
                </div>
            </div>

            {/* Main Content Area (Kanban Columns + Floating AI Drawer) */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Kanban Columns */}
                {orders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 my-12">
                        <ChefHat size={64} className="mb-4 opacity-40 text-[#D4AF37]" />
                        <p className="font-serif text-xl text-gray-300 font-bold">Nenhum pedido ativo na cozinha no momento.</p>
                        <p className="text-xs text-gray-500 mt-2">Os novos pedidos aparecerão aqui instantaneamente.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-row gap-5 h-full min-h-0 overflow-x-auto snap-x snap-mandatory pb-4 px-2 custom-scrollbar">
                        {/* Column 1: Pendentes */}
                        <div className="w-[85vw] sm:w-[350px] lg:w-[370px] shrink-0 snap-center bg-gradient-to-b from-[#D4AF37]/25 via-[#D4AF37]/5 to-[#121212]/95 rounded-[32px] p-5 flex flex-col h-full min-h-0 border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all duration-700"></div>
                            <div className="flex items-center justify-between mb-5 z-10">
                                <div className="flex items-center gap-2 text-[#D4AF37] font-bold uppercase tracking-wider text-xs">
                                    <HelpCircle size={16} className="text-[#D4AF37]" />
                                    <span>Pendentes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-black px-3 py-1 rounded-xl border border-[#D4AF37]/30 shadow-sm">{pendingOrders.length}</span>
                                    <MoreHorizontal size={16} className="text-gray-400 cursor-pointer hover:text-white" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                                {pendingOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} restaurantName={restaurantName} />
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Preparando */}
                        <div className="w-[85vw] sm:w-[350px] lg:w-[370px] shrink-0 snap-center bg-gradient-to-b from-[#E67E22]/25 via-[#E67E22]/5 to-[#121212]/95 rounded-[32px] p-5 flex flex-col h-full min-h-0 border border-[#E67E22]/40 shadow-[0_0_50px_rgba(230,126,34,0.15)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-700"></div>
                            <div className="flex items-center justify-between mb-5 z-10">
                                <div className="flex items-center gap-2 text-[#E67E22] font-bold uppercase tracking-wider text-xs">
                                    <ChefHat size={16} className="text-[#E67E22]" />
                                    <span>Em Preparação</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-[#E67E22]/20 text-[#E67E22] text-xs font-black px-3 py-1 rounded-xl border border-[#E67E22]/30 shadow-sm">{preparingOrders.length}</span>
                                    <MoreHorizontal size={16} className="text-gray-400 cursor-pointer hover:text-white" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                                {preparingOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} restaurantName={restaurantName} />
                                ))}
                            </div>
                        </div>

                        {/* Column 3: Prontos */}
                        <div className="w-[85vw] sm:w-[350px] lg:w-[370px] shrink-0 snap-center bg-gradient-to-b from-[#2ECC71]/25 via-[#2ECC71]/5 to-[#121212]/95 rounded-[32px] p-5 flex flex-col h-full min-h-0 border border-[#2ECC71]/40 shadow-[0_0_50px_rgba(46,204,113,0.15)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-green-500/20 transition-all duration-700"></div>
                            <div className="flex items-center justify-between mb-5 z-10">
                                <div className="flex items-center gap-2 text-[#2ECC71] font-bold uppercase tracking-wider text-xs">
                                    <CheckCheck size={16} className="text-[#2ECC71]" />
                                    <span>Prontos p/ Servir</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-[#2ECC71]/20 text-[#2ECC71] text-xs font-black px-3 py-1 rounded-xl border border-[#2ECC71]/30 shadow-sm">{readyOrders.length}</span>
                                    <MoreHorizontal size={16} className="text-gray-400 cursor-pointer hover:text-white" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                                {readyOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} restaurantName={restaurantName} />
                                ))}
                            </div>
                        </div>

                        {/* Column 4: Entregues & Concluídos */}
                        <div className="w-[85vw] sm:w-[350px] lg:w-[370px] shrink-0 snap-center bg-gradient-to-b from-blue-500/25 via-blue-500/5 to-[#121212]/95 rounded-[32px] p-5 flex flex-col h-full min-h-0 border border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                            <div className="flex items-center justify-between mb-5 z-10">
                                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-xs">
                                    <Archive size={16} className="text-blue-400" />
                                    <span>Concluídos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {deliveredOrders.length > 0 && (
                                        <button
                                            onClick={() => setOrders(prev => prev.filter(o => !['delivered', 'cancelled', 'entregue', 'cancelado'].includes((o.status||'').toLowerCase().trim())))}
                                            className="text-[10px] text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-2.5 py-1 rounded-lg border border-white/5 hover:border-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                            title="Limpar concluídos do ecrã"
                                        >
                                            <Trash2 size={12} /> Limpar
                                        </button>
                                    )}
                                    <span className="bg-blue-500/20 text-blue-400 text-xs font-black px-3 py-1 rounded-xl border border-blue-500/30 shadow-sm">{deliveredOrders.length}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10 opacity-75 hover:opacity-100 transition-opacity">
                                {deliveredOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} restaurantName={restaurantName} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Painel Lateral Flutuante de IA ("Dicas de Tomada de Decisão") */}
                {showAIPanel && (
                    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[380px] bg-[#121212]/95 backdrop-blur-3xl border-l border-[#D4AF37]/30 p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] z-50 flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-[#D4AF37] p-2 rounded-xl text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-lg leading-tight">Dicas de Decisão</h3>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37]">Jindungo AI Live Assist</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAIPanel(false)}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                            <div className="bg-[#1C1C1C] border border-[#D4AF37]/30 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base">💡</span>
                                    <h4 className="font-bold text-white text-sm">Sugerir Promoção p/ Noites de Sexta</h4>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                    Sugerir Promoção p/ Noites de Sexta e pessoas entre as 18h e as 22h para impulsionar pratos em destaque.
                                </p>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                    <span className="text-gray-400 font-semibold">Impacto Estimado:</span>
                                    <span className="text-green-400 font-bold">+18% Receita</span>
                                </div>
                            </div>

                            <div className="bg-[#1C1C1C] border border-cyan-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base">⚡</span>
                                    <h4 className="font-bold text-white text-sm">Rever Staff p/ Picos de Sábado</h4>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                    Rever Staff p/ picos de Sábado. O fluxo aos sábados duplica; sugerimos escalar 2 chefes adicionais na grelha.
                                </p>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                    <span className="text-gray-400 font-semibold">Ação recomendada:</span>
                                    <span className="text-cyan-400 font-bold">Escalar +2 Chefs</span>
                                </div>
                            </div>

                            <div className="bg-[#1C1C1C] border border-orange-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base">🎯</span>
                                    <h4 className="font-bold text-white text-sm">Sugerir Promoção de Decisão</h4>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                    Sugerir promoção para noites de semana e rever combinações de pratos principais mais vendidas no menu digital.
                                </p>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                    <span className="text-gray-400 font-semibold">Status AI:</span>
                                    <span className="text-[#D4AF37] font-bold">Pronto a Ativar</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 mt-4">
                            <button 
                                onClick={() => {
                                    toast.success('Dicas e automações ativadas no sistema!');
                                    setShowAIPanel(false);
                                }}
                                className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} /> Aplicar Automações IA
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Print Container: Only rendered when there is an order to print */}
        {printingOrder && (
            <div id="print-container" className="hidden print:block w-[80mm] mx-auto text-black bg-white mt-0 pt-0">
                <TableBillTemplate
                    order={printingOrder}
                    restaurantName={restaurantName || printingOrder?.restaurant?.name || 'Jindungo'}
                />
            </div>
        )}
        </>
    );
};

export default KitchenBoard;
