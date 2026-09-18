export const MODULE_TYPES = {
    BILLING_ONLY: 'billing_only',
    QR_ONLY: 'qr_only',
    FULL_SUITE: 'full_suite'
};

export const MODULE_NAMES = {
    billing_only: 'Faturação Simples',
    qr_only: 'Menu QR & Pedidos',
    full_suite: 'Faturação + Menu QR (Completo)'
};

/**
 * Retorna as capacidades de funcionalidade ativas consoante o módulo contratado.
 * 
 * @param {string} moduleType 'billing_only' | 'qr_only' | 'full_suite'
 * @returns {object} Objeto com sinalizadores booleanos para cada módulo funcional
 */
export const getModuleFeatures = (moduleType) => {
    const type = (moduleType || MODULE_TYPES.FULL_SUITE).toLowerCase().trim();

    const isBillingOnly = type === MODULE_TYPES.BILLING_ONLY;
    const isQROnly = type === MODULE_TYPES.QR_ONLY;
    const isFullSuite = type === MODULE_TYPES.FULL_SUITE || (!isBillingOnly && !isQROnly);

    return {
        isBillingOnly,
        isQROnly,
        isFullSuite,
        // Funcionalidades de Faturação Fiscal e Emissão AGT
        hasBilling: isBillingOnly || isFullSuite,
        // Funcionalidades de Menu Digital QR e Pedidos Públicos
        hasQRMenu: isQROnly || isFullSuite,
        // Gestão de Stock e Inventário de Produtos
        hasInventory: isBillingOnly || isFullSuite,
        // Gestão de Cozinha KDS e Pedidos de Mesa
        hasKDS: isQROnly || isFullSuite,
        // Reservas de Mesa e Calendário
        hasReservations: isQROnly || isFullSuite,
        // Programa de Fidelização
        hasLoyalty: isQROnly || isFullSuite,
        // Gestão de Mesas e Garçom
        hasTables: isQROnly || isFullSuite,
        // Catalogo de Artigos/Menu
        hasProductsMenu: true // Todos os módulos cadastram artigos ou pratos
    };
};

export const PLANS = {
    START: 'start',
    BUSINESS: 'business',
    CORPORATE: 'corporate',
    TRIAL: 'Free Trial'
};

/**
 * Retorna as permissões do restaurante baseado no seu plano.
 * O plano Corporate herda as do Business, que por sua vez herda as do Start.
 * 
 * @param {string} planString O plano atual vindo da base de dados (ex: 'business')
 * @returns {object} Objeto com booleanos (true/false) e limites numéricos para cada funcionalidade.
 */
export const getPlanFeatures = (planString) => {
    // Normalizar a string do plano
    const plan = (planString || '').toLowerCase().trim();

    // Identificadores de tier
    const isBusiness = plan === 'business' || plan === 'free trial'; // O teste grátis liberta o nível Business
    const isCorporate = plan === 'corporate';

    // Hierarquia em Cascata (Se é Corporate, tem automaticamente acesso ao Business)
    const hasBusiness = isBusiness || isCorporate;
    const hasCorporate = isCorporate;

    return {
        // --- 1. Operações (KDS & Gestão de Staff) ---
        canUseKDS: hasBusiness,          // Aba Pedidos (Cozinha) no Painel
        canManageStaff: hasBusiness,     // Aba Clientes/Staff no Painel
        canCallWaiter: hasBusiness,      // Botão "Chamar Mesa" no Menu Público
        canMarkSoldOut: true,            // Botão Esgotar no Gestor de Menu
        hasTableQR: hasBusiness,         // Gera QR codes pré-associados com a mesa
        hasPrivateFeedback: hasBusiness, // Sistema de estrelas 1-5 escondido do Google
        hasUpsell: hasBusiness,          // "Sugestão do chefe" ao ir para o carrinho

        // --- 2. Limites Dinâmicos do Sistema ---
        // Infinity significa "sem limites"
        maxItems: hasCorporate ? Infinity : (hasBusiness ? 250 : 50),
        maxStaff: hasCorporate ? Infinity : (hasBusiness ? 5 : 0),

        // --- 3. Customização Visual ---
        canUploadLogo: true,             // Submeter imagem/logo próprio
        canUseCustomBackground: hasBusiness, // Alterar cor de fundo 
        canHideBranding: hasCorporate,   // Remoção de "Feito por Jindungo Menus" e do botão WhatsApp

        // --- 4. Inteligência & Dados de Topo (CRM & Logística) ---
        canCollectClientData: hasCorporate, // Guarda clientes recorrentes / Contactos WhatsApp
        hasDynamicSearch: hasBusiness,          // SearchBar dinâmica no menu (Business+)
        isMultilingual: true,                    // Selector de idiomas disponível para todos
        hasDeliveryCalculator: hasCorporate,// Taxa de entrega fixa/dinâmica consoante bairro
        hasAdvancedAnalytics: hasCorporate  // Relatórios de vendas profundos
    };
};

