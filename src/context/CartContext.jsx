import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { analyticsService } from '../services/analyticsService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        // Optional: Load from local storage to persist across reloads
        const savedCart = localStorage.getItem('jindungo_cart');
        if (savedCart) {
            try {
                return JSON.parse(savedCart);
            } catch (e) {
                console.error("Failed to load cart", e);
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('jindungo_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item, selectedVariant = null) => {
        if (item?.restaurant_id) {
            analyticsService.trackAddToCart(item.restaurant_id, item);
        }
        setCartItems(prev => {
            const cartItemId = `${item.id}-${selectedVariant || ''}`;

            // [SECURITY] Se o item a adicionar for de outro restaurante, limpa o carrinho anterior
            if (prev.length > 0 && prev[0].restaurant_id && item.restaurant_id && String(prev[0].restaurant_id) !== String(item.restaurant_id)) {
                toast('Carrinho anterior limpo (outro restaurante).', { icon: '🔄', duration: 4000 });
                return [{ ...item, cartItemId, selectedVariant, quantity: 1 }];
            }

            const existing = prev.find(i => i.cartItemId === cartItemId || (String(i.id) === String(item.id) && !i.selectedVariant && !selectedVariant));

            if (existing) {
                // Use the matching ID to increment
                return prev.map(i => (i.cartItemId === existing.cartItemId || String(i.id) === String(existing.id)) ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, cartItemId, selectedVariant, quantity: 1 }];
        });
    };

    const removeFromCart = (cartItemIdOrId) => {
        setCartItems(prev => {
            // Match either by strict cartItemId or just id (if no variants exist for this item in cart)
            const existing = prev.find(i => i.cartItemId === cartItemIdOrId || String(i.id) === String(cartItemIdOrId));
            if (!existing) return prev;

            if (existing.quantity > 1) {
                return prev.map(i => i.cartItemId === existing.cartItemId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.cartItemId !== existing.cartItemId);
        });
    };

    const clearCart = () => setCartItems([]);

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => {
            // Clean price string "18.000 Kz" -> 18000
            const priceVal = parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0;
            return total + (priceVal * item.quantity);
        }, 0);
    };

    const getCartCount = () => cartItems.reduce((c, i) => c + i.quantity, 0);

    const getItemQuantity = (itemId) => {
        // Return total quantity of this item across all variants
        return cartItems.filter(i => String(i.id) === String(itemId)).reduce((sum, item) => sum + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            getCartTotal,
            getCartCount,
            getItemQuantity
        }}>
            {children}
        </CartContext.Provider>
    );
};
