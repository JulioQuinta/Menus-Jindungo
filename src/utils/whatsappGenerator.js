export const generateWhatsAppMessageText = (cartItems, total, orderType, details) => {
    if (!cartItems || cartItems.length === 0) return '';

    let message = '';

    if (orderType === 'delivery') {
        message += `*Novo Pedido - Entrega* 🛵\n`;
        message += `*Morada:* ${details.address || 'Não informada'}\n`;
        if (details.customerName) message += `*Cliente:* ${details.customerName} 👤\n`;
        if (details.locationLink) message += `*Local:* ${details.locationLink} 📍\n`;
    } else {
        message += `*Novo Pedido - Mesa ${details.tableNumber || '?'}* 🍽️\n`;
        if (details.customerName) message += `*Cliente:* ${details.customerName} 👤\n`;
    }

    // Payment Info
    if (details.paymentMethod === 'cash') {
        message += `*Pagamento:* Dinheiro 💵\n`;
        if (details.changeFor) message += `_Troco para: ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(details.changeFor).replace('AOA', 'Kz')}_\n`;
    } else if (details.paymentMethod === 'multicaixa') {
        message += `*Pagamento:* Multicaixa Express / Transferência 💳\n_(Comprovativo enviado em anexo)_\n`;
    }

    message += `\n`;

    cartItems.forEach(item => {
        message += `${item.quantity}x ${item.name} ${item.selectedVariant ? `(${item.selectedVariant})` : ''}\n`;
    });

    // Format total nicely
    const formattedTotal = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total).replace('AOA', 'Kz');

    if (details.coupon_code) {
        const formattedDiscount = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(details.coupon_discount).replace('AOA', 'Kz');
        message += `\n*Cupão:* ${details.coupon_code} (-${formattedDiscount})`;
    }

    message += `\n*Total: ${formattedTotal}*\n`;

    const slug = details.restaurantSlug || '';
    if (slug) {
        const base64Str = serializeCart(cartItems, details, orderType);
        if (base64Str) {
            const domain = typeof window !== 'undefined' ? window.location.origin : 'https://jindungo.com';
            message += `\n*Alterar ou refazer pedido:* ${domain}/r/${slug}?recover=${base64Str}\n`;
        }
    }

    message += `\n_Pedido enviado via Menús Jindungo_`;

    // [NEW] WhatsApp Bot Lite - Structured Block for Automation
    try {
        const automationData = {
            v: 1,
            type: orderType,
            items: cartItems.map(i => ({ id: i.id, q: i.quantity })),
            total: total,
            customer: details.customerName || 'Anonymous',
            phone: details.customerPhone || ''
        };
        message += `\n\n[[DATA:${JSON.stringify(automationData)}]]`;
    } catch (e) {
        console.error("Automation block error:", e);
    }

    return message;
};

export const generateWhatsAppLink = (cartItems, total, orderType, details, restaurantPhoneParam) => {
    // Sanitize phone number: remove all non-digits
    let phoneStr = restaurantPhoneParam ? String(restaurantPhoneParam) : '';
    let cleanPhone = phoneStr.replace(/\D/g, '');

    // Fallback or Add country code if missing
    if (!cleanPhone || cleanPhone.length < 9) {
        return null; 
    } else if (cleanPhone.length === 9) {
        cleanPhone = '244' + cleanPhone;
    }

    const message = generateWhatsAppMessageText(cartItems, total, orderType, details);
    if (!message) return '';

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const serializeCart = (cartItems, details, orderType) => {
    try {
        const payload = {
            i: cartItems.map(item => ({
                id: item.id,
                q: item.quantity,
                v: item.selectedVariant || null
            })),
            d: {
                n: details.customerName || '',
                p: details.customerPhone || '',
                a: details.address || '',
                r: details.addressReference || '',
                t: details.tableNumber || ''
            },
            t: orderType
        };
        const str = JSON.stringify(payload);
        const utf8Bytes = new TextEncoder().encode(str);
        let binString = "";
        for (let i = 0; i < utf8Bytes.length; i++) {
            binString += String.fromCharCode(utf8Bytes[i]);
        }
        const base64 = btoa(binString);
        return encodeURIComponent(base64);
    } catch (e) {
        console.error("Error serializing cart:", e);
        return '';
    }
};

export const deserializeCart = (base64Str) => {
    try {
        const decodedBase64 = decodeURIComponent(base64Str);
        const binString = atob(decodedBase64);
        const len = binString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binString.charCodeAt(i);
        }
        const str = new TextDecoder().decode(bytes);
        const payload = JSON.parse(str);
        return {
            cartItems: payload.i.map(item => ({
                id: item.id,
                quantity: item.q,
                selectedVariant: item.v
            })),
            details: {
                customerName: payload.d.n,
                customerPhone: payload.d.p,
                address: payload.d.a,
                addressReference: payload.d.r,
                tableNumber: payload.d.t
            },
            orderType: payload.t
        };
    } catch (e) {
        console.error("Error deserializing cart:", e);
        return null;
    }
};
