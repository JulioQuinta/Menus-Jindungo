export const generateWhatsAppLink = (cartItems, total, orderType, details, restaurantPhoneParam) => {
    if (!cartItems || cartItems.length === 0) return '';

    // Sanitize phone number: remove all non-digits
    let phoneStr = restaurantPhoneParam ? String(restaurantPhoneParam) : '';
    let cleanPhone = phoneStr.replace(/\D/g, '');

    // Fallback or Add country code if missing
    if (!cleanPhone || cleanPhone.length < 9) {
        cleanPhone = '244923456789'; // Voltar ao número Demo padrão
    } else if (cleanPhone.length === 9) {
        // Se introduziu só 9 números (Angola), assume 244
        cleanPhone = '244' + cleanPhone;
    }

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
        message += `*Pagamento:* Multicaixa / Transferência 💳\n_(Comprovativo enviado em anexo)_\n`;
    }

    message += `\n`;

    cartItems.forEach(item => {
        message += `${item.quantity}x ${item.name} ${item.selectedVariant ? `(${item.selectedVariant})` : ''}\n`;
        // if (item.obs) message += `   _Obs: ${item.obs}_\n`;
    });

    // Format total nicely
    const formattedTotal = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total).replace('AOA', 'Kz');

    if (details.coupon_code) {
        const formattedDiscount = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(details.coupon_discount).replace('AOA', 'Kz');
        message += `\n*Cupão:* ${details.coupon_code} (-${formattedDiscount})`;
    }

    message += `\n*Total: ${formattedTotal}*\n`;
    message += `\n_Pedido enviado via Menú Jindungo_`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};
