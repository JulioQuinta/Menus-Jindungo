import React from 'react';
import { useCart } from '../context/CartContext';

const CartFloatingButton = ({ onClick, style, primaryColor }) => {
    const { getCartCount, getCartTotal } = useCart();
    const count = getCartCount();
    const total = getCartTotal();

    if (count === 0) return null;

    return (
        <div
            onClick={onClick}
            style={{
                position: 'fixed', // Default to fixed for visibility
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: primaryColor || 'var(--color-primary)',
                color: 'white',
                padding: '1rem',
                borderRadius: '16px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 90,
                backdropFilter: 'blur(4px)',
                animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                ...style // Allow overrides
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '8px', padding: '2px 8px', fontSize: '0.9rem', fontWeight: 'bold'
                }}>
                    {count}
                </span>
                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Ver Pedido</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total).replace('AOA', 'Kz')}
            </span>

            <style>{`
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default CartFloatingButton;
