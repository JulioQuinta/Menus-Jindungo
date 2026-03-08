import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    // Optional: Load from local storage to persist across reloads
    useEffect(() => {
        const savedCart = localStorage.getItem('jindungo_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to load cart", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('jindungo_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item, selectedVariant = null) => {
        setCartItems(prev => {
            const cartItemId = `${item.id}-${selectedVariant || ''}`;
            const existing = prev.find(i => i.cartItemId === cartItemId || (i.id === item.id && !i.selectedVariant && !selectedVariant));

            if (existing) {
                // Use the matching ID to increment
                return prev.map(i => (i.cartItemId === existing.cartItemId || i.id === existing.id) ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, cartItemId, selectedVariant, quantity: 1 }];
        });
    };

    const removeFromCart = (cartItemIdOrId) => {
        setCartItems(prev => {
            // Match either by strict cartItemId or just id (if no variants exist for this item in cart)
            const existing = prev.find(i => i.cartItemId === cartItemIdOrId || i.id === cartItemIdOrId);
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
        return cartItems.filter(i => i.id === itemId).reduce((sum, item) => sum + item.quantity, 0);
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
