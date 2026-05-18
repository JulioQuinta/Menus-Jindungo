import React from 'react';
import { useCart } from '../context/CartContext';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CartFloatingButton = ({ onClick, style, primaryColor }) => {
    const { getCartCount, getCartTotal, clearCart } = useCart();
    const count = getCartCount();
    const total = getCartTotal();

    if (count === 0) return null;

    const handleCancelOrder = (e) => {
        e.stopPropagation();
        if (window.confirm("Tem a certeza que deseja cancelar e limpar o seu pedido?")) {
            clearCart();
            toast.success("Pedido cancelado com sucesso!", { icon: '🗑️', duration: 3000 });
        }
    };

    return (
        <div
            onClick={onClick}
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: primaryColor || 'var(--color-primary)',
                color: 'white',
                padding: '0.85rem 1rem',
                borderRadius: '20px',
                boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 999,
                backdropFilter: 'blur(12px)',
                animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                ...style
            }}
            className="transition-all active:scale-[0.99] group/cart select-none border border-white/20 bg-emerald-600 dark:bg-emerald-600"
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="bg-black/25 text-white rounded-xl px-3.5 py-1 text-sm font-black shadow-inner">
                    {count}
                </span>
                <span className="font-bold text-sm sm:text-base tracking-wide font-sans">Ver Pedido</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="font-black text-base sm:text-lg font-sans">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total).replace('AOA', 'Kz')}
                </span>
                <div className="w-[1px] h-7 bg-white/25 mx-1"></div>
                <button
                    type="button"
                    onClick={handleCancelOrder}
                    className="w-10 h-10 rounded-xl bg-black/25 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer group hover:rotate-6 border border-white/10"
                    title="Cancelar e limpar pedido"
                >
                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>

            <style>{`
                @keyframes popIn {
                    from { transform: scale(0.8) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default CartFloatingButton;
