/**
 * Verifica se um colaborador tem permissão para aceder a um determinado caminho de rota no painel administrativo.
 * 
 * @param {string|null|undefined} role - O cargo/função do colaborador ativo (ex: 'admin', 'waiter', 'kitchen', 'reception')
 * @param {string} path - O caminho da rota (ex: '/admin/orders', '/admin/settings')
 * @returns {boolean} - Retorna true se o utilizador tiver permissão, caso contrário false.
 */
export const checkStaffPermission = (role, path) => {
    // Se não houver colaborador ativo (role é null/undefined), significa que a conta master do administrador/proprietário está logada,
    // a qual tem acesso total e irrestrito.
    if (!role) return true;

    const cleanPath = path.toLowerCase().replace(/\/$/, '');

    // Administradores de staff têm acesso total
    if (role === 'admin') return true;

    switch (role) {
        case 'waiter': // Empregado de Mesa / Atendente / Operador
            // Garçons e operadores podem gerir pedidos, faturação/vendas, reservas, chat IA e QR Codes
            return [
                '/admin/orders',
                '/admin/invoices',
                '/admin/reservations',
                '/admin/chat',
                '/admin/qrcode'
            ].includes(cleanPath);

        case 'kitchen': // Chef de Cozinha
            // Cozinha tem acesso estrito ao quadro de pedidos (KDS) e gestão de stock/inventário
            return [
                '/admin/orders',
                '/admin/inventory'
            ].includes(cleanPath);

        case 'reception': // Receção / Salão / Operador POS
            // Receção e operadores de caixa podem gerir faturação/vendas, reservas, pedidos, chat, avaliações, CRM e QR Codes
            return [
                '/admin/orders',
                '/admin/invoices',
                '/admin/reservations',
                '/admin/chat',
                '/admin/feedbacks',
                '/admin/crm',
                '/admin/qrcode'
            ].includes(cleanPath);

        default:
            return false;
    }
};
