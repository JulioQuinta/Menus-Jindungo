import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orderService';
import { Clock, CheckCircle, ChefHat, Truck, XCircle, AlertCircle, Banknote, Printer, Ticket, Smartphone, Volume2, VolumeX, Award, RefreshCw, Bike, Settings2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import TableBillTemplate from './TableBillTemplate';
import { printerService } from '../utils/bluetoothPrinter';

const OrderCard = React.memo(({ order, onStatusChange, onPrint, enablePrint, restaurantName }) => {
    // Calculate waiting time
    const [elapsed, setElapsed] = useState('');
    const [showTimeSelector, setShowTimeSelector] = useState(false);
    const [customMins, setCustomMins] = useState('30');

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

    const statusColors = {
        pending: `border-[#F1C40F] bg-[#111111]/80 shadow-[0_10px_30px_rgba(241,196,15,0.05)] ${parseInt(elapsed) > 15 ? 'ring-2 ring-red-500/50 animate-pulse-slow shadow-[0_0_40px_rgba(239,68,68,0.2)]' : ''}`,
        preparing: 'border-[#E67E22] bg-[#111111]/80 shadow-[0_10px_30px_rgba(230,126,34,0.05)]',
        ready: 'border-[#2ECC71] bg-[#111111]/80 shadow-[0_10px_30px_rgba(46,204,113,0.05)]',
    };

    // Data Extraction for Delivery and Maps
    const isDelivery = order.table_number?.includes('Entrega:');
    let displayAddress = order.table_number;
    let mapsLink = null;
    let paymentMethod = null;

    if (isDelivery) {
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
                // The realtime subscription will update the UI
            } catch (err) {
                toast.error('Erro ao atualizar valor.');
            }
        }
    };

    return (
        <div className={`p-6 rounded-[2rem] border-l-8 backdrop-blur-3xl mb-6 animate-slide-up transition-all hover:scale-[1.01] hover:border-r hover:border-r-[#D4AF37]/20 ${statusColors[order.status] || 'border-white/10 bg-black/40'} border-y border-y-white/5 border-r border-r-white/5 relative overflow-hidden group`}>
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#D4AF37]/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        {isDelivery ? <Bike size={16} className="text-cyan-400" /> : <ChefHat size={16} className="text-[#D4AF37]" />}
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{isDelivery ? 'Entrega ao Domicílio' : 'Pedido de Sala'}</span>
                    </div>
                    <h4 className="text-lg font-serif font-black text-white leading-tight">
                        {isDelivery ? displayAddress : `#Mesa ${displayAddress}`}
                    </h4>
                    <p className="text-xs text-[#D4AF37] font-bold mt-1 opacity-80">{order.customer_name}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-white bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        <Clock size={12} className={order.status === 'pending' && parseInt(elapsed) > 15 ? 'text-red-500 animate-pulse' : 'text-[#D4AF37]'} />
                        {elapsed}
                    </div>
                    <span className="text-[10px] font-mono text-gray-600">#{order.id.slice(0, 6)}</span>
                </div>
            </div>

            {/* Total and Edit Action */}
            <div className="mb-4 flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                <div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Total do Pedido</span>
                    <span className="text-lg font-black text-[#D4AF37]">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.total).replace('AOA', 'Kz')}
                    </span>
                </div>
                <button 
                    onClick={handleEditTotal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl text-[10px] font-black border border-[#D4AF37]/20 hover:bg-[#D4AF37] hover:text-black transition-all"
                >
                    <Settings2 size={12} /> AJUSTAR TAXA
                </button>
            </div>

            {/* Payment Info */}
            {paymentMethod && (
                <div className="mb-3 text-xs font-semibold text-gray-300 bg-green-900/20 p-2 rounded-lg border border-green-500/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                        <Banknote size={14} className="text-green-400 shrink-0" />
                        <span className="break-all">{paymentMethod}</span>
                    </div>
                </div>
            )}
            
            {/* GPS Link */}
            {mapsLink && (
                <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="mb-3 w-full bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/30 font-bold px-3 py-2.5 rounded-lg text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                    Abrir Mapa no GPS
                </a>
            )}

            <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col border-b border-white/5 last:border-0 pb-2 mb-2 last:mb-0 last:pb-0">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-300">
                                <span className="bg-white/10 text-[#D4AF37] font-bold px-2 py-0.5 rounded-md mr-3 text-xs shadow-sm border border-white/5">{item.quantity}</span>
                                {item.name}
                            </span>
                        </div>
                        {/* Variant/Options Display */}
                        {item.variant_name && (
                            <span className="text-[10px] text-[#D4AF37] font-black ml-10 mt-0.5 uppercase tracking-wider">
                                ↳ {item.variant_name}
                            </span>
                        )}
                        {item.notes && (
                            <span className="text-[10px] text-orange-400 font-bold ml-10 mt-1 italic bg-orange-400/5 px-2 py-1 rounded-lg border border-orange-400/10">
                                Obs: {item.notes}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* [NEW] Coupon/Discount Display */}
            {order.coupon_discount > 0 && (
                <div className="mb-4 text-[10px] font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 flex justify-between items-center tracking-tight">
                    <span className="flex items-center gap-1">
                        <Ticket size={10} /> Cupão: {order.coupon_code}
                    </span>
                    <span>-{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.coupon_discount).replace('AOA', 'Kz')}</span>
                </div>
            )}

            {/* Loyalty Reward Display */}
            {order.is_loyalty_redemption && (
                <div className="mb-4 text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20 flex justify-between items-center tracking-tight">
                    <span className="flex items-center gap-1">
                        <Award size={10} /> RECOMPENSA FIDELIZAÇÃO
                    </span>
                    <span>{order.loyalty_reward_text}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
                {order.status === 'pending' && (
                    <button
                        onClick={() => onStatusChange(order.id, 'preparing')}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-orange-500/25"
                    >
                        <ChefHat size={16} /> Preparar
                    </button>
                )}

                {order.status === 'preparing' && (
                    <button
                        onClick={() => onStatusChange(order.id, 'ready')}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-green-500/25"
                    >
                        <CheckCircle size={16} /> Pronto
                    </button>
                )}

                {order.status === 'ready' && (
                    <div className="flex flex-col gap-2 w-full">
                        {isDelivery ? (
                            <div className="w-full">
                                {!showTimeSelector ? (
                                    <button
                                        onClick={() => setShowTimeSelector(true)}
                                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/30"
                                    >
                                        <Bike size={18} /> Despachar Mota
                                    </button>
                                ) : (
                                    <div className="bg-black/60 p-4 rounded-xl border border-cyan-500/30 animate-in zoom-in-95 duration-200">
                                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-3 text-center">Tempo de Entrega?</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[15, 20, 30, 45, 60, 90].map(mins => (
                                                <button
                                                    key={mins}
                                                    onClick={() => {
                                                        const targetEpochMs = Date.now() + mins * 60000;
                                                        onStatusChange(order.id, 'out_for_delivery', targetEpochMs.toString());
                                                        setShowTimeSelector(false);
                                                    }}
                                                    className="bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-white py-2 rounded-lg text-xs font-black transition-all border border-cyan-500/20"
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
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50"
                                                    placeholder="Outros min..."
                                                />
                                                <button
                                                    onClick={() => {
                                                        const val = parseInt(customMins);
                                                        if (val > 0) {
                                                            const targetEpochMs = Date.now() + val * 60000;
                                                            onStatusChange(order.id, 'out_for_delivery', targetEpochMs.toString());
                                                            setShowTimeSelector(false);
                                                        }
                                                    }}
                                                    className="bg-cyan-500 text-black px-3 rounded-lg font-bold text-xs"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setShowTimeSelector(false)}
                                            className="w-full mt-3 text-[9px] text-gray-500 hover:text-white uppercase font-bold tracking-[0.2em]"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onStatusChange(order.id, 'delivered')}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25"
                                >
                                    <Truck size={16} /> Entregue
                                </button>
                                <button
                                    onClick={() => onStatusChange(order.id, 'delivered')}
                                    className="flex-1 bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:brightness-110 text-black py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-yellow-500/25"
                                >
                                    <Banknote size={16} /> Pago
                                </button>
                            </div>
                        )}
                        
                        {order.customer_phone && (
                            <button
                                onClick={() => {
                                    let message = `Olá ${order.customer_name || ''}! O seu pedido no *${restaurantName || 'Restaurante'}* já está pronto 🍽️!\n\n`;
                                    message += `*Valor a Pagar:* ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.total).replace('AOA', 'Kz')}\n`;
                                    if (order.coupon_code) {
                                        message += `_Inclui desconto (Cupão: ${order.coupon_code}) ✅_\n`;
                                    }
                                    if (order.is_loyalty_redemption) {
                                        message += `_Inclui recompensa: ${order.loyalty_reward_text} 🎁_\n`;
                                    }
                                    message += `\nEsperamos por si!`;
                                    let phone = order.customer_phone.replace(/\D/g, '');
                                    if (phone.length === 9) phone = '244' + phone;
                                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="flex-1 bg-white/5 border border-green-500/30 text-green-400 py-2 rounded-xl font-bold text-[10px] flex justify-center items-center gap-2 hover:bg-green-500/10 transition-all uppercase"
                            >
                                <Smartphone size={14} /> Avisar no WhatsApp
                            </button>
                        )}

                        <button
                            onClick={() => {
                                const automationData = {
                                    id: order.id,
                                    customer: order.customer_name,
                                    phone: order.customer_phone,
                                    items: order.items,
                                    total: order.total,
                                    type: isDelivery ? 'delivery' : 'dine-in',
                                    address: displayAddress,
                                    created: order.created_at
                                };
                                navigator.clipboard.writeText(JSON.stringify(automationData, null, 2));
                                toast.success('Dados de automação copiados!', { icon: '🤖' });
                            }}
                            className="bg-white/5 border border-white/10 text-gray-400 py-2 rounded-xl font-bold text-[10px] flex justify-center items-center gap-2 hover:bg-white/10 transition-all uppercase"
                            title="Copiar JSON para Automação"
                        >
                            <RefreshCw size={14} /> Dados Bot
                        </button>
                    </div>
                )}

                {order.status === 'out_for_delivery' && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const motoboyUrl = `${window.location.origin}/delivery/${order.id}`;
                                    navigator.clipboard.writeText(motoboyUrl);
                                    toast.success('Link do Motoboy copiado!');
                                }}
                                className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 py-2.5 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition-all uppercase"
                            >
                                <Bike size={14} /> Link da App (Estafeta)
                            </button>
                            <button
                                onClick={() => onStatusChange(order.id, 'arrived')}
                                className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 py-2.5 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition-all uppercase"
                            >
                                🔔 Estafeta Chegou
                            </button>
                        </div>
                        
                        {order.customer_phone && (
                            <button
                                onClick={() => {
                                    let message = `Olá ${order.customer_name || ''}! Confirmamos a entrega do seu pedido no *${restaurantName || 'Restaurante'}*. Bom apetite e volte sempre! 🍽️\n`;
                                    let phone = order.customer_phone.replace(/\D/g, '');
                                    if (phone.length === 9) phone = '244' + phone;
                                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="flex-1 bg-white/5 border border-green-500/30 text-green-400 py-2 rounded-xl font-bold text-[10px] flex justify-center items-center gap-2 hover:bg-green-500/10 transition-all uppercase"
                            >
                                <Smartphone size={14} /> Msg de Agradecimento
                            </button>
                        )}
                    </div>
                )}

                {order.status === 'arrived' && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 mb-1 text-center animate-pulse">
                             <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                 <Bike size={14}/> À PORTA DO CLIENTE!
                             </p>
                        </div>
                        <button
                            onClick={() => onStatusChange(order.id, 'delivered')}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:brightness-110 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-green-500/25"
                        >
                            <CheckCircle size={16} /> Entregue c/ Sucesso (Pago)
                        </button>
                        {order.customer_phone && (
                            <button
                                onClick={() => {
                                    let message = `Olá ${order.customer_name || ''}! O nosso estafeta acabou de chegar à sua porta com o seu pedido! 🛵💨\nPor favor, venha recebê-lo.`;
                                    let phone = order.customer_phone.replace(/\D/g, '');
                                    if (phone.length === 9) phone = '244' + phone;
                                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="flex-1 bg-white/5 border border-green-500/30 text-green-400 py-2 rounded-xl font-bold text-[10px] flex justify-center items-center gap-2 hover:bg-green-500/10 transition-all uppercase"
                            >
                                <Smartphone size={14} /> Msg: &quot;Vem à Porta&quot;
                            </button>
                        )}
                    </div>
                )}

                {/* Print Button (Optional via Settings) */}
                {enablePrint && (
                    <button
                        onClick={() => onPrint(order)}
                        className="p-2.5 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors border border-white/5 hover:border-white/20 ml-1"
                        title="Imprimir Conta de Conferência"
                    >
                        <Printer size={18} />
                    </button>
                )}

                {/* Rejeitar Button */}
                {order.status === 'pending' && (
                    <button
                        onClick={() => {
                            const reason = window.prompt("Motivo da rejeição (ex: Fora de hora, Sem stock, Restaurante cheio):", "Fora de hora");
                            if (reason !== null) {
                                onStatusChange(order.id, 'cancelled', reason);
                            }
                        }}
                        className="p-2.5 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-colors border border-transparent hover:border-red-500/30 ml-1"
                        title="Rejeitar Pedido"
                    >
                        <XCircle size={18} />
                    </button>
                )}
            </div>
        </div>
    );
});

const KitchenBoard = ({ restaurantId, config, restaurantName }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);

    // Native Printing State
    const [printingOrder, setPrintingOrder] = useState(null);
    const [isBluetoothReady, setIsBluetoothReady] = useState(false);
    const [autoPrint, setAutoPrint] = useState(() => {
        return localStorage.getItem(`jindungo_autoprint_${restaurantId}`) === 'true';
    });

    useEffect(() => {
        localStorage.setItem(`jindungo_autoprint_${restaurantId}`, autoPrint);
    }, [autoPrint, restaurantId]);

    const toggleAudio = () => {
        if (!isAudioEnabled) {
            // Unlock audio on most browsers
            const audio = new Audio('/bell.mp3');
            audio.volume = 0.1;
            audio.play().then(() => {
                setIsAudioEnabled(true);
            }).catch(e => console.log("Audio unlock failed", e));
        } else {
            setIsAudioEnabled(false);
        }
    };

    const toggleBluetoothPrinter = async () => {
        try {
            if (isBluetoothReady && printerService.type === 'bluetooth') {
                printerService.disconnect();
                setIsBluetoothReady(false);
                toast.success('Impressora Bluetooth desligada.');
            } else {
                toast.loading('Selecione a Impressora Bluetooth...', { id: 'bt-loading' });
                await printerService.connectBluetooth();
                setIsBluetoothReady(true);
                toast.success('Bluetooth Emparelhado!', { id: 'bt-loading' });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Falha ao emparelhar Bluetooth.', { id: 'bt-loading' });
        }
    };

    const toggleUSBPrinter = async () => {
        try {
            if (isBluetoothReady && printerService.type === 'usb') {
                printerService.disconnect();
                setIsBluetoothReady(false);
                toast.success('Impressora USB desligada.');
            } else {
                toast.loading('Selecione a Impressora USB...', { id: 'usb-loading' });
                await printerService.connectUSB();
                setIsBluetoothReady(true);
                toast.success('Impressora USB Conectada!', { id: 'usb-loading' });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Falha ao conectar USB.', { id: 'usb-loading' });
        }
    };

    const handleTestPrint = async () => {
        if (!isBluetoothReady) {
            toast.error('Ligue uma impressora primeiro (BT ou USB)');
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

    useEffect(() => {
        if (!restaurantId) return;

        // 1. Initial Load (Safe merging)
        const loadOrders = async () => {
            const { data } = await orderService.getActiveOrders(restaurantId);
            setOrders(prev => {
                // Keep everything we already got from Realtime and combine with fetched data
                const newIds = new Set(prev.map(o => o.id));
                const combined = [...prev, ...data.filter(o => !newIds.has(o.id))];
                return combined;
            });
            setLoading(false);
        };
        loadOrders();

        // 2. Realtime Subscription
        const channel = orderService.subscribeToOrders(restaurantId, (payload) => {
            console.log('Realtime Event Received:', payload.eventType, payload.new?.id, payload.new?.status);
            
            if (payload.eventType === 'INSERT') {
                // Play Sound Safely only if enabled
                if (isAudioEnabled) {
                    try {
                        const audio = new Audio('/bell.mp3');
                        audio.play().catch(e => console.log('Audio blocked', e));
                    } catch (err) {
                        console.log('Audio error', err);
                    }
                }

                // Prepend new order
                setOrders(prev => {
                    if (prev.find(o => o.id === payload.new.id)) return prev;
                    return [payload.new, ...prev];
                });
                
                // [NEW] Auto-Print logic
                if (autoPrint && isBluetoothReady) {
                    setTimeout(() => {
                        handlePrintOrder(payload.new);
                    }, 1000);
                }

                toast.success(`Novo Pedido de ${payload.new.customer_name || 'Cliente'}!`, {
                    icon: '🔔',
                    duration: 5000
                });

            } else if (payload.eventType === 'UPDATE') {
                setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
            } else if (payload.eventType === 'DELETE') {
                setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
        });

        // 3. Periodic Audio Reminder (Every 2 minutes if pending orders exist)
        const reminderInterval = setInterval(() => {
            if (isAudioEnabled) {
                const hasPending = orders.some(o => o.status === 'pending');
                if (hasPending) {
                    try {
                        const audio = new Audio('/bell.mp3');
                        audio.volume = 0.2;
                        audio.play().catch(e => console.log('Audio blocked', e));
                        toast('Pedidos pendentes na cozinha!', { icon: '👨‍🍳', position: 'bottom-center' });
                    } catch (err) {
                        console.log('Reminder audio error', err);
                    }
                }
            }
        }, 120000); // 2 minutes

        return () => {
            supabase.removeChannel(channel);
            clearInterval(reminderInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId, isAudioEnabled]);

    const handleStatusUpdate = async (id, status, reason = null) => {
        // Keep previous state for rollback
        const previousOrders = [...orders];

        // Optimistic update
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status, rejection_reason: reason } : o));

        const toastId = toast.loading('A atualizar pedido...');

        try {
            // API Call
            await orderService.updateOrderStatus(id, status, reason);
            
            toast.success('Pedido atualizado!', { id: toastId });

            // Remove from list if delivered/cancelled/paid after animation
            if (status === 'delivered' || status === 'cancelled' || status === 'paid') {
                setTimeout(() => {
                    setOrders(prev => prev.filter(o => o.id !== id));
                }, 500); // Wait for visual feedback
            }
        } catch (error) {
            console.error('Falha ao atualizar pedido:', error);
            // Rollback on failure
            setOrders(previousOrders);
            toast.error('Erro ao atualizar: ' + (error.message || 'Verifique a ligação'), { id: toastId });
        }
    };

    const pendingOrders = orders.filter(o => {
        const s = (o.status || '').toLowerCase().trim();
        return s === 'pending' || s === 'pendente';
    });
    const preparingOrders = orders.filter(o => {
        const s = (o.status || '').toLowerCase().trim();
        return s === 'preparing' || s === 'preparando';
    });
    const readyOrders = orders.filter(o => {
        const s = (o.status || '').toLowerCase().trim();
        return s === 'ready' || s === 'pronto' || s === 'paid' || s === 'pago' || s === 'out_for_delivery' || s === 'arrived';
    });

    if (loading) return <div className="p-8 text-gray-500">Carregando pedidos...</div>;

    return (
        <>
        <div className="h-full flex flex-col p-4 sm:p-6 bg-transparent overflow-hidden relative print:hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Cozinha: {restaurantName}</h2>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-1">Quadro de Pedidos em Tempo Real</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleAudio}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                            isAudioEnabled 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/10 text-red-500 border border-red-500/30'
                        }`}
                    >
                        {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        {isAudioEnabled ? 'SOM ATIVO' : 'CLIQUE P/ ATIVAR SOM'}
                    </button>

                    <button
                        onClick={toggleBluetoothPrinter}
                        className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                            isBluetoothReady && printerService.type === 'bluetooth'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                        title="Emparelhar Impressora Bluetooth"
                    >
                        <Smartphone size={16} />
                        {isBluetoothReady && printerService.type === 'bluetooth' ? 'BT ATIVO' : 'CONECTAR BT'}
                    </button>

                    <button
                        onClick={toggleUSBPrinter}
                        className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                            isBluetoothReady && printerService.type === 'usb'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                        title="Conectar Impressora USB"
                    >
                        <Printer size={16} />
                        {isBluetoothReady && printerService.type === 'usb' ? 'USB ATIVO' : 'CONECTAR USB'}
                    </button>

                    <button
                        onClick={handleTestPrint}
                        className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 ${!isBluetoothReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Imprimir Talão de Teste"
                    >
                        <Ticket size={16} />
                        TESTE
                    </button>

                    <button
                        onClick={() => setAutoPrint(!autoPrint)}
                        className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                            autoPrint 
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                        title="Imprimir automaticamente ao chegar novo pedido"
                    >
                        <RefreshCw size={16} className={autoPrint ? 'animate-spin-slow' : ''} />
                        {autoPrint ? 'AUTO: ON' : 'AUTO: OFF'}
                    </button>
                </div>
            </div>

            {orders.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <ChefHat size={48} className="mb-4 opacity-50" />
                    <p>Nenhum pedido ativo no momento.</p>
                </div>
            )}

            {orders.length > 0 && (
                <div className="flex-1 flex flex-row gap-4 md:gap-6 h-full min-h-0 overflow-x-auto snap-x snap-mandatory pb-2 px-2 custom-scrollbar">
                    {/* Column 1: Pendentes */}
                    <div className="w-[85vw] sm:w-[320px] md:flex-1 shrink-0 snap-center bg-black/60 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col h-full min-h-0 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all duration-700"></div>
                        <div className="flex items-center justify-between mb-4 z-10">
                            <div className="flex items-center gap-2 text-yellow-500 font-bold uppercase tracking-wider text-xs">
                                <AlertCircle size={16} />
                                Pendentes
                            </div>
                            <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-yellow-500/20">{pendingOrders.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                            {pendingOrders.map(order => (
                                <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} restaurantName={restaurantName} />
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Preparando */}
                    <div className="w-[85vw] sm:w-[320px] md:flex-1 shrink-0 snap-center bg-black/60 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col h-full min-h-0 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-700"></div>
                        <div className="flex items-center justify-between mb-4 z-10">
                            <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-wider text-xs">
                                <ChefHat size={16} />
                                Em Preparação
                            </div>
                            <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-500/20">{preparingOrders.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                            {preparingOrders.map(order => (
                                <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} restaurantName={restaurantName} />
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Prontos */}
                    <div className="w-[85vw] sm:w-[320px] md:flex-1 shrink-0 snap-center bg-black/60 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col h-full min-h-0 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-green-500/20 transition-all duration-700"></div>
                        <div className="flex items-center justify-between mb-4 z-10">
                            <div className="flex items-center gap-2 text-green-500 font-bold uppercase tracking-wider text-xs">
                                <CheckCircle size={16} />
                                Prontos p/ Servir
                            </div>
                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-green-500/20">{readyOrders.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                            {readyOrders.map(order => (
                                <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} restaurantName={restaurantName} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
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
