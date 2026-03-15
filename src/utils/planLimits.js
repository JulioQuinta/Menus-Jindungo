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
        canCallWaiter: hasBusiness,      // Botão "Chamar Garçom" no Menu Público
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
        hasDynamicSearch: hasCorporate,     // SearchBar dinâmica no menu
        isMultilingual: hasCorporate,       // Selector de idiomas
        hasDeliveryCalculator: hasCorporate,// Taxa de entrega fixa/dinâmica consoante bairro
        hasAdvancedAnalytics: hasCorporate  // Relatórios de vendas profundos
    };
};
